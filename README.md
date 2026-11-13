# SauceDemo Playwright Tests

TypeScript end-to-end tests for the SauceDemo storefront, built with Playwright Test. The suite covers login and logout, product browsing and sorting, cart behavior, checkout, and the burger menu/dynamic catalog flows in Chromium, Firefox, and WebKit.

## Requirements

- Node.js (the CI workflow uses the current Node.js LTS release)
- npm
- Access to the configured SauceDemo environment
- An environment file under `environments/` with the required settings:
  - `URL`: site base URL
  - `TEST_PASSWORD`: password for the test account
  - `TEST_USERS` (comma-separated, used by QA) or `TEST_USERNAME` (used by dev): login username(s)

The configuration loads `environments/qa.env` by default. Set `TEST_ENV` to select another environment, such as `dev`. Do not commit credentials; provide environment files and CI secrets through an approved secret-management process.

## Setup and run

```powershell
npm ci
npx playwright install
npx playwright test



After a test run, the HTML report is generated in the playwright-report/ folder. Open it using npx playwright show-report.
```

In PowerShell, select a non-default environment with:

```powershell
$env:TEST_ENV = "dev"
npx playwright test
```

Useful commands:

```powershell
npx playwright test --project=webkit
npx playwright test "tests\Menu\BurgerMenu.spec.ts" --project=webkit
npx playwright test --grep "Lazy Load adds products" --project=webkit --repeat-each=5 --workers=1 --retries=0
npx playwright show-report
```

There are no npm test scripts currently; invoke Playwright through `npx`.

## Documentation

- [Test plan](docs/TEST_PLAN.md)
- [Test coverage](docs/TEST_COVERAGE.md)
- [Test data](docs/TEST_DATA.md)
- [Test reporting](docs/TEST_REPORTING.md)
- [CI/CD](docs/CI_CD.md)

## Known WebKit stability history

The latest full cross-browser run completed with **289 passed and 2 failed** across Chromium, Firefox and WebKit. Both reported failures occurred in WebKit, in the Reset App State scenarios from inventory and spinner routes.

 [Test reporting](docs/TEST_REPORTING.md).
