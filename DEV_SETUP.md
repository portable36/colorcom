# Local development guide (minimal)

This file describes a quick way to bring up the minimal local stack for development and run the web frontend.

Prerequisites
- Docker & Docker Compose
- Node.js (v18+ recommended) and npm

Quick start

1. Copy env template:

   cp .env.example .env

2. Start the local services (Postgres, Redis, Kafka, and the frontend dev container):

   docker-compose -f docker-compose.dev.yml up --build

3. Open the frontend at http://localhost:3000

Frontend dev (native)

If you prefer to run the frontend locally without Docker:

cd microservices/web-frontend
npm install
npm run dev

Testing

- Unit tests (Jest):
  cd microservices/web-frontend
  npm run test

- Storybook:
  cd microservices/web-frontend
  npm run storybook

- E2E (Playwright):
  Use the existing `e2e/` setup at the repo root. See `e2e/package.json` and `scripts/e2e-local.sh` for guidance.
