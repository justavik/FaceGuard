# FaceGuard

FaceGuard is an open-source face recognition access control system that combines hardware and software components to provide secure, real-time face verification. The system uses an ESP32 microcontroller's WiFi Module with a button trigger to initiate verification requests, which are then processed by a Next.js web application using face-api.js for face recognition.

![System Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **Real-time Face Recognition**: Uses face-api.js with TensorFlow.js for accurate face detection and recognition
- **Hardware Integration**: ESP32-based trigger system for initiating verification requests
- **User Registration**: Simple interface for registering new users with face data
- **WebSocket Communication**: Real-time updates and notifications using WebSocket
- **Modern UI**: Sleek, responsive interface built with React and Tailwind CSS
- **Multi-Camera Support**: Ability to select from multiple connected cameras
- **Live Preview**: Real-time camera feed with visual indicators
- **Event Logging**: Comprehensive logging of access attempts and system events

## System Architecture

The system consists of three main components:

1. **Frontend Application (Next.js)**
   - User interface for registration and verification
   - Real-time camera feed and face capture
   - WebSocket client for live updates
   - Camera Selection: Uses default system camera for registration and first available external camera (if present) for verification

2. **Backend Server (Node.js)**
   - Face recognition processing using face-api.js
   - User data management and storage
   - WebSocket server for real-time communication

3. **Hardware Trigger (ESP32)**
   - Physical button interface
   - WiFi connectivity
   - HTTP client for triggering verification requests

## Prerequisites

### Hardware Requirements
- ESP32 development board (I used an EspressIf ESP32-WROOM-32E DevKitC)
- Push button
- Breadboard and jumper wires
- USB camera (1080p recommended for better accuracy)
- Computer/server to host the application

### Software Requirements
- Node.js 18.0 or higher
- npm or yarn package manager
- Git
- Arduino IDE (for ESP32 programming)
- Modern web browser

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/justavik/faceguard.git
   cd faceguard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure ESP32**
   - Open `esp32/wifiConnectedCameraCapture.ino` in Arduino IDE
   - Update WiFi credentials and server URL
   - Upload to ESP32
   - Connect button to GPIO pin 12 and ground

## Running the Application

1. **Start the face recognition server**
   ```bash
   node src/lib/faceRecognitionServer.js
   ```

2. **Start the Next.js application**
   ```bash
   npm run dev
   ```

3. **Access the application**
   - Open `http://localhost:3000` in your browser
   - The system status indicator should show "System Active"

## Usage

### User Registration
1. Click "Register New User"
2. Enter the user's name
3. Ensure good lighting and face positioning
4. Click "Capture Photo"
5. Wait for confirmation of successful registration

### Face Verification
1. Click "Trigger Verification" button (or press the button on the ESP32 device if available)
2. Look at the camera when the "LIVE" indicator appears
3. Wait for verification result
4. System will display access granted/denied message

## Hardware Setup

### ESP32 Wiring
- 3V3 to 5V end of ESP32 placed on breadboard (j row)
- Tactile 4-pin push button positioned spanning across midline.
- GPIO 12 connected to bottom right pin of button.
- 3V3 connected to both upper right pin of button.

### Camera Placement
- Mount camera at face level
- Ensure good lighting conditions
- Avoid backlighting
- Recommended distance: 0.5 meter

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- face-api.js for the face recognition models (Sourced from https://github.com/justadudewhohacks/face-api.js/ under MIT License - Copyright (c) 2018 Vincent Mühler
- Next.js team for the amazing framework
- ESP32 community for hardware support
- All contributors and testers
