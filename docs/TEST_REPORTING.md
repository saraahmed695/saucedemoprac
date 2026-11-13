# Test Reporting

## Configured reporting and artifacts

- The configured reporter is Playwright's HTML reporter. Open the latest report with:

  ```powershell
  npx playwright show-report
  ```

- Screenshots are captured only on failure (`screenshot: 'only-on-failure'`).
- Traces are configured as `on-first-retry`; a trace is therefore normally available for a retried failure, not every first-attempt failure.
- CI uploads `playwright-report/` as a GitHub Actions artifact for 30 days when the job is not cancelled.
- Local result artifacts are written to `test-results/`; generated reports/results are git-ignored.

For an investigation where retries are disabled, explicitly retain failure traces:

```powershell
npx playwright test --project=webkit --grep "Reset App State clears cart from spinner" --retries=0 --trace=retain-on-failure
```

Open an archive with:

```powershell
npx playwright show-trace "test-results\<test-result-folder>\trace.zip"
```

## Overall Test Execution Summary

The following test runs were performed during the project:

| Test run | Scope | Result | Notes |
|---|---|---|---|
| Initial WebKit stability run | WebKit, 5 repetitions | 471 passed, 1 failed, 13 flaky | Exposed intermittent Lazy Load and Reset App State issues. |
| Focused WebKit verification | Lazy Load and four Reset App State scenarios, 5 repetitions each | 25 passed, 0 failed, 0 flaky | Completed after synchronization fixes, with retries disabled. |
| Final full cross-browser run | Chromium, Firefox, and WebKit | 289 passed, 2 failed | Both reported failures were WebKit Reset App State scenarios: inventory and Spinner. |

The focused WebKit verification covered only the previously affected scenarios and does not establish full-suite stability. The final cross-browser run still had two failures; these should be reported as outstanding rather than treated as resolved.

## WebKit stability incident and disposition

On November 13, 2026, a WebKit `repeat-each=5` stability run reported **471 passed, 1 failed, and 13 flaky**. The affected behaviors were:

1. **Lazy Load adds products when scrolling** — the test read the initial item list immediately after route navigation. When the first lazy-loaded item had not rendered yet, the count was zero and the assertion failed.
2. **Reset App State from inventory, Lazy Load, Spinner, and Slider** — a menu action could begin while the browser's burger-menu CSS transform was still transitioning. The failure contexts showed menu links resolved but hidden or unstable; one Spinner attempt timed out after 30 seconds. Traces showed ARIA/route state could update separately from visual panel state, so the next click could occur before the menu was interactable.

The fix synchronizes the menu page object with the `aria-hidden` state and computed transform settling, waits for content to be ready on dynamic routes, and waits for the first Lazy Load item before capturing the initial list. The WebKit-specific retry override was removed; the normal configuration still allows retries on CI only.

Post-fix focused verification ran the Lazy Load test and the four named Reset App State routes five times each with one worker and retries disabled: **25 passed, 0 failed, 0 flaky**. This verifies those affected cases only. It is not a rerun of the original full repeat matrix, so it does not erase or supersede the historical failure/flaky counts.

## Reporting expectations

Record browser, exact command, pass/fail/flaky totals, test names, and artifact paths for repeat runs. Report first-attempt failures even if a retry passes; distinguish a flaky test from a clean first-attempt pass. Do not describe the focused rerun as proof of full-suite stability.
