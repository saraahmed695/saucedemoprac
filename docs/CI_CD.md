# CI/CD

## Current GitHub Actions workflow

`.github/workflows/playwright.yml` runs on pushes and pull requests targeting `main` or `master`. The `test` job:

1. Runs on `ubuntu-latest` with a 60-minute job timeout.
2. Checks out the repository.
3. Sets up the current Node.js LTS release.
4. Installs dependencies with `npm ci`.
5. Installs Playwright browsers and system dependencies with `npx playwright install --with-deps`.
6. Runs `npx playwright test`.
7. Uploads `playwright-report/` as `playwright-report` for 30 days, unless the workflow is cancelled.

The Playwright configuration runs Chromium, Firefox, and WebKit. CI runs one worker, disallows `test.only`, and enables two retries. WebKit is independently configured for one worker. Local runs default to zero retries.

## Environment and secrets

The config loads `environments/qa.env` unless `TEST_ENV` selects another environment. The workflow currently has no step that creates this file or maps GitHub secrets to `URL`, `TEST_USERS`/`TEST_USERNAME`, and `TEST_PASSWORD`. CI must provision a valid environment file securely before running tests; credentials must not be added to source code or logs.

## Local CI-equivalent commands

```powershell
npm ci
npx playwright install --with-deps
npx playwright test
```

For a no-retry WebKit stability check that preserves failure traces:

```powershell
npx playwright test tests/Menu/BurgerMenu.spec.ts --project=webkit --grep "Lazy Load adds products|Reset App State clears cart" --repeat-each=5 --workers=1 --retries=0 --trace=retain-on-failure
```

## Known limitations

- No separate lint, type-check, unit-test, deployment, or environment-provisioning job is configured.
- The workflow uploads the HTML report but not `test-results/` as a separate artifact.
- Retries in CI can make flaky first attempts pass overall; inspect retry details and traces rather than relying only on the final job status.
- The historical WebKit run and post-fix focused verification are documented in [Test reporting](TEST_REPORTING.md).
