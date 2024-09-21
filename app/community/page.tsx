import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDiscord, faSteam } from '@fortawesome/free-brands-svg-icons'

export default function Community() {
  return (
    <div className="flex flex-col min-h-screen bg-[#11141c] text-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <h1 className="text-4xl font-bold mb-8">Join Our Amazing Community!</h1>
        <p className="mb-6 text-lg">
          We're passionate about building a community that's all about collaboration, creativity, and fun! Whether you're a bot enthusiast, a gamer, or just someone who loves to chat, we'd love to have you join us!
        </p>
        <div className="flex justify-center mb-4">
          <a href="https://discord.com/invite/your-discord-invite" target="_blank" rel="noopener noreferrer" className="mr-4">
            <button className="px-4 py-2 bg-[#7289da] text-white font-bold rounded-md hover:bg-[#5865f2] focus:outline-none focus:ring-2 focus:ring-[#7289da] transition-colors duration-200">
              <FontAwesomeIcon icon={faDiscord} className="w-6 h-6 mr-2" />
              Join Our Discord Server
            </button>
          </a>
          <a href="https://steamcommunity.com/groups/your-steam-group" target="_blank" rel="noopener noreferrer">
            <button className="px-4 py-2 bg-[#00698f] text-white font-bold rounded-md hover:bg-[#007bff] focus:outline-none focus:ring-2 focus:ring-[#00698f] transition-colors duration-200">
              <FontAwesomeIcon icon={faSteam} className="w-6 h-6 mr-2" />
              Join Our Steam Group
            </button>
          </a>
        </div>
        <p className="text-lg">
          By joining our community, you'll get access to exclusive updates, behind-the-scenes content, and a chance to connect with like-minded individuals who share your passions. We can't wait to welcome you to the family!
        </p>
      </main>
      <Footer />
    </div>
  )
}