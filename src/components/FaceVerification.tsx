/**
 * The FaceVerification component is a functional component that handles the process of verifying a user's identity using facial recognition.
 * It uses the Camera component to capture an image from the user's camera and sends this image to the server for verification.
 * The component displays the verification result, including success or failure messages, and user information if the verification is successful.
 * 
 * The component maintains two pieces of state:
 * - verificationResult: Stores the result of the verification process, including success status, user information, confidence level, and any message.
 * - lastAttemptTime: Stores the timestamp of the last verification attempt to prevent multiple attempts within a short period.
 * 
 * The handleVerify function is responsible for sending the captured image to the server and updating the verification result.
 * It prevents multiple verification attempts within 3 seconds and clears the verification result after 5 seconds.
 * 
 * The component renders a title, the verification result (if available), and the Camera component.
 * The Camera component is configured to operate in "verify" mode and calls the handleVerify function when an image is captured.
 */

import React, { useState } from 'react';
import { Camera } from './Camera';
import { Shield, AlertCircle, Fingerprint } from 'lucide-react';

interface VerificationResult {
  success: boolean;
  user?: {
    name: string;
    id: string;
  };
  confidence?: number;
  message?: string;
}

export function FaceVerification() {
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [lastAttemptTime, setLastAttemptTime] = useState<Date | null>(null);

  /**
   * Handles the verification process by sending the captured image to the server.
   * @param imageData - The base64 encoded image data.
   */
  const handleVerify = async (imageData: string) => {
    try {
      const now = new Date();
      // Prevents multiple verification attempts within 3 seconds
      if (lastAttemptTime && now.getTime() - lastAttemptTime.getTime() < 3000) {
        return;
      }
      setLastAttemptTime(now);

      const response = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageData }),
      });

      const result = await response.json();
      setVerificationResult(result);

      // Clear the verification result after 5 seconds
      setTimeout(() => setVerificationResult(null), 5000);
    } catch (error) {
      console.error('Verification error:', error);
      setVerificationResult({
        success: false,
        message: 'Verification failed. Please try again.'
      });
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center">
          <Fingerprint className="w-6 h-6 text-purple-400" />
          <h2 className="ml-2 text-xl font-medium text-white">
            Face Verification
          </h2>
        </div>

        {verificationResult && (
          <div className={`mt-4 p-4 rounded-lg backdrop-blur-sm
            transform transition-all duration-300 ease-out
            ${verificationResult.success 
              ? 'bg-green-500/10 border border-green-500/20' 
              : 'bg-red-500/10 border border-red-500/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              {verificationResult.success ? (
                <Shield className="w-5 h-5 text-green-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-400" />
              )}
              <p className={`text-sm ${
                verificationResult.success ? 'text-green-300' : 'text-red-300'
              }`}>
                {verificationResult.success
                  ? `Welcome, ${verificationResult.user?.name}! (${(verificationResult.confidence! * 100).toFixed(1)}% match)`
                  : verificationResult.message || 'Access denied'}
              </p>
            </div>
          </div>
        )}

        <div className="mt-4">
          <Camera 
            onCapture={handleVerify} 
            mode="verify" 
          />
        </div>
      </div>
    </div>
  );
}