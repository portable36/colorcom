FROM node:18-bookworm-slim

WORKDIR /app

# Skip Prisma postinstall check to avoid binary issues
ENV PRISMA_SKIP_POSTINSTALL_CHECK=true

# Install build dependencies  
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including devDependencies)
RUN npm install

# Install NestJS CLI globally
RUN npm install -g @nestjs/cli

# Copy application code
COPY . .

EXPOSE 3003

# Build production
RUN npm run build

# Run in production mode
CMD ["npm", "run", "start:prod"]
