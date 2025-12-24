# PR & Local Run Checklist

Before opening a PR:
- [ ] Run `./scripts/e2e-playwright.sh` and ensure Playwright smoke tests pass locally.
- [ ] Run `docker compose up -d` and verify services are healthy: `docker compose ps --all` and `docker compose logs --tail 200 <service>`.
- [ ] Ensure Prisma schemas applied for `order-service`, `inventory-service`, `shipping-service` if needed.
- [ ] Add screenshots or short recording of the smoke flow if the UI changes are significant.
- [ ] Update `DEPLOY.md` and `RUN_LOCALLY.md` with any environment-specific notes.

PR checklist for reviewers:
- [ ] CI passed (E2E smoke test)
- [ ] Code is formatted and linted (if applicable)
- [ ] Accessibility: header nav and interactive controls have aria-labels and focus styles
- [ ] Mobile responsive: check pages on small screens
- [ ] Documentation updated (run & deploy instructions)
