# STAGE 1: Build & Prepare
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install ALL dependencies (including dev) to build the project
RUN npm install --legacy-peer-deps

# Copy entire source
COPY . .

# Build the frontend (Vite)
RUN npm run build

# Remove development dependencies to keep the production image light 
# (Done in builder to save memory in the final stage)
RUN npm prune --omit=dev --legacy-peer-deps

# STAGE 2: Production Execution
FROM node:20-alpine

WORKDIR /app

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
# Copy built frontend assets
COPY --from=builder /app/dist ./dist
# Copy essential server source
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/src/server ./src/server
COPY --from=builder /app/src/types.ts ./src/
COPY --from=builder /app/package.json ./

# Persistence & Logging infrastructure
RUN mkdir -p data

# Execution Environment
ENV NODE_ENV=production
ENV PORT=10000

# Install tsx globally in the final stage for execution
RUN npm install -g tsx

EXPOSE 10000

# Start AlphaMark Pro Intelligence Kernel
CMD ["tsx", "server.ts"]
