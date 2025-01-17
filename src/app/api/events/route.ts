/** The GET function in this route sets up a server-sent events (SSE) stream to communicate with clients in real-time.
 * 
 * The function performs the following tasks:
 * 
 * - Creates a ReadableStream to handle the SSE connection.
 * - Sends an initial connection message to the client upon connection.
 * - Listens for 'capture-requested' events from an event emitter and sends these events to the client.
 * - Cleans up event listeners when the client disconnects.
 * 
 * The stream is returned as a NextResponse with appropriate headers to maintain the SSE connection.
 * 
 * The eventEmitter is used to handle custom events and notify the client in real-time.
 */

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