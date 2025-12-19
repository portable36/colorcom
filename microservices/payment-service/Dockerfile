FROM node:18-bookworm-slim

WORKDIR /usr/src/app

COPY package.json package.json
RUN apt-get update && apt-get install -y ca-certificates openssl && rm -rf /var/lib/apt/lists/*
RUN npm install --production

COPY . .

EXPOSE 3009

CMD ["npm", "start"]
