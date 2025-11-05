# Multi-stage Dockerfile for AI Service
# - Builds NestJS application
# - Compiles Whisper.cpp from source
# - Downloads Whisper base model
# - All contained within Docker (no host dependencies)

FROM node:20-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Whisper.cpp build stage
FROM node:20-alpine AS whisper-builder

WORKDIR /whisper

# Install build dependencies
RUN apk add --no-cache git make g++ cmake wget

# Clone and build whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git . && \
    make

# Download small model (466MB, better accuracy than base)
RUN sh ./models/download-ggml-model.sh small

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install ffmpeg for audio conversion
RUN apk add --no-cache ffmpeg libstdc++

# Copy whisper.cpp from builder
COPY --from=whisper-builder /whisper /app/whisper.cpp

# Set library path for whisper and ggml shared libraries
ENV LD_LIBRARY_PATH=/app/whisper.cpp/build/src:/app/whisper.cpp/build/ggml/src:$LD_LIBRARY_PATH

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/api/ai/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["node", "dist/main"]
