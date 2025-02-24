 /** The  Camera  component is a functional component that captures images from the user's camera using the  getUserMedia  API. It uses a video element to display the camera feed and a canvas element to capture the image. The component also provides an option to select from multiple camera devices if available. 
 The  Camera  component accepts two props: 
 onCapture : A function that is called when an image is captured. The captured image data is passed as a parameter to this function. mode : A string to specify the mode of operation. The component can work in two modes:  register  and  verify . In the  register  mode, the user can manually capture images using the camera. In the  verify  mode, the component automatically captures images based on a trigger from the server. 
 The component uses the  navigator.mediaDevices.getUserMedia()  method to access the user's camera. It also uses the  navigator.mediaDevices.enumerateDevices()  method to list available camera devices. 
 The  selectCamera  function is used to select the camera device based on the mode of operation. In the  verify  mode, the component selects an external camera device that has "1080" in its label. In the  register  mode, the component selects the first available camera device. 
 The  setupCamera  function is used to start the camera stream. It creates a new  MediaStream  object using the selected camera device and sets it as the source of the video element. 
 The component renders a video element to display the camera feed and a canvas element to capture the image. It also renders a select element to choose from available camera devices (in the  register  mode). 
 The  captureImage  function is called when the user clicks the "Capture Photo" button. It captures the current frame from the video element and converts it to a base64-encoded image data string using the  canvas.toDataURL()  method. The captured image data is then passed to the  onCapture  function. 
 The component also includes a live recording indicator in the  verify  mode, which shows a red dot and the text "LIVE" when the camera feed is active. 
**/

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

  /**
   * Captures an image from the video stream and calls the onCapture callback with the image data.
   */
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

  /**
   * Polls the server for a capture trigger in verify mode.
   */
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

  /**
   * Selects the appropriate camera device based on the mode.
   * In verify mode, tries to use the first external camera if available,
   * otherwise falls back to the default camera.
   */
  const selectCamera = useCallback((devices: MediaDeviceInfo[]) => {
    if (devices.length === 0) {
      setError('No camera devices found');
      return;
    }

    if (mode === 'verify') {
      // Try to find an external camera (usually not the first device)
      const defaultCamera = devices[0];
      const externalCameras = devices.slice(1);
      
      // If there are external cameras, use the first one
      if (externalCameras.length > 0) {
        setSelectedDevice(externalCameras[0].deviceId);
      } else {
        // Fall back to the default camera
        setSelectedDevice(defaultCamera.deviceId);
      }
    } else {
      // For register mode, use the default (usually front-facing) camera
      setSelectedDevice(devices[0].deviceId);
    }
  }, [mode]);

  /**
   * Fetches available video devices and selects the appropriate one.
   */
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

  /**
   * Sets up the camera stream using the selected device.
   */
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

export default Camera;