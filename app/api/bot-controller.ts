import { Client, GatewayIntentBits, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

interface UserData {
  credits: number;
  xp: number;
  level: number;
}

class DiscordBot {
  private static instance: DiscordBot;
  private client: Client;
  private channelId: string | null = null;
  private adminRoleId: string | null = null;
  private isRunning: boolean = false;
  private tickets: Map<string, string> = new Map(); // userId -> ticketMessageId
  private polls: Map<string, { question: string, options: string[], votes: Map<string, Set<string>> }> = new Map(); // messageId -> poll data
  private userData: Map<string, UserData> = new Map(); // userId -> UserData
  private rpsCommandCooldown: Set<string> = new Set(); // Set to store users on cooldown
  private userDataFilePath: string;

  private readonly levelThresholds = [
    { level: 1, xp: 0 },
    { level: 2, xp: 5 },
    { level: 3, xp: 10 },
    { level: 4, xp: 25 },
    { level: 5, xp: 50 },
    { level: 'Master', xp: 100 }
  ];

  private constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
      ]
    });

    this.userDataFilePath = path.join(process.cwd(), 'user_data.json');

    this.client.on('ready', () => {
      console.log(`Logged in as ${this.client.user?.tag}!`);
      this.loadUserData();
      this.sendMessage('Bot is now online!');
    });

    this.client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'open_ticket') {
        await this.openTicket(interaction);
      } else if (interaction.customId === 'close_ticket') {
        await this.closeTicket(interaction);
      } else if (interaction.customId.startsWith('poll_option_')) {
        await this.handlePollVote(interaction);
      }
    });

    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      await this.addXP(message.author.id, 1);

      if (message.content.startsWith('!')) {
        const command = message.content.slice(1).toLowerCase();
        if (['rock', 'paper', 'scissors'].includes(command)) {
          await this.playRockPaperScissors(message, command);
        } else if (command === 'credits') {
          await this.showCredits(message);
        } else if (command === 'level') {
          await this.showLevel(message);
        }
      }
    });
  }

  public static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  public async start(token: string, channelId: string, adminRoleId: string): Promise<void> {
    if (this.isRunning) {
      throw new Error('Bot is already running');
    }

    this.channelId = channelId;
    this.adminRoleId = adminRoleId;
    try {
      await this.client.login(token);
      this.isRunning = true;
      console.log('Bot started successfully');
    } catch (error) {
      console.error('Failed to start bot:', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Bot is not running');
    }

    try {
      await this.saveUserData();
      await this.client.destroy();
      this.isRunning = false;
      this.channelId = null;
      this.adminRoleId = null;
      console.log('Bot stopped successfully');
    } catch (error) {
      console.error('Failed to stop bot:', error);
      throw error;
    }
  }

  public async sendMessage(message: string): Promise<void> {
    if (!this.isRunning || !this.channelId) {
      throw new Error('Bot is not running or channel ID is not set');
    }

    const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
    if (channel?.isTextBased()) {
      const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('Open Ticket')
            .setStyle(ButtonStyle.Primary)
        );

      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('CS2SURF.PRO Support')
        .setDescription('Open a ticket!\nClick the button below, and a CS2SURF.PRO Support Representative will assist you as soon as possible!')
        .setFooter({ text: 'Powered by cs2surf.pro' });

      try {
        await channel.send({ embeds: [embed], components: [row] });
        console.log('Message sent successfully');
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    } else {
      throw new Error('Invalid channel or channel is not a text channel');
    }
  }

  private async openTicket(interaction: any) {
    if (this.tickets.has(interaction.user.id)) {
      await interaction.reply({ content: 'You already have an open ticket!', ephemeral: true });
      return;
    }

    if (!this.adminRoleId) {
      console.error('Admin role ID is not set');
      await interaction.reply({ content: 'Unable to create ticket. Please contact an administrator.', ephemeral: true });
      return;
    }

    try {
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel],
          },
          {
            id: this.adminRoleId,
            allow: [PermissionFlagsBits.ViewChannel],
          },
        ],
      });

      const closeButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('Close Ticket')
            .setStyle(ButtonStyle.Danger)
        );

      const message = await ticketChannel.send({
        content: `Ticket opened by ${interaction.user}. An admin will be with you shortly.`,
        components: [closeButton],
      });

      this.tickets.set(interaction.user.id, message.id);

      await interaction.reply({ content: `Ticket opened! Please check ${ticketChannel}`, ephemeral: true });
    } catch (error) {
      console.error('Failed to create ticket channel:', error);
      await interaction.reply({ content: 'An error occurred while creating the ticket. Please try again later.', ephemeral: true });
    }
  }

  private async closeTicket(interaction: any) {
    const ticketUserId = Array.from(this.tickets.entries()).find(([, messageId]) => messageId === interaction.message.id)?.[0];

    if (!ticketUserId) {
      await interaction.reply({ content: 'This ticket cannot be found or has already been closed.', ephemeral: true });
      return;
    }

    this.tickets.delete(ticketUserId);
    await interaction.channel.delete();
  }

  public getStatus(): { isRunning: boolean; botName: string | undefined; startTime: Date | null } {
    return {
      isRunning: this.isRunning,
      botName: this.getBotName(),
      startTime: this.getStartTime()
    };
  }

  public async createPoll(question: string, options: string[]): Promise<void> {
    if (!this.isRunning || !this.channelId) {
      throw new Error('Bot is not running or channel ID is not set');
    }

    const channel = this.client.channels.cache.get(this.channelId) as TextChannel;
    if (channel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('📊 ' + question)
        .setDescription(options.map((option, index) => `${index + 1}. ${option}`).join('\n'))
        .setFooter({ text: 'Vote by clicking a button below!' });
      
      const row = new ActionRowBuilder<ButtonBuilder>();
      options.forEach((_, index) => {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(`poll_option_${index}`)
            .setLabel(`Option ${index + 1}`)
            .setStyle(ButtonStyle.Primary)
        );
      });

      try {
        const sentMessage = await channel.send({
          embeds: [embed],
          components: [row]
        });
        this.polls.set(sentMessage.id, {
          question,
          options,
          votes: new Map(options.map((_, index) => [index.toString(), new Set()]))
        });
        console.log('Poll created successfully');
      } catch (error) {
        console.error('Failed to create poll:', error);
        throw error;
      }
    } else {
      throw new Error('Invalid channel or channel is not a text channel');
    }
  }
  
  public async updatePresence(presence: string): Promise<void> {
    if (!this.isRunning) {
      throw new Error('Bot is not running');
    }

    try {
      await this.client.user?.setActivity(presence);
      console.log('Bot presence updated successfully');
    } catch (error) {
      console.error('Failed to update bot presence:', error);
      throw error;
    }
  }

  private async handlePollVote(interaction: any) {
    const optionIndex = interaction.customId.split('_')[2];
    const pollData = this.polls.get(interaction.message.id);
  
    if (!pollData) {
      await interaction.reply({ content: 'This poll is no longer active.', ephemeral: true });
      return;
    }
  
    const userId = interaction.user.id;
  
    // Remove user's vote from all options
    pollData.votes.forEach(voters => voters.delete(userId));
  
    // Add user's vote to the selected option
    pollData.votes.get(optionIndex)?.add(userId);
  
    // Update poll message
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .setDescription(pollData.options.map((option, index) => {
        const voteCount = pollData.votes.get(index.toString())?.size || 0;
        return `${index + 1}. ${option} - ${voteCount} vote(s)`;
      }).join('\n'));
  
    await interaction.update({ embeds: [updatedEmbed] });
  }

  private async addXP(userId: string, amount: number): Promise<void> {
    let userData = this.userData.get(userId) || { credits: 0, xp: 0, level: 1 };
    userData.xp += amount;

    // Check for level up
    const nextLevel = this.levelThresholds.find(threshold => threshold.xp > userData.xp);
    if (nextLevel && nextLevel.level !== userData.level) {
      userData.level = nextLevel.level;
      // You can add more level up logic here, like sending a congratulatory message
    }

    this.userData.set(userId, userData);
    await this.saveUserData();
  }

  private async playRockPaperScissors(message: Message, playerChoice: string): Promise<void> {
    if (this.rpsCommandCooldown.has(message.author.id)) {
      await message.reply('You can only play once every 5 minutes!');
      return;
    }

    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result: string;
    if (playerChoice === botChoice) {
      result = "It's a tie!";
    } else if (
      (playerChoice === 'rock' && botChoice === 'scissors') ||
      (playerChoice === 'paper' && botChoice === 'rock') ||
      (playerChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You win!';
      await this.addCredits(message.author.id, 1);
    } else {
      result = 'You lose!';
    }

    await message.reply(`You chose ${playerChoice}, I chose ${botChoice}. ${result}`);

    // Set cooldown
    this.rpsCommandCooldown.add(message.author.id);
    setTimeout(() => this.rpsCommandCooldown.delete(message.author.id), 5 * 60 * 1000); // 5 minutes cooldown
  }

  private async addCredits(userId: string, amount: number): Promise<void> {
    let userData = this.userData.get(userId) || { credits: 0, xp: 0, level: 1 };
    userData.credits += amount;
    this.userData.set(userId, userData);
    await this.saveUserData();
  }

  private async showCredits(message: Message): Promise<void> {
    const userData = this.userData.get(message.author.id) || { credits: 0, xp: 0, level: 1 };
    await message.reply(`You have ${userData.credits} credits.`);
  }

  private async showLevel(message: Message): Promise<void> {
    const userData = this.userData.get(message.author.id) || { credits: 0, xp: 0, level: 1 };
    await message.reply(`You are level ${userData.level} with ${userData.xp} XP.`);
  }

  private async loadUserData(): Promise<void> {
    try {
      const data = await fs.readFile(this.userDataFilePath, 'utf-8');
      this.userData = new Map(Object.entries(JSON.parse(data)));
    } catch (error) {
      console.error('Failed to load user data:', error);
      // If file doesn't exist or is corrupted, start with an empty Map
      this.userData = new Map();
    }
  }

  private async saveUserData(): Promise<void> {
    try {
      const data = JSON.stringify(Object.fromEntries(this.userData));
      await fs.writeFile(this.userDataFilePath, data, 'utf-8');
    } catch (error) {
      console.error('Failed to save user data:', error);
    }
  }

  public async getUserStats(): Promise<Array<{ id: string; name: string; credits: number; xp: number; level: number | string }>> {
    const stats = [];
    for (const [userId, data] of this.userData.entries()) {
      try {
        const user = await this.client.users.fetch(userId);
        stats.push({
          id: userId,
          name: user.username,
          credits: data.credits,
          xp: data.xp,
          level: data.level,
        });
      } catch (error) {
        console.error(`Error fetching user ${userId}:`, error);
      }
    }
    return stats;
  }

  private getBotName(): string | undefined {
    return this.client.user?.username;
  }

  private getStartTime(): Date | null {
    return this.client.readyAt;
  }
}

export default DiscordBot;