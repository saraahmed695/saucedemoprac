# Test Data

## Environment settings

`playwright.config.ts` selects `TEST_ENV` (default: `qa`) and loads `environments/<TEST_ENV>.env`. The selected file must exist.

| Variable | Required | Use |
|---|---:|---|
| `URL` | Yes | Base URL for browser navigation. |
| `TEST_PASSWORD` | Yes | Password for the shared SauceDemo test account. |
| `TEST_USERS` | Login data | Comma-separated usernames used to create successful-login cases. |
| `TEST_USERNAME` | Login data | Single-username alternative used when `TEST_USERS` is not set; also used by the dev environment. |
| `TEST_ENV` | No | Environment file name without `.env`; defaults to `qa`. |

The login data module requires a non-empty username list and password. It prefers `TEST_USERS` over `TEST_USERNAME`. Do not put credentials in documentation or commit them to source control; use locally protected files and CI secret management.

## Data sources and fixtures

- `tests/fixtures/authenticatedTest.ts` provides opt-in, test-scoped authenticated page setup. `authUsername` defaults to `standard_user` and can be overridden by suites that select credentials from login test data.
- `data/loginTestData.ts` builds successful cases from configured usernames and adds negative cases (random invalid username, invalid/missing/whitespace/case-mismatched credentials, and locked-out user). Random invalid usernames use a UUID to avoid collisions.
- `data/productTestData.ts` is the canonical six-product catalog of names, descriptions, and prices. Specs use it for inventory assertions, a per-product cart add-and-contents matrix, sorting expectations, and dynamic catalog ordering.
- `data/cartTestData.ts` builds typed cart add-and-contents cases from the canonical catalog, pairing each product name with its expected cart price.
- Checkout tests define customer input locally (`Test Customer`, postal code `12345`) and explicit required-field, whitespace, long-value, and special-character cases in the relevant spec.

## Isolation and state

Tests generally log in and establish their own cart/session state for each test. The browser context is provided by Playwright's test fixtures; cart mutations are validated and reset within each scenario rather than shared as test data between cases.

Never use a production account or real customer information. Ensure the configured account and target environment are intended for test activity.
