// src/app/api/trigger-capture/route.ts
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