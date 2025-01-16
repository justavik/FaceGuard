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

  const handleVerify = async (imageData: string) => {
    try {
      const now = new Date();
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