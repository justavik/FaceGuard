// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Camera } from '../components/Camera'
import { FaceVerification } from '../components/FaceVerification'
import { UserPlus, Shield, AlertCircle } from 'lucide-react'

interface User {
  id: string;
  name: string;
}

interface RegistrationResponse {
  success: boolean;
  user: User;
}

export default function Home() {
  const [isRegistering, setIsRegistering] = useState(false)
  const [userName, setUserName] = useState('')
  const [lastEvent, setLastEvent] = useState<{ type: string; message: string } | null>(null)

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:3002')
    ws.onopen = () => console.log('WebSocket connected')
    ws.onerror = (error) => console.error('WebSocket error:', error)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'access_attempt') {
        setLastEvent({
          type: data.success ? 'success' : 'error',
          message: data.message
        })
      }
    }
    return () => ws.close()
  }, [])

  const handleRegister = async (imageData: string) => {
    if (!userName.trim()) {
      setLastEvent({
        type: 'error',
        message: 'Please enter a name for registration'
      })
      return
    }
  
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: userName, image: imageData }),
      })
  
      const responseData = await response.text()
  
      if (response.ok) {
        const result: RegistrationResponse = JSON.parse(responseData)
        if (result.success && result.user) {
          setIsRegistering(false)
          setUserName('')
          setLastEvent({
            type: 'success',
            message: `✅ Successfully registered ${result.user.name}`
          })
        } else {
          throw new Error('Invalid registration response format')
        }
      } else {
        throw new Error(`Failed to register user: ${responseData}`)
      }
    } catch (error) {
      console.error('Error registering user:', error)
      setLastEvent({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to register user'
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Event Log */}
      {lastEvent && (
        <div className={`transform transition-all duration-500 ease-in-out
          ${lastEvent.type === 'success' ? 'bg-green-500/20' : 'bg-red-500/20'}
          backdrop-blur-lg rounded-lg p-4 border
          ${lastEvent.type === 'success' ? 'border-green-500/20' : 'border-red-500/20'}`}>
          <div className="flex items-center">
            {lastEvent.type === 'success' ? (
              <Shield className="w-5 h-5 text-green-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <p className={`ml-2 text-sm ${
              lastEvent.type === 'success' ? 'text-green-300' : 'text-red-300'
            }`}>
              {lastEvent.message}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-8 md:grid-cols-2">
        {/* Registration Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
          <div className="p-6">
            <div className="flex items-center">
              <UserPlus className="w-6 h-6 text-purple-400" />
              <h2 className="ml-2 text-xl font-medium text-white">
                User Registration
              </h2>
            </div>
            
            <div className="mt-6">
              {isRegistering ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter user name"
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg
                      text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                      focus:ring-purple-500 focus:border-transparent"
                  />
                  <Camera onCapture={handleRegister} />
                  <button
                    onClick={() => setIsRegistering(false)}
                    className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 
                      border border-white/10 rounded-lg text-gray-300
                      transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsRegistering(true)}
                  className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 
                    text-white rounded-lg transition-colors duration-200"
                >
                  Register New User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Verification Section */}
        <FaceVerification />
      </div>
    </div>
  )
}