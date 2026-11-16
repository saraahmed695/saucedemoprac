# Test Coverage

Coverage is behavioral and based on the current Playwright specs. Test counts can vary with environment-driven login users and data-driven cases; this document does not imply code coverage.

| Area | Spec | Covered behavior |
|---|---|---|
| Authentication | `tests/Authentication/Login.spec.ts` | Data-driven successful and failed logins; invalid, blank, whitespace, and case-mismatched credentials; locked-out user; Enter-key submission; password masking; dismissing and clearing an error. |
| Authentication | `tests/Authentication/Logout.spec.ts` | Login/logout journey, session retention after inventory refresh, cart-item persistence across checkout logout and re-login, and preventing browser-back from restoring authenticated access. |
| Products | `tests/Products/Products.spec.ts` | Six inventory products; names, descriptions, prices, loaded images, add-to-cart controls; opening product details and returning to inventory. |
| Products | `tests/Products/Sorting.spec.ts` | Default alphabetical order; name and price sort options; consecutive sorts; equal-price products without loss or duplication. |
| Cart | `tests/Add to cart/cart.spec.ts` | Single, multiple, and all-product additions; cart contents and prices; empty-cart checkout through successful order confirmation with a $0.00 total; product-detail add; remove/re-add synchronization; state across inventory/cart/details navigation and refresh. |
| Checkout | `tests/Checkout/Checkout.spec.ts` | Successful order, duplicate-submit state, PDF download, overview contents and quantities, subtotal/tax/total and cent-boundary rounding, field validation and whitespace-only input behavior, long/special-character inputs, reload/back behavior, direct navigation to overview followed through to successful order completion without customer information, and cancellation. |
| End-to-end | `tests/E2E/SuccessfulShoppingJourney.spec.ts` | Scenario 1: browse and sort, add/remove products, verify cart and order totals, complete checkout, and verify confirmation. |
| End-to-end | `tests/E2E/ShoppingJourneyNegativePaths.spec.ts` | Scenario 2: validate missing/incomplete information, correct it, cancel and preserve cart state, log out, and verify protected-route behavior. |
| Burger menu | `tests/Menu/BurgerMenu.spec.ts` | Initial/open/closed/repeated menu state; exact top-level entries; submenu; All Items from details/cart; About/logout/reset; menu on multiple routes and after refresh; Lazy Load, Spinner, and Slider; reset state on inventory/cart/details/dynamic routes. |

## Explicitly unverified or limited

- No unit tests, API tests, accessibility audit, performance benchmark, or visual-regression baseline is defined in this repository.
- Mobile projects and branded browser projects are commented out in `playwright.config.ts`.
- The empty-cart checkout test asserts the observed ability to complete an order with a $0.00 total; this does not establish that empty-cart orders are an intended business flow.
- The focused WebKit repeat run verifies only Lazy Load and four Reset App State route scenarios, not every spec or a full-suite stability run.
