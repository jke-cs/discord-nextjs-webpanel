import { NextApiRequest, NextApiResponse } from 'next';
import DiscordBot from '../../bot';

const bot = new DiscordBot();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { action, token, channelId, adminRoleId, message, question, options, presence, userId, title, warningMessage } = req.body;

    switch (action) {
      case 'start':
        if (!token || !channelId || !adminRoleId) {
          return res.status(400).json({ error: 'Token, channelId, and adminRoleId are required' });
        }
        try {
          await bot.start(token, channelId, adminRoleId);
          const status = bot.getStatus();
          return res.status(200).json({ 
            message: 'Bot started successfully',
            ...status
          });
        } catch (error) {
          console.error('Failed to start bot:', error);
          return res.status(500).json({ error: 'Failed to start bot', details: error.message });
        }

      case 'stop':
        try {
          await bot.stop();
          return res.status(200).json({ message: 'Bot stopped successfully' });
        } catch (error) {
          console.error('Failed to stop bot:', error);
          return res.status(500).json({ error: 'Failed to stop bot', details: error.message });
        }

      case 'status':
        return res.status(200).json(bot.getStatus());

      case 'sendMessage':
        if (!message) {
          return res.status(400).json({ error: 'Message is required' });
        }
        try {
          await bot.sendMessage(message);
          return res.status(200).json({ message: 'Message sent successfully' });
        } catch (error) {
          console.error('Failed to send message:', error);
          return res.status(500).json({ error: 'Failed to send message', details: error.message });
        }

      case 'createPoll':
        if (!question || !options || options.length < 2) {
          return res.status(400).json({ error: 'Question and at least two options are required' });
        }
        try {
          await bot.createPoll(question, options);
          return res.status(200).json({ message: 'Poll created successfully' });
        } catch (error) {
          console.error('Failed to create poll:', error);
          return res.status(500).json({ error: 'Failed to create poll', details: error.message });
        }

      case 'updatePresence':
        if (!presence) {
          return res.status(400).json({ error: 'Presence is required' });
        }
        try {
          await bot.updatePresence(presence);
          return res.status(200).json({ message: 'Bot presence updated successfully' });
        } catch (error) {
          console.error('Failed to update bot presence:', error);
          return res.status(500).json({ error: 'Failed to update bot presence', details: error.message });
        }

      case 'sendWarning':
        if (!userId || !title || !warningMessage) {
          return res.status(400).json({ error: 'UserId, title, and warningMessage are required' });
        }
        try {
          await bot.sendWarning(userId, title, warningMessage);
          return res.status(200).json({ message: 'Warning sent successfully' });
        } catch (error) {
          console.error('Failed to send warning:', error);
          return res.status(500).json({ error: 'Failed to send warning', details: error.message });
        }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}