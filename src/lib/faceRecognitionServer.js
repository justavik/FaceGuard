/** The faceRecognitionServer.js file sets up a face recognition server using Express, WebSocket, and face-api.js. 
 * It initializes the server, loads face recognition models, and handles user registration and face recognition requests.
 * 
 * The server performs the following tasks:
 * 
 * - Initializes an Express app with CORS and JSON body parsing.
 * - Sets up a storage path for face descriptors and creates the directory if it doesn't exist.
 * - Initializes a WebSocket server to communicate with clients.
 * - Stores registered users and their face descriptors in a Map.
 * - Initializes face-api.js with a canvas environment.
 * 
 * The loadModelsSequentially function loads face-api.js models from disk sequentially.
 * 
 * The initializeFaceAPI function initializes TensorFlow, loads face-api.js models, and loads existing users from disk.
 * 
 * The reloadModelsIfNeeded function reloads face-api.js models if they are not already loaded.
 * 
 * The registerHandler function handles user registration by validating input, processing the image to extract face descriptors, saving user data, and notifying connected WebSocket clients.
 * 
 * The recognizeHandler function handles face recognition by validating input, processing the image to extract face descriptors, comparing the descriptors with registered users, and returning the recognition result. It also notifies connected WebSocket clients about the recognition attempt.
 * 
 * The server registers routes for user registration and face recognition, and includes a health check route to verify server and model status.
 * 
 * The server starts by initializing face-api.js and then listening on the specified port for incoming requests.
 */

import { WebSocketServer } from 'ws';
import * as faceapi from 'face-api.js';
import { Canvas, createCanvas, Image, loadImage } from 'canvas';
import * as fs from 'fs';
import * as path from 'path';
import express from 'express';
import cors from 'cors';
import * as tf from '@tensorflow/tfjs-node';

// Initialize express app
const app = express();
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://host.docker.internal:3000', '*'],
  credentials: true,
  methods: ['GET', 'POST']
}));
app.use(express.json({ limit: '50mb' }));

// Path to save face descriptors
const STORAGE_PATH = path.join(process.cwd(), 'face-data');
if (!fs.existsSync(STORAGE_PATH)) {
  fs.mkdirSync(STORAGE_PATH, { recursive: true });
}

// Initialize WebSocket server
const wss = new WebSocketServer({ port: 3002 });

// Store registered users and their face descriptors
let registeredUsers = new Map();

// Initialize face-api.js with canvas
const canvas = createCanvas(1, 1);
const ctx = canvas.getContext('2d');
const imageData = ctx.getImageData(0, 0, 1, 1);

// Initialize the environment
faceapi.env.monkeyPatch({
  Canvas,
  Image,
  ImageData: imageData.constructor
});

/**
 * Load face-api.js models sequentially from disk.
 */
async function loadModelsSequentially() {
  const modelPathRoot = path.join(process.cwd(), 'models');
  console.log('Loading models from:', modelPathRoot);

  try {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPathRoot),
      faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPathRoot),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPathRoot)
    ]);

    const modelsLoaded = 
      faceapi.nets.ssdMobilenetv1.isLoaded &&
      faceapi.nets.faceLandmark68TinyNet.isLoaded &&
      faceapi.nets.faceRecognitionNet.isLoaded;

    if (!modelsLoaded) {
      throw new Error('One or more models failed to load');
    }

    console.log('All models loaded successfully');
  } catch (error) {
    console.error('Error loading models:', error);
    throw error;
  }
}

/**
 * Initialize face-api.js and load existing users.
 */
async function initializeFaceAPI() {
  try {
    console.log('Initializing TensorFlow...');
    await tf.ready();
    console.log('TensorFlow initialized successfully');

    await loadModelsSequentially();

    try {
      const usersPath = path.join(STORAGE_PATH, 'users.json');
      if (fs.existsSync(usersPath)) {
        const fileContent = fs.readFileSync(usersPath, 'utf-8').trim();
        if (fileContent) {
          const userData = JSON.parse(fileContent);
          registeredUsers = new Map(Object.entries(userData));
          console.log(`Loaded ${registeredUsers.size} existing users`);
        } else {
          fs.writeFileSync(usersPath, '{}');
          registeredUsers = new Map();
          console.log('Initialized empty users file');
        }
      } else {
        fs.writeFileSync(usersPath, '{}');
        registeredUsers = new Map();
        console.log('Created new users file');
      }
    } catch (error) {
      console.warn('Failed to load existing users:', error);
      registeredUsers = new Map();
      fs.writeFileSync(path.join(STORAGE_PATH, 'users.json'), '{}');
      console.log('Reset users file due to error');
    }
  } catch (error) {
    console.error('Error initializing face-api:', error);
    throw error;
  }
}

/**
 * Reload face-api.js models if they are not loaded.
 */
