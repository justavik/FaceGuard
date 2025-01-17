import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CameraIcon, Loader2 } from 'lucide-react';

interface CameraProps {
  onCapture: (imageData: string) => void;
  mode?: 'register' | 'verify';
}

export function Camera({ onCapture, mode = 'register' }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTriggerRef = useRef<number>(0);
  const [error, setError] = useState<string>('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);

  const captureImage = useCallback(() => {
    if (!isStreaming) {
      setError('Please wait for camera stream to start');
      return;
    }

    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const context = canvas.getContext('2d');
      if (context) {
        try {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = canvas.toDataURL('image/jpeg', 0.9);
          onCapture(imageData);
        } catch {
          setError('Failed to capture image. Please try again.');
        }
      }
    }
  }, [isStreaming, onCapture]);

  useEffect(() => {
    if (mode !== 'verify') return;
    
    let pollTimer: NodeJS.Timeout;
    let isPolling = true;
    
    const checkTrigger = async () => {
      if (!isPolling) return;
      
      try {
        const response = await fetch('/api/trigger-capture');
        const data = await response.json();
        
        if (data.timestamp && data.timestamp > lastTriggerRef.current) {
          lastTriggerRef.current = data.timestamp;
          captureImage();
        }
        
        if (isPolling) {
          pollTimer = setTimeout(checkTrigger, 1000);
        }
      } catch (error) {
        console.error('Error checking trigger:', error);
        if (isPolling) {
          pollTimer = setTimeout(checkTrigger, 2000);
        }
      }
    };
  
    checkTrigger();
    
    return () => {
      isPolling = false;
      clearTimeout(pollTimer);
    };
  }, [mode, captureImage]);

  const selectCamera = useCallback((devices: MediaDeviceInfo[]) => {
    if (mode === 'verify') {
      const externalCamera = devices.find(device => 
        device.label.toLowerCase().includes('1080')
      );
      
      setSelectedDevice(externalCamera?.deviceId || devices[0]?.deviceId);
    } else if (devices.length > 0) {
      setSelectedDevice(devices[0].deviceId);
    }
  }, [mode]);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(() => navigator.mediaDevices.enumerateDevices())
      .then(devices => {
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        selectCamera(videoDevices);
      })
      .catch(err => {
        setError('Camera access error: ' + err.message);
      });
  }, [selectCamera]);

  useEffect(() => {
    if (!selectedDevice) return;

    let currentStream: MediaStream | null = null;

    async function setupCamera() {
      try {
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: selectedDevice },
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          }
        });

        currentStream = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play()
              .then(() => {
                setIsStreaming(true);
                setError('');
              })
              .catch(() => setError('Failed to start video playback'));
          };
        }
      } catch (err) {
        setError(`Failed to access camera: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setIsStreaming(false);
      }
    }

    setupCamera();

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setIsStreaming(false);
      }
    };
  }, [selectedDevice]);

  return (
    <div className="space-y-4">
      {mode === 'register' && devices.length > 0 && (
        <div className="relative">
          <CameraIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select 
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg
              text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500
              appearance-none cursor-pointer"
          >
            {devices.map((device) => (
              <option 
                key={device.deviceId} 
                value={device.deviceId}
                className="bg-gray-800 text-white"
              >
                {device.label || `Camera ${device.deviceId.slice(0, 5)}...`}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="relative bg-black/40 rounded-lg overflow-hidden backdrop-blur-sm 
        ring-1 ring-white/10 group">
        {!isStreaming && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover"
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {/* Recording indicator */}
        {isStreaming && mode === 'verify' && (
          <div className="absolute top-4 right-4 flex items-center space-x-2
            bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white font-medium">LIVE</span>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {mode === 'register' && (
        <button
          onClick={captureImage}
          disabled={!isStreaming}
          className={`w-full px-4 py-2 rounded-lg font-medium transition-all duration-200
            flex items-center justify-center space-x-2
            ${isStreaming 
              ? 'bg-purple-500 hover:bg-purple-600 text-white' 
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
            }`}
        >
          <CameraIcon className="w-4 h-4" />
          <span>{isStreaming ? 'Capture Photo' : 'Waiting for camera...'}</span>
        </button>
      )}
    </div>
  );
}

