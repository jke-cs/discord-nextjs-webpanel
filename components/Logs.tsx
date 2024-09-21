"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'

interface LogMessage {
  id: string
  timestamp: string
  message: string
  type: 'info' | 'warning' | 'error'
}

export default function LogsWidget() {
  const [logs, setLogs] = useState<LogMessage[]>([])
  const [isExpanded, setIsExpanded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('/api/logs')
        if (!response.ok) {
          throw new Error('Failed to fetch logs')
        }
        const data = await response.json()
        setLogs(data)
      } catch (err) {
        setError('Failed to load logs. Please try again later.')
      }
    }

    fetchLogs()
  }, [])

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  const visibleLogs = isExpanded ? logs : logs.slice(-3)

  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg relative z-10 border border-gray-700"
    >
      <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
        <MessageSquare className="mr-2" /> Logs
      </h2>
      <div className="space-y-4">
        <AnimatePresence>
          {visibleLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`p-4 rounded-lg ${
                log.type === 'info' ? 'bg-blue-500 bg-opacity-20' :
                log.type === 'warning' ? 'bg-yellow-500 bg-opacity-20' :
                'bg-red-500 bg-opacity-20'
              }`}
            >
              <p className="text-sm text-gray-300">{log.timestamp}</p>
              <p className={`mt-1 ${
                log.type === 'info' ? 'text-blue-300' :
                log.type === 'warning' ? 'text-yellow-300' :
                'text-red-300'
              }`}>
                {log.message}
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {logs.length > 3 && (
        <button
          onClick={toggleExpand}
          className="mt-4 flex items-center justify-center w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded transition duration-200 ease-in-out"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="mr-2" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="mr-2" />
              Show More
            </>
          )}
        </button>
      )}
    </motion.div>
  )
}