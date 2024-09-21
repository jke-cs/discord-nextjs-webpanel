import type { NextApiRequest, NextApiResponse } from 'next'
import DiscordBot from '../../bot'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { userId, title, message } = req.body

    if (!userId || !title || !message) {
      return res.status(400).json({ error: 'UserId, title, and message are required' })
    }

    const bot = DiscordBot.getInstance();

    try {
      // Check if the bot is running
      if (!bot.getStatus().isRunning) {
        // If the bot is not running, try to start it
        // Note: You'll need to securely store and retrieve these values
        const token = process.env.DISCORD_BOT_TOKEN;
        const channelId = process.env.DISCORD_CHANNEL_ID;
        const adminRoleId = process.env.DISCORD_ADMIN_ROLE_ID;

        if (!token || !channelId || !adminRoleId) {
          throw new Error('Bot configuration is missing. Please check your environment variables.');
        }

        await bot.start(token, channelId, adminRoleId);
      }

      await bot.sendWarning(userId, title, message)
      res.status(200).json({ message: 'Warning sent successfully' })
    } catch (error) {
      console.error('Error sending warning:', error)
      res.status(500).json({ error: 'Failed to send warning', details: error.message })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}