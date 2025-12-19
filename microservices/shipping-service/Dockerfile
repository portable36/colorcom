FROM node:18-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package.json

# Install openssl for Prisma runtime
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install

COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3010
CMD ["node", "index.js"]
