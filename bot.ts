import { Client, GatewayIntentBits, TextChannel, ActionRowBuilder, ButtonBuilder, ButtonStyle, Message, ChannelType, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import fs from 'fs/promises';
import path from 'path';

interface UserData {
  name: string;
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
  private token: string | null = null;
  private tickets: Map<string, string> = new Map();
  private polls: Map<string, { question: string, options: string[], votes: Map<string, Set<string>> }> = new Map();
  private userData: Map<string, UserData> = new Map();
  private rpsCommandCooldown: Set<string> = new Set();
  private userDataFilePath: string;

  private readonly levelThresholds = [
    { level: 1, xp: 0 },
    { level: 2, xp: 5 },
    { level: 3, xp: 10 },
    { level: 4, xp: 25 },
    { level: 5, xp: 50 },
    { level: 6, xp: 75 },
    { level: 7, xp: 100 },
    { level: 8, xp: 150 },
    { level: 9, xp: 200 },
    { level: 10, xp: 300 },
    { level: 'Master', xp: 500 }
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

      await this.addXP(message.author.id, 1, message.channel as TextChannel);

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
      console.log('Bot is already running');
      return;
    }

    this.token = token;
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
      this.token = null;
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

  public async sendWarning(userId: string, title: string, message: string): Promise<void> {
    if (!this.isRunning || !this.token) {
      throw new Error('Bot is not running or not properly initialized');
    }

    try {
      const user = await this.client.users.fetch(userId);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle(`⚠️ ${title}`)
        .setDescription(message)
        .setTimestamp();

      await user.send({ embeds: [embed] });
      console.log(`Warning sent to user ${userId}`);
    } catch (error) {
      console.error(`Failed to send warning to user ${userId}:`, error);
      throw error;
    }
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

  private async handlePollVote(interaction: any) {
    const optionIndex = interaction.customId.split('_')[2];
    const pollData = this.polls.get(interaction.message.id);
  
    if (!pollData) {
      await interaction.reply({ content: 'This poll is no longer active.', ephemeral: true });
      return;
    }
  
    for (const [index, voters] of pollData.votes.entries()) {
      if (voters.has(interaction.user.id)) {
        voters.delete(interaction.user.id);
      }
    }
  
    
    const optionVoters = pollData.votes.get(optionIndex) || new Set();
    optionVoters.add(interaction.user.id);
    pollData.votes.set(optionIndex, optionVoters);
  

    const updatedEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('📊 ' + pollData.question)
      .setDescription(pollData.options.map((option, index) => {
        const voteCount = pollData.votes.get(index.toString())?.size || 0;
        return `${index + 1}. ${option} (${voteCount} vote${voteCount !== 1 ? 's' : ''})`;
      }).join('\n'))
      .setFooter({ text: 'Vote by clicking a button below!' });
  
    await interaction.update({ embeds: [updatedEmbed] });
    

    await interaction.followUp({ 
      content: `You voted for: ${pollData.options[parseInt(optionIndex)]}`, 
      ephemeral: true 
    });
  }

  private async playRockPaperScissors(message: Message, userChoice: string) {
    const userId = message.author.id;
    
    if (this.rpsCommandCooldown.has(userId)) {
      return;
    }


    this.rpsCommandCooldown.add(userId);

    setTimeout(() => {
      this.rpsCommandCooldown.delete(userId);
    }, 3000);

    const choices = ['rock', 'paper', 'scissors'];
    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result: string;
    if (userChoice === botChoice) {
      result = "It's a tie!";
    } else if (
      (userChoice === 'rock' && botChoice === 'scissors') ||
      (userChoice === 'paper' && botChoice === 'rock') ||
      (userChoice === 'scissors' && botChoice === 'paper')
    ) {
      result = 'You win!';
      await this.addCredits(message.author.id, 1);
    } else {
      result = 'You lose!';
    }

    const userData = await this.getUserData(message.author.id);
    await message.reply(`You chose ${userChoice}, I chose ${botChoice}. ${result}\nYour current credits: ${userData.credits}`);
  }

  private async showCredits(message: Message) {
    const userData = await this.getUserData(message.author.id);
    await message.reply(`Your current credit balance is: ${userData.credits}`);
  }

  private async showLevel(message: Message) {
    const userData = await this.getUserData(message.author.i);
    const nextLevel = this.levelThresholds.find(level => level.xp > userData.xp) || this.levelThresholds[this.levelThresholds.length - 1];
    const xpToNextLevel = nextLevel.xp - userData.xp;

    await message.reply(`Your current level is: ${userData.level}\nXP: ${userData.xp}\nXP needed for next level: ${xpToNextLevel}`);
  }

  private async addCredits(userId: string, amount: number) {
    const userData = await this.getUserData(userId);
    userData.credits += amount;
    await this.saveUserData();
  }

  private async addXP(userId: string, amount: number, channel: TextChannel) {
    const userData = await this.getUserData(userId);
    const oldLevel = userData.level;
    userData.xp += amount;

    const newLevel = this.calculateLevel(userData.xp);
    if (newLevel > oldLevel) {
      userData.level = newLevel;
      await this.announceLevelUp(userId, newLevel, channel);
    }

    const user = await this.client.users.fetch(userId);
    userData.name = user.username;

    await this.saveUserData();
  }

  private async announceLevelUp(userId: string, newLevel: number, channel: TextChannel) {
    const user = await this.client.users.fetch(userId);
    const userData = await this.getUserData(userId);
    const nextLevelThreshold = this.levelThresholds.find(lt => lt.level === newLevel + 1) || this.levelThresholds[this.levelThresholds.length - 1];
    const xpForNextLevel = nextLevelThreshold.xp - userData.xp;

    if (channel?.isTextBased()) {
      const embed = new EmbedBuilder()
        .setColor('#FFD700')
        .setTitle('🎉 Level Up! 🎉')
        .setDescription(`Congratulations ${user}! You've reached level ${newLevel}!`)
        .addFields(
          { name: 'Current XP', value: userData.xp.toString(), inline: true },
          { name: 'XP for Next Level', value: xpForNextLevel.toString(), inline: true }
        )
        .setImage('https://i.gyazo.com/3889e33ee9dfb72659f506cdb0c8fbdc.png')
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    }
  }

  private calculateLevel(xp: number): number {
    for (let i = this.levelThresholds.length - 1; i >= 0; i--) {
      if (xp >= this.levelThresholds[i].xp) {
        return typeof this.levelThresholds[i].level === 'number' ? this.levelThresholds[i].level : 6; // 6 for 'Master'
      }
    }
    return 1; 
  }

  private async getUserData(userId: string): Promise<UserData> {
    if (!this.userData.has(userId)) {
      await this.loadUserData();
    }
    if (!this.userData.has(userId)) {
      const user = await this.client.users.fetch(userId);
      this.userData.set(userId, { 
        name: user.username,
        credits: 0, 
        xp: 0, 
        level: 1 
      });
    }
    return this.userData.get(userId)!;
  }

  private async loadUserData() {
    try {
      const data = await fs.readFile(this.userDataFilePath, 'utf-8');
      const parsedData = JSON.parse(data);
      this.userData = new Map(Object.entries(parsedData));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        console.error('Error loading user data:', error);
      }
      this.userData = new Map();
    }
  }

  private async saveUserData() {
    const data = Object.fromEntries(this.userData);
    try {
      await fs.writeFile(this.userDataFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  private getBotName(): string | undefined {
    return this.client.user?.username;
  }

  private getStartTime(): Date | null {
    return this.client.readyAt;
  }
}

export default DiscordBot;
