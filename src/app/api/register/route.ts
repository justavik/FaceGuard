/**
 * The POST function handles the registration of a user with a face recognition server.
 * It receives a request containing user data, forwards this data to the face recognition server,
 * and returns the server's response.
 * 
 * The function performs the following steps:
 * 1. Parses the JSON data from the incoming request.
 * 2. Sends the parsed data to the face recognition server at 'http://localhost:3001/api/register' using a POST request.
 *    - The request includes a 30-second timeout to prevent hanging.
 * 3. Checks if the response from the face recognition server is successful.
 *    - If not, it logs the error and throws an exception.
 * 4. Parses the JSON response from the face recognition server and returns it.
 * 
 * If an error occurs during the process, the function handles it by:
 * - Logging the error.
 * - Returning a 503 status code if the face recognition server is not running.
 * - Returning a 500 status code for other errors, along with an appropriate error message.
 */

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