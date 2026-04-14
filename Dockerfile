# STAGE 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build the project (Vite + Server)
RUN npm run build

# STAGE 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy built assets and server from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types.ts ./src/

# Ensure the data directory exists for persistence
RUN mkdir -p data

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=10000

# Install TS execution for the server (tsx)
RUN npm install -g tsx

EXPOSE 10000

# Start the server using tsx to run server.ts
CMD ["tsx", "server.ts"]
