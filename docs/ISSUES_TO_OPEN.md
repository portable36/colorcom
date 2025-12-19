# Issues to open on GitHub (recommended follow-ups)

Below are recommended issues you can open in the repo. I added `.env.example` files for several services; the remaining items are higher-level improvements.

---

## 1) Pin Kong image version in docker-compose
**Title:** chore: pin Kong image in docker-compose.yml
**Body:**
Pin the Kong image to a tested tag (e.g., `kong:3.6.0`) instead of `kong:latest` to avoid breakages from upstream changes. Update `docker-compose.yml` and add a short note in `Quickstart.md` explaining the chosen tag and update process.
**Priority:** High

---

## 2) Add a central migrations helper
**Title:** feat: add `scripts/migrate-all.sh` (or Makefile target) to run Prisma migrations for all services
**Body:**
Create a small script or Makefile target that loops over services with Prisma and runs `npx prisma migrate deploy` (or `npx prisma migrate dev` for local) to simplify bootstrapping local/dev stacks and CI. Add CI job that runs the script and fails early if migrations don't apply.
**Priority:** High

---

## 3) Secrets hygiene: move secrets out of docker-compose
**Title:** chore: document secret management and avoid storing secrets in `docker-compose.yml`
**Body:**
Add `.env.example` files for all services (done for many services), and update `docker-compose.yml` to read from `.env` or Docker secrets for sensitive values. Add a short `SECURITY.md` or section in `Quickstart.md` describing secure local and production practices.
**Priority:** High

---

## 4) Add OpenTelemetry collector to compose and sample config
**Title:** feat: add OpenTelemetry collector container and example config
**Body:**
Add an OTel collector in `docker-compose.yml` and show how services can export traces (env vars/SDK example). Add a short sample dashboard in Grafana or pointers to quickstart tracing setup.
**Priority:** Medium

---

## 5) Add Kong recommended plugins and align config
**Title:** chore: enable `jwt`, `prometheus`, and `correlation-id` plugins in `kong/kong.yml`
**Body:**
Quickstart recommends several plugins. Update `kong/kong.yml` with those plugins (or document why they are disabled) and add a note about rate-limiting policy (local vs redis).
**Priority:** Medium

---

## 6) Add `.env.example` files for remaining services and a docs page
**Title:** docs: add `.env.example` for all services + docs listing required envs
**Body:**
I added examples for many services. Add missing ones if any remain and create `docs/env.md` listing per-service required configuration and minimal example values for local runs.
**Priority:** Low

---

## 7) Add CI job to run smoke E2E test
**Title:** ci: add GitHub Actions job to run `scripts/e2e-local.sh` on PRs
**Body:**
Add a job that brings up the stack (or uses `--no-compose` test mode if present) and runs the existing E2E smoke script to catch integration regressions early. Make sure database migrations are applied as part of the job.
**Priority:** Medium

---

If you want, I can open these issues programmatically if you provide a GitHub token, or I can create the issue drafts as files under `.github/ISSUE_TEMPLATE` to make them easy to open from the GitHub UI.
