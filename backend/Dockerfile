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

# Railway uses PORT env variable
ENV PORT=3001

# Start the app
CMD ["npm", "start"]
