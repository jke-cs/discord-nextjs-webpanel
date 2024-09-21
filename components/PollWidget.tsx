'use client'

import { useState } from 'react'
import { PlusCircle, MinusCircle, Send } from 'lucide-react'

export default function PollWidget() {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [statusMessage, setStatusMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const addOption = () => {
    setOptions([...options, ''])
  }

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index))
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options]
    newOptions[index] = value
    setOptions(newOptions)
  }

  const createPoll = async () => {
    if (!question || options.some(option => !option)) {
      setStatusMessage('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/bot-controller', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createPoll', question, options }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatusMessage('Poll created successfully')
        setQuestion('')
        setOptions(['', ''])
      } else {
        setStatusMessage(`Failed to create poll: ${data.error}. Details: ${data.details || 'No additional details'}`)
      }
    } catch (error) {
      setStatusMessage(`An error occurred while creating the poll: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-gray-800 bg-opacity-50 p-6 rounded-lg shadow-lg backdrop-filter backdrop-blur-lg border border-gray-700">
      <h2 className="text-2xl font-semibold mb-4 flex items-center text-gray-100">
        Create Poll
      </h2>
      <div className="space-y-4">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter your question"
        />
        {options.map((option, index) => (
          <div key={index} className="flex space-x-2">
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="flex-grow px-3 py-2 bg-gray-700 bg-opacity-50 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Option ${index + 1}`}
            />
            {index > 1 && (
              <button onClick={() => removeOption(index)} className="text-red-500">
                <MinusCircle />
              </button>
            )}
          </div>
        ))}
        <button onClick={addOption} className="text-green-500">
          <PlusCircle /> Add Option
        </button>
        <button
          onClick={createPoll}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-md font-bold transition-colors duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : (
            <>
              <Send className="mr-2" /> Create Poll
            </>
          )}
        </button>
        {statusMessage && (
          <div className={`mt-4 p-2 bg-gray-700 bg-opacity-50 rounded-md text-center ${
            statusMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'
          }`}>
            {statusMessage}
          </div>
        )}
      </div>
    </div>
  )
}