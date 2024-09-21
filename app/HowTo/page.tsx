import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function HowTo() {
  return (
    <div className="flex flex-col min-h-screen bg-[#11141c] text-white">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-24">
        <h1 className="text-4xl font-bold mb-8">How to Install and Set Up Nextpeek Bot</h1>
        <p className="mb-4 text-lg">
          Follow these easy steps to get started with Nextpeek Bot:
        </p>
        <div className="bg-[#222831] p-4 rounded-md mb-4">
          <h2 className="text-2xl font-bold mb-2">Step 1: Install Node.js and npm</h2>
          <p className="mb-2">
            Make sure you have Node.js and npm installed on your computer. You can download and install them from the official Node.js website.
          </p>
          <a href="https://nodejs.org/en/download/" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700">
            Download Node.js
          </a>
        </div>
        <div className="bg-[#222831] p-4 rounded-md mb-4">
          <h2 className="text-2xl font-bold mb-2">Step 2: Clone the Repository</h2>
          <p className="mb-2">
            Clone the DiscordBot Central repository using Git:
          </p>
          <code className="bg-[#333] p-2 rounded-md">git clone https://github.com/jke-cs/discord-webpanel.git</code>
        </div>
        <div className="bg-[#222831] p-4 rounded-md mb-4">
          <h2 className="text-2xl font-bold mb-2">Step 3: Install Dependencies</h2>
          <p className="mb-2">
            Navigate to the cloned repository and install the dependencies using npm:
          </p>
          <code className="bg-[#333] p-2 rounded-md">npm install</code>
        </div>
        <div className="bg-[#222831] p-4 rounded-md mb-4">
          <h2 className="text-2xl font-bold mb-2">Step 4: Start the Website</h2>
          <p className="mb-2">
            Start the website using npm:
          </p>
          <code className="bg-[#333] p-2 rounded-md">npm run dev</code>
        </div>
        <div className="bg-[#222831] p-4 rounded-md mb-4">
          <h2 className="text-2xl font-bold mb-2">Step 5: Create a Discord Bot</h2>
          <p className="mb-2">
            Create a new Discord bot on the Discord Developer Portal:
          </p>
          <ol className="list-decimal ml-4">
            <li>Go to the Discord Developer Portal and create a new bot.</li>
            <li>Click on the "Bot" tab and then click on "Add Bot".</li>
            <li>Give your bot a name and click "Save".</li>
            <li>Click on the "Token" tab and copy the bot token.</li>
          </ol>
        </div>
        <p className="text-lg">
          That's it! You should now have the panel up and running with your own Discord bot.
        </p>
      </main>
      <Footer />
    </div>
  )
}