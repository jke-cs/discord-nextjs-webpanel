'use client'

import { useState, useEffect } from 'react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PollWidget from '@/components/PollWidget'
import Logs from '@/components/Logs'
import UserStatsWidget from '@/components/UserStatsWidget'
import { motion } from 'framer-motion'
import { Bot, Zap, MessageCircle, Send, Power, Save, Clock, Activity } from 'lucide-react'

export default function Component() {
  const [botToken, setBotToken] = useState('')
  const [channelId, setChannelId] = useState('')
  const [adminRoleId, setAdminRoleId] = useState('')
  const [botMessage, setBotMessage] = useState('')
  const [botStatus, setBotStatus] = useState(false)
  const [statusMessage, setStatusMessage] = useState('')
  const [botName, setBotName] = useState('')
  const [startTime, setStartTime] = useState(null)
  const [uptime, setUptime] = useState('')
  const [botPresence, setBotPresence] = useState('')

  useEffect(() => {
    const savedToken = localStorage.getItem('botToken')
    const savedChannelId = localStorage.getItem('channelId')
    const savedAdminRoleId = localStorage.getItem('adminRoleId')
    if (savedToken) setBotToken(savedToken)
    if (savedChannelId) setChannelId(savedChannelId)
    if (savedAdminRoleId) setAdminRoleId(savedAdminRoleId)

    const checkStatus = async () => {
      const res = await fetch('/api/bot-controller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'status' }),
      })
      if (res.ok) {
        const data = await res.json()
        setBotStatus(data.isRunning)
        if (data.isRunning) {
          setBotName(data.botName || '')
          setStartTime(data.startTime ? new Date(data.startTime) : null)
        } else {
          setBotName('')
          setStartTime(null)
          setUptime('')
        }
      }
    }

    // Check status immediately on page load
    checkStatus()

    // Set up an interval to check status every 5 seconds
    const statusInterval = setInterval(checkStatus, 5000)

    // Clean up the interval on component unmount
    return () => clearInterval(statusInterval)
  }, [])

  useEffect(() => {
    let interval
    if (startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now - startTime
        const hours = Math.floor(diff / 3600000)
        const minutes = Math.floor((diff % 3600000) / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        setUptime(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [startTime])

  const saveConfiguration = () => {
    localStorage.setItem('botToken', botToken)
    localStorage.setItem('channelId', channelId)
    localStorage.setItem('adminRoleId', adminRoleId)
    setStatusMessage('Configuration saved successfully')
  }

  const startBot = async () => {
    const res = await fetch('/api/bot-controller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', token: botToken, channelId, adminRoleId }),
    })
    if (res.ok) {
      const data = await res.json()
      setBotStatus(true)
      setBotName(data.botName || '')
      setStartTime(data.startTime ? new Date(data.startTime) : new Date())
      setStatusMessage('Bot activated successfully')
    } else {
      setStatusMessage('Failed to activate bot')
    }
  }

  const stopBot = async () => {
    const res = await fetch('/api/bot-controller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop' }),
    })
    if (res.ok) {
      setBotStatus(false)
      setBotName('')
      setStartTime(null)
      setUptime('')
      setStatusMessage('Bot deactivated successfully')
    } else {
      setStatusMessage('Failed to deactivate bot')
    }
  }

  const sendMessage = async () => {
    const res = await fetch('/api/bot-controller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'sendMessage', message: botMessage }),
    })
    if (res.ok) {
      setStatusMessage('Message sent successfully')
    } else {
      setStatusMessage('Failed to send message')
    }
  }

  const updateBotPresence = async () => {
    const res = await fetch('/api/bot-controller', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'updatePresence', presence: botPresence }),
    })
    if (res.ok) {
      setStatusMessage('Bot presence updated successfully')
    } else {
      setStatusMessage('Failed to update bot presence')
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#11141c] text-gray-200">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24 relative overflow-hidden">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute -top-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"
        />
        <motion.div
          initial={{ scale: 0, rotate: 180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute -bottom-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"
        />
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"
        />

        <motion.h1 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-bold mb-8 text-center relative text-gray-100"
        >
          DiscordBot Control Center
        </motion.h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          <motion.div 
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg border border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
              <Bot className="mr-2" /> Bot Configuration
            </h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="botToken" className="block mb-1 text-gray-300">Bot Token:</label>
                <input
                  type="password"
                  id="botToken"
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your bot token"
                />
              </div>
              <div>
                <label htmlFor="channelId" className="block mb-1 text-gray-300">Channel ID:</label>
                <input
                  type="text"
                  id="channelId"
                  value={channelId}
                  onChange={(e) => setChannelId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter channel ID"
                />
              </div>
              <div>
                <label htmlFor="adminRoleId" className="block mb-1 text-gray-300">Admin Role ID:</label>
                <input
                  type="text"
                  id="adminRoleId"
                  value={adminRoleId}
                  onChange={(e) => setAdminRoleId(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin role ID"
                />
              </div>
              <button
                onClick={saveConfiguration}
                className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 rounded-md font-bold transition-colors duration-200 flex items-center justify-center"
              >
                <Save className="mr-2" /> Save Configuration
              </button>
            </div>
          </motion.div>
          
          <motion.div 
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg border border-gray-700"
          >
            <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
              <Zap className="mr-2" /> Bot Controls
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg text-gray-300">Bot Status: 
                  <span className={`ml-2 ${botStatus ? 'text-green-400' : 'text-red-400'}`}>
                    {botStatus ? 'Online' : 'Offline'}
                  </span>
                </span>
                <button
                  onClick={botStatus ? stopBot : startBot}
                  className={`px-4 py-2 rounded-md font-bold transition-colors duration-200 flex items-center ${
                    botStatus ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
                  }`}
                >
                  <Power className="mr-2" />
                  {botStatus ? 'Deactivate' : 'Activate'}
                </button>
              </div>
              {botStatus && botName && (
                <div className="text-gray-300">
                  <span>Bot Name: {botName}</span>
                </div>
              )}
              {botStatus && uptime && (
                <div className="flex items-center text-gray-300">
                  <Clock className="mr-2" />
                  <span>Uptime: {uptime}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={botPresence}
                  onChange={(e) => setBotPresence(e.target.value)}
                  className="flex-grow px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Set bot presence (e.g., 'playing cs2surf.pro')"
                />
                <button
                  onClick={updateBotPresence}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md font-bold transition-colors duration-200 flex items-center"
                  disabled={!botStatus}
                >
                  <Activity className="mr-2" /> Update
                </button>
              </div>
              {statusMessage && (
                <div className="mt-4 p-2 bg-gray-700 bg-opacity-50 rounded-md text-center text-gray-200">
                  {statusMessage}
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-8 bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg relative z-10 border border-gray-700"
        >
          <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
            <MessageCircle className="mr-2" /> Send Message
          </h2>
          <div className="flex space-x-4">
            <input
              type="text"
              value={botMessage}
              onChange={(e) => setBotMessage(e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your message"
            />
            <button
              onClick={sendMessage}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md font-bold transition-colors duration-200 flex items-center"
            >
              <Send className="mr-2" /> Send
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8 relative z-10"
        >
          <PollWidget />
        </motion.div>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-8 relative z-10"
        >
          <Logs />
        </motion.div>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.0 }}
          className="mt-8 relative z-10"
        >
          <UserStatsWidget />
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}