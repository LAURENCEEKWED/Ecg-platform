FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install --production

# Copy source
COPY src ./src

# Create directories
RUN mkdir -p uploads data

EXPOSE 5000

CMD ["node", "src/server.js"]
