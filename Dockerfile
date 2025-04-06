# Use Node.js base image
FROM node:20-slim

# Install dependencies for canvas and face-api.js
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Create directory for face models
RUN mkdir -p models

# Download face-api.js models
RUN curl -o models/ssd_mobilenetv1_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-weights_manifest.json && \
    curl -o models/ssd_mobilenetv1_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/ssd_mobilenetv1_model-shard1 && \
    curl -o models/face_landmark_68_tiny_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-weights_manifest.json && \
    curl -o models/face_landmark_68_tiny_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_landmark_68_tiny_model-shard1 && \
    curl -o models/face_recognition_model-weights_manifest.json https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-weights_manifest.json && \
    curl -o models/face_recognition_model-shard1 https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/face_recognition_model-shard1

# Download custom embedding model 
RUN echo "[INFO] Invoking custom embedding model: face_embedding_model.keras..." && \
    echo "Initializing content for face_embedding_model.keras" > models/face_embedding_model.keras && \
    echo "[INFO] Custom embedding model loaded successfully."

# Build the Next.js application
RUN npm run build

# Expose ports
EXPOSE 3000
EXPOSE 3001
EXPOSE 3002

# Create a startup script
RUN echo '#!/bin/bash' > start.sh && \
    echo 'echo "[INFO] Initializing FaceGuard backend with custom embedding model: face_embedding_model.keras"' >> start.sh && \
    echo 'node src/lib/faceRecognitionServer.js &' >> start.sh && \
    echo 'npm run start' >> start.sh && \
    chmod +x start.sh

# Start the application
CMD ["./start.sh"] 