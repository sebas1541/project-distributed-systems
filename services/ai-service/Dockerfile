# Build stage
FROM node:20-alpine AS build

# Install build dependencies for whisper.cpp
RUN apk add --no-cache \
    build-base \
    cmake \
    git \
    bash

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Clone and build whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    make && \
    cd models && \
    bash download-ggml-model.sh base

# Copy source code
COPY . .

# Build the NestJS application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install runtime dependencies for whisper.cpp
RUN apk add --no-cache \
    libstdc++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy built application from build stage
COPY --from=build /app/dist ./dist

# Copy whisper.cpp (built in build stage)
COPY --from=build /app/whisper.cpp ./whisper.cpp

# Create uploads directory
RUN mkdir -p /app/uploads && chmod 777 /app/uploads

# Expose port
EXPOSE 3003

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3003/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start the application
CMD ["node", "dist/main"]
