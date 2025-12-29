FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build

# Verify dist folder exists
RUN ls -la dist/ || echo "ERROR: dist folder not found!"

RUN npm install -g serve

EXPOSE 3000

CMD ["sh", "-c", "serve -s dist -l ${PORT:-3000}"]