const reloadModelsIfNeeded = async () => {
  if (!faceapi.nets.ssdMobilenetv1.isLoaded || 
      !faceapi.nets.faceLandmark68TinyNet.isLoaded || 
      !faceapi.nets.faceRecognitionNet.isLoaded) {
    const modelPathRoot = path.join(process.cwd(), 'models');
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromDisk(modelPathRoot),
      faceapi.nets.faceLandmark68TinyNet.loadFromDisk(modelPathRoot),
      faceapi.nets.faceRecognitionNet.loadFromDisk(modelPathRoot)
    ]);
  }
};

/**
 * Handle user registration.
 */
const registerHandler = async (req, res) => {
  try {
    await reloadModelsIfNeeded();

    const { name, image } = req.body;
    
    if (!name || !image) {
      return res.status(400).json({ 
        error: 'Missing required fields', 
        details: 'Both name and image are required' 
      });
    }
    
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const detection = await faceapi
      .detectSingleFace(canvas)
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    
    if (!detection) {
      return res.status(400).json({ 
        error: 'No face detected',
        details: 'Could not detect a face in the provided image'
      });
    }
    
    const userId = Math.random().toString(36).substring(2);
    
    let existingUsers = {};
    const usersPath = path.join(STORAGE_PATH, 'users.json');
    
    if (fs.existsSync(usersPath)) {
      try {
        const fileContent = fs.readFileSync(usersPath, 'utf-8');
        existingUsers = JSON.parse(fileContent);
        console.log('Loaded existing users:', Object.keys(existingUsers).length);
      } catch (error) {
        console.error('Error reading existing users:', error);
      }
    }
    
    existingUsers[userId] = {
      name,
      descriptor: Array.from(detection.descriptor)
    };
    
    try {
      fs.writeFileSync(
        usersPath,
        JSON.stringify(existingUsers, null, 2)
      );
      console.log('Saved user data successfully. Total users:', Object.keys(existingUsers).length);
    } catch (error) {
      console.error('Error saving user data:', error);
    }
    
    registeredUsers = new Map(Object.entries(existingUsers));
    
    wss.clients.forEach(client => {
      if (client.readyState === 1) {
        client.send(JSON.stringify({
          type: 'user_registered',
          user: { id: userId, name }
        }));
      }
    });
    
    return res.json({ 
      success: true,
      user: { id: userId, name }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ 
      error: 'Registration failed',
      details: error.message 
    });
  }
};

/**
 * Handle face recognition.
 */
const recognizeHandler = async (req, res) => {
  try {
    await reloadModelsIfNeeded();

    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ 
        error: 'Missing image',
        details: 'An image is required for recognition' 
      });
    }
    
    const base64Data = image.replace(/^data:image\/jpeg;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const img = await loadImage(buffer);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const detection = await faceapi
      .detectSingleFace(canvas)
      .withFaceLandmarks(true)
      .withFaceDescriptor();
    
    if (!detection) {
      return res.status(400).json({ 
        error: 'No face detected',
        details: 'Could not detect a face in the provided image'
      });
    }
    
    if (registeredUsers.size === 0) {
      return res.status(400).json({
        error: 'No registered users',
        details: 'No users are registered in the system'
      });
    }
    
    let minDistance = Infinity;
    let matchedUser = null;
    
    for (const [userId, userData] of registeredUsers.entries()) {
      const distance = faceapi.euclideanDistance(
        detection.descriptor,
        new Float32Array(userData.descriptor)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        matchedUser = { id: userId, ...userData };
      }
    }
    
    const RECOGNITION_THRESHOLD = 0.45;
    
    if (minDistance <= RECOGNITION_THRESHOLD && matchedUser) {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'access_attempt',
            success: true,
            message: `Access granted to ${matchedUser.name}`
          }));
        }
      });
      
      return res.json({
        success: true,
        user: { id: matchedUser.id, name: matchedUser.name },
        confidence: 1 - (minDistance / RECOGNITION_THRESHOLD)
      });
    } else {
      wss.clients.forEach(client => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'access_attempt',
            success: false,
            message: 'Access denied: Face not recognized'
          }));
        }
      });
      
      return res.json({
        success: false,
        message: 'Face not recognized',
        confidence: minDistance > 1 ? 0 : 1 - minDistance
      });
    }
  } catch (error) {
    console.error('Error recognizing face:', error);
    return res.status(500).json({ 
      error: 'Recognition failed',
      details: error.message 
    });
  }
};

// Register routes
app.post('/api/register', registerHandler);
app.post('/api/recognize', recognizeHandler);

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    modelsLoaded: {
      ssdMobilenet: faceapi.nets.ssdMobilenetv1.isLoaded,
      faceLandmark: faceapi.nets.faceLandmark68TinyNet.isLoaded,
      faceRecognition: faceapi.nets.faceRecognitionNet.isLoaded
    }
  });
});

// Start the server
const PORT = 3001;
initializeFaceAPI().then(() => {
  app.listen(PORT, () => {
    console.log(`Face recognition server running on port ${PORT}`);
    console.log(`WebSocket server running on port 3002`);
  });
}).catch(error => {
  console.error('Failed to initialize face-api:', error);
  process.exit(1);
});

export default app;