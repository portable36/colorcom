# Deployment notes (short)

Frontend (Vercel recommended):
- Push the `microservices/web-frontend` folder as a separate project to Vercel or connect the repo and set `root` to `microservices/web-frontend`.
- Set environment variable `NEXT_PUBLIC_PRODUCT_SERVICE_URL` to the public URL of the product service.

Backend (Render / DigitalOcean / Docker registry):
- Build Docker images for each microservice and push to registry.
- Deploy services with environment variables and ensure DBs and Kafka are available.
- Ensure Prisma schemas are applied at deploy time (migration or `prisma db push` in an init job).

CI:
- Add a GitHub Actions job that runs `docker compose up -d`, waits for readiness, applies Prisma schemas, builds and starts the frontend, runs Playwright smoke tests (`e2e/tests/smoke.spec.ts`) and fails the pipeline on errors. See `.github/workflows/e2e-playwright.yml` for the sample workflow.

Security:
- Do not expose DB endpoints publicly; use private networking where possible.
