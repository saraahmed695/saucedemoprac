# Test Plan

## Purpose

Validate the SauceDemo storefront's primary user journeys and important state transitions through browser-based end-to-end tests.

## Scope

The automated suite exercises:

- Authentication: successful and invalid login inputs, validation messages, error dismissal, logout, session refresh, and browser-back behavior.
- Products: inventory content, product details, images, prices, and sorting.
- Cart: adding/removing items, cart badge and contents, persistence across navigation and refresh, and cart-to-checkout entry.
- Checkout: required-field validation, order overview and totals, tax rounding, order completion, post-completion behavior, and PDF download.
- Burger menu: open/close state, navigation, submenu, About/logout/reset actions, and dynamic catalog Lazy Load, Spinner, and Slider.

The tests target the configured SauceDemo application, not isolated unit or API behavior. The project does not define a local application server.

## Browser and execution strategy

Playwright projects use Desktop Chrome (Chromium), Desktop Firefox, and Desktop Safari (WebKit). WebKit is configured for one worker because the menu and dynamic-page cases exposed timing sensitivity under repeated execution. Tests are otherwise fully parallel by default. CI sets one worker and two retries; local runs default to zero retries.

Run the complete suite:

```powershell
npx playwright test
```

Run a browser-specific or repeated stability check:

```powershell
npx playwright test --project=webkit
npx playwright test --project=webkit --grep "Lazy Load adds products|Reset App State clears cart" --repeat-each=5 --workers=1 --retries=0
```

Retries can help CI recover from transient infrastructure issues, but do not count as a substitute for diagnosing intermittent failures. Use `--retries=0` for stability measurements.

## Test design

- Each test establishes its own authenticated state in `beforeEach` where needed.
- Shared page objects encapsulate locators and user-level actions.
- Product and login inputs are centralized in `data/`.
- Assertions check user-visible outcomes such as URL, rendered content, cart state, validation messages, and downloaded files.
- Dynamic content is synchronized through observable state (for example, waiting for the first Lazy Load item), not fixed sleeps.
- WebKit menu interactions wait for the menu's open/closed state and CSS transform transition before continuing.

## Entry criteria

- Dependencies are installed with `npm ci`.
- The selected `environments/<name>.env` exists and defines the required URL and test credentials.
- The target application is reachable and the test account is usable.
- Playwright browsers are installed (`npx playwright install`; CI installs browsers and OS dependencies).

## Exit criteria

- All intended tests pass in the requested browser matrix.
- Any failure/flakiness is recorded with its browser, test name, artifacts, and disposition.
- A repeated stability run reports pass/fail/flaky outcomes separately and uses retries disabled when measuring repeatability.

## Risks and limitations

- Tests depend on a live external application and credentials; outages or account changes can cause failures unrelated to test code.
- CI currently runs the whole browser matrix and uploads the HTML report, but the workflow does not create its environment file or inject test credentials.
- WebKit repeat testing previously exposed intermittent menu-transition and Lazy Load synchronization failures. A focused 25-execution WebKit run passed after fixes; broader repeat coverage remains useful.
