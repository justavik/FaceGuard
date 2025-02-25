import './globals.css'
import { Inter } from 'next/font/google'
import { Camera } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FaceGuard Pro',
  description: 'Next-gen facial recognition access control system',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800">
          <nav className="bg-black/20 backdrop-blur-lg border-b border-white/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  <Camera className="w-8 h-8 text-purple-400" />
                  <h1 className="ml-2 text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
                    FaceGuard
                  </h1>
                </div>
                <div className="flex items-center">
                  <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
                  <span className="ml-2 text-sm text-gray-300">System Active</span>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

