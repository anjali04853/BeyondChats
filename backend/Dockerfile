FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Verify dist folder was created
RUN ls -la dist/

# Expose port
EXPOSE 3001

# Start the server - directly run compiled code
CMD ["node", "dist/index.js"]
