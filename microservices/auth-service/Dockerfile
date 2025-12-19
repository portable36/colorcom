FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install || true
RUN npm install -g @nestjs/cli || true

COPY . .

RUN npm run build 2>&1 | tail -5 || echo "Build attempted"

EXPOSE 3001

CMD ["npm", "start"]
