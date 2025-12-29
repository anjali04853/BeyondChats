FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Install serve globally
RUN npm install -g serve

# Start the app - Railway injects PORT env variable
CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
