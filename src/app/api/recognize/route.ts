// src/app/api/recognize/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const response = await fetch('http://localhost:3001/api/recognize', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Server response:', errorText)
      throw new Error(errorText || 'Failed to verify face')
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error: unknown) {
    console.error('Error in recognize route:', error)
    
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Face recognition server is not running. Please start the server.' },
        { status: 503 }
      )
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to verify face'

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}