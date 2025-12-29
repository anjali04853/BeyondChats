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

# Railway uses PORT env variable
ENV PORT=3000

# Start the app - use shell form to expand $PORT
CMD serve -s dist -l $PORT
