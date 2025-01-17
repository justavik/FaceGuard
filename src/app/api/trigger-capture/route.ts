/** The route.ts file defines two API endpoints using Next.js server functions to manage a capture trigger state.
 * 
 * The POST function:
 * - Sets a trigger with the current timestamp using the setTrigger function.
 * - Logs the timestamp to the console.
 * - Returns a JSON response indicating success, along with a message and the timestamp.
 * 
 * The GET function:
 * - Retrieves the current trigger timestamp using the getTrigger function.
 * - Returns a JSON response with the timestamp.
 * 
 * These endpoints allow clients to trigger a capture event and check the current trigger state.
 */

import { NextResponse } from 'next/server';
import { setTrigger, getTrigger } from '@/lib/triggerState';

export async function POST() {
  const timestamp = setTrigger();
  console.log('Trigger set with timestamp:', timestamp);
  
  return NextResponse.json({ 
    success: true, 
    message: 'Capture triggered',
    timestamp 
  });
}

// Add a GET endpoint to check trigger state
export async function GET() {
  return NextResponse.json({ 
    timestamp: getTrigger() 
  });
}