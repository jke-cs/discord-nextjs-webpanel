'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faHouse, faQuestionCircle, faPeople, faBars } from '@fortawesome/free-solid-svg-icons'
import { Bot } from 'lucide-react'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="bg-gray-800 text-white fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-white focus:outline-none focus:text-white z-50 -ml-2"
          >
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          </button>
          <div className="ml-4 flex-grow flex justify-center">
            <Link href="/" className="text-xl font-bold flex items-center">
              <Bot className="h-6 w-6 mr-2" />
              <span>NEXTPEEK - BOT</span>
            </Link>
          </div>
        </div>
      </div>
      <nav
        className={`fixed top-0 left-0 bottom-0 z-40 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-2 pt-20 pb-3 space-y-1">
          <Link
            href="/"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faHouse} className="h-6 w-6 mr-2" />
            Home
          </Link>
          <Link
            href="/HowTo"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faQuestionCircle} className="h-6 w-6 mr-2" />
            How To?
          </Link>
          <Link
            href="/community"
            className="block px-3 py-2 rounded-md text-base font-medium text-white hover:bg-gray-700"
          >
            Community
          </Link>
        </div>
      </nav>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </header>
  )
}