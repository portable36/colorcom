FROM node:18-bookworm-slim

WORKDIR /usr/src/app

COPY package.json tsconfig.json nest-cli.json ./

RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*

RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build

RUN npm prune --omit=dev

EXPOSE 3008

CMD ["npm", "start"]
