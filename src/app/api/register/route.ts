// src/app/api/register/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    const response = await fetch('http://localhost:3001/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      // Add these options to handle connection issues
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server response:', errorText);
      throw new Error(errorText || 'Failed to register with face recognition server');
    }

    const result = await response.json();
    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error('Error in register route:', error);
    
    // Check if error is due to server not running
    if (error instanceof TypeError && error.message.includes('fetch failed')) {
      return NextResponse.json(
        { error: 'Face recognition server is not running. Please start the server.' },
        { status: 503 }
      );
    }
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to register user';

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}