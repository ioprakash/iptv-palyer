# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./
COPY server/package.json ./server/

# Install dependencies
RUN npm install
# Install server dependencies explicitly if needed, but root install might cover workspaces if configured. 
# Since we might not have workspaces enabled, let's install both.
WORKDIR /app/server
RUN npm install
WORKDIR /app

# Copy source code
COPY . .

# Build Frontend
RUN npm run build

# Production Stage
FROM node:20-alpine

WORKDIR /app

# Copy built assets and server code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/package.json ./package.json

# Install ONLY production dependencies for server
WORKDIR /app/server
RUN npm install --production

# Expose Port
EXPOSE 3001

# Start Command
CMD ["npx", "tsx", "index.ts"]
