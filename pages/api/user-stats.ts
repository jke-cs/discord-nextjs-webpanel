import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    try {
      const userDataPath = path.join(process.cwd(), 'user_data.json')
      const userData = JSON.parse(fs.readFileSync(userDataPath, 'utf8'))
      
      const allUsersData = Object.entries(userData).map(([id, data]: [string, any]) => ({
        id,
        name: data.name,
        credits: data.credits,
        xp: data.xp,
        level: data.level
      }))

      res.status(200).json(allUsersData)
    } catch (error) {
      console.error('Error reading user data:', error)
      res.status(500).json({ error: 'Failed to load user statistics' })
    }
  } else {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}