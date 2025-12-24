FROM node:18-bookworm-slim
WORKDIR /app
COPY package*.json ./
RUN npm install --production --legacy-peer-deps
COPY src ./src
CMD ["node", "src/index.js"]
