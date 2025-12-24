FROM node:18-bookworm-slim

WORKDIR /app

# Install OpenSSL
RUN apt-get update -y && apt-get install -y openssl

# Copy package files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Install dependencies with Prisma skip
ENV PRISMA_SKIP_POSTINSTALL_CHECK=true
RUN npm install --legacy-peer-deps

# Copy source code
COPY src ./src
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Remove dev dependencies
RUN npm prune --omit=dev

EXPOSE 3005

CMD ["node", "dist/main.js"]
