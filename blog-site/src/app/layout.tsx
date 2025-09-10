import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AgentRadar Blog - Real Estate Intelligence Insights',
  description: 'Expert insights, market analysis, and real estate intelligence from AgentRadar',
  keywords: 'real estate, property investment, market analysis, real estate technology',
  authors: [{ name: 'AgentRadar Team' }],
  openGraph: {
    title: 'AgentRadar Blog - Real Estate Intelligence Insights',
    description: 'Expert insights, market analysis, and real estate intelligence from AgentRadar',
    url: 'https://blog.agentradar.app',
    siteName: 'AgentRadar Blog',
    images: [
      {
        url: 'https://blog.agentradar.app/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AgentRadar Blog - Real Estate Intelligence Insights',
    description: 'Expert insights, market analysis, and real estate intelligence from AgentRadar',
    images: ['https://blog.agentradar.app/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <a href="https://agentradar.app" className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AR</span>
                  </div>
                  <span className="text-xl font-bold text-gray-900">AgentRadar</span>
                </a>
                <span className="ml-2 text-sm text-gray-500">Blog</span>
              </div>
              <nav className="flex items-center space-x-6">
                <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
                <a href="/insights" className="text-gray-600 hover:text-gray-900">Insights</a>
                <a href="/market-analysis" className="text-gray-600 hover:text-gray-900">Market Analysis</a>
                <a href="/guides" className="text-gray-600 hover:text-gray-900">Guides</a>
                <a href="https://agentradar.app" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  Back to App
                </a>
              </nav>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-gray-900 text-gray-300">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">AR</span>
                  </div>
                  <span className="text-xl font-bold text-white">AgentRadar</span>
                </div>
                <p className="text-gray-400">
                  Leading real estate intelligence platform with AI-powered insights and market analysis.
                </p>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Products</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="https://agentradar.app" className="hover:text-white">Platform</a></li>
                  <li><a href="https://agentradar.app/pricing" className="hover:text-white">Pricing</a></li>
                  <li><a href="https://agentradar.app/demo" className="hover:text-white">Demo</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Resources</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="/" className="hover:text-white">Blog</a></li>
                  <li><a href="https://community.agentradar.app" className="hover:text-white">Community</a></li>
                  <li><a href="https://agentradar.app/help" className="hover:text-white">Help Center</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-semibold mb-4">Company</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="https://agentradar.app/about" className="hover:text-white">About</a></li>
                  <li><a href="https://careers.agentradar.app" className="hover:text-white">Careers</a></li>
                  <li><a href="https://agentradar.app/contact" className="hover:text-white">Contact</a></li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 AgentRadar. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}