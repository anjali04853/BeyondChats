FROM node:18-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy service package files
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm ci --prefix backend
RUN npm ci --prefix frontend

# Copy source code
COPY backend ./backend
COPY frontend ./frontend

# Build frontend
RUN npm run build --prefix frontend

# Build backend
RUN npm run build --prefix backend

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy root package files
COPY package*.json ./

# Copy backend package files
COPY backend/package*.json ./backend/

# Install production dependencies only
RUN npm ci --prefix backend --omit=dev

# Copy built backend
COPY --from=builder /app/backend/dist ./backend/dist

# Copy built frontend
COPY --from=builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "backend/dist/index.js"]
