"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { User, CreditCard, Zap, BarChart2, Hash, AlertTriangle, MessageCircle } from 'lucide-react'

interface UserData {
  id: string
  name: string
  credits: number
  xp: number
  level: number
}

export default function UserStatsWidget() {
  const [usersData, setUsersData] = useState<UserData[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isWarningModalOpen, setIsWarningModalOpen] = useState(false)
  const [warningTitle, setWarningTitle] = useState('')
  const [warningMessage, setWarningMessage] = useState('')
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null)

  useEffect(() => {
    const fetchUsersData = async () => {
      try {
        const response = await fetch('/api/user-stats')
        if (!response.ok) {
          throw new Error('Failed to fetch user statistics')
        }
        const data = await response.json()
        setUsersData(data)
      } catch (err) {
        setError('Failed to load user statistics. Please try again later.')
      }
    }

    fetchUsersData()
  }, [])

  const handleWarnClick = (user: UserData) => {
    setSelectedUser(user)
    setIsWarningModalOpen(true)
  }

  const handleSendWarning = async () => {
    if (selectedUser) {
      try {
        const response = await fetch('/api/send-warning', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            title: warningTitle,
            message: warningMessage,
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to send warning')
        }

        // Reset the form and close the modal
        setWarningTitle('')
        setWarningMessage('')
        setIsWarningModalOpen(false)
        setSelectedUser(null)
      } catch (error) {
        console.error('Error sending warning:', error)
        // Handle error (e.g., show an error message to the user)
      }
    }
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (usersData.length === 0) {
    return <div>Loading user statistics...</div>
  }

  const levelThresholds = [0, 5, 10, 25, 50, 100]

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg relative z-10 border border-gray-700"
    >
      <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
        <User className="mr-2" /> User Statistics
      </h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <User className="inline mr-1 h-4 w-4" /> Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <Hash className="inline mr-1 h-4 w-4" /> ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <CreditCard className="inline mr-1 h-4 w-4" /> Credits
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <MessageCircle className="inline mr-1 h-4 w-4" /> Messages
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <Zap className="inline mr-1 h-4 w-4" /> Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                <BarChart2 className="inline mr-1 h-4 w-4" /> XP Progress
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {usersData.map((user) => {
              const currentLevelXP = levelThresholds[user.level - 1] || 0
              const nextLevelXP = levelThresholds[user.level] || levelThresholds[levelThresholds.length - 1]
              const xpProgress = ((user.xp - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100

              return (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.credits}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.xp}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">{user.level}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="w-full bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 h-2.5 rounded-full" 
                        style={{ width: `${xpProgress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-300 mt-1 block">
                      {user.xp}/{nextLevelXP} XP
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-100">
                    <button
                      onClick={() => handleWarnClick(user)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded inline-flex items-center"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      WARN
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {isWarningModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4 text-gray-100">Send Warning</h3>
            <input
              type="text"
              placeholder="Warning Title"
              value={warningTitle}
              onChange={(e) => setWarningTitle(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded"
            />
            <textarea
              placeholder="Warning Message"
              value={warningMessage}
              onChange={(e) => setWarningMessage(e.target.value)}
              className="w-full p-2 mb-4 bg-gray-700 text-gray-100 rounded h-32"
            />
            <div className="flex justify-end">
              <button
                onClick={() => setIsWarningModalOpen(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded mr-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSendWarning}
                className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
              >
                Send Warning
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}