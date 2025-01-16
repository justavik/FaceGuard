// src/app/api/events/route.ts
import { NextResponse } from 'next/server';
import eventEmitter from '@/lib/eventEmitter';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      console.log('Client connected to events stream');
      
      // Send initial connection message
      controller.enqueue(encoder.encode('data: connected\n\n'));
      
      // Handle capture events
      const handleCapture = () => {
        console.log('Sending capture event to client');
        controller.enqueue(encoder.encode('data: capture-requested\n\n'));
      };
      
      eventEmitter.on('capture-requested', handleCapture);
      
      return () => {
        console.log('Client disconnected, cleaning up');
        eventEmitter.off('capture-requested', handleCapture);
      };
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}