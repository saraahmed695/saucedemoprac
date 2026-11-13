# Test Coverage

Coverage is behavioral and based on the current Playwright specs. Test counts can vary with environment-driven login users and data-driven cases; this document does not imply code coverage.

| Area | Spec | Covered behavior |
|---|---|---|
| Authentication | `tests/Authentication/Login.spec.ts` | Data-driven successful and failed logins; invalid, blank, whitespace, and case-mismatched credentials; locked-out user; Enter-key submission; password masking; dismissing and clearing an error. |
| Authentication | `tests/Authentication/Logout.spec.ts` | Login/logout journey, session retention after inventory refresh, and preventing browser-back from restoring authenticated access. |
| Products | `tests/Products/Products.spec.ts` | Six inventory products; names, descriptions, prices, loaded images, add-to-cart controls; opening product details and returning to inventory. |
| Products | `tests/Products/Sorting.spec.ts` | Default alphabetical order; name and price sort options; consecutive sorts; equal-price products without loss or duplication. |
| Cart | `tests/Add to cart/cart.spec.ts` | Single, multiple, and all-product additions; cart contents and prices; empty cart; product-detail add; remove/re-add synchronization; state across inventory/cart/details navigation and refresh; records empty-cart order behavior. |
| Checkout | `tests/Checkout/Checkout.spec.ts` | Successful order, duplicate-submit state, PDF download, overview contents and quantities, subtotal/tax/total and cent-boundary rounding, field validation and whitespace-only input behavior, long/special-character inputs, reload/back behavior, direct overview navigation, and cancellation. |
| Burger menu | `tests/Menu/BurgerMenu.spec.ts` | Initial/open/closed/repeated menu state; exact top-level entries; submenu; All Items from details/cart; About/logout/reset; menu on multiple routes and after refresh; Lazy Load, Spinner, and Slider; reset state on inventory/cart/details/dynamic routes. |

## Explicitly unverified or limited

- No unit tests, API tests, accessibility audit, performance benchmark, or visual-regression baseline is defined in this repository.
- Mobile projects and branded browser projects are commented out in `playwright.config.ts`.
- `records whether an empty cart order can be completed` documents observed behavior; it is not an assertion that an empty-cart order is a supported business flow.
- The focused WebKit repeat run verifies only Lazy Load and four Reset App State route scenarios, not every spec or a full-suite stability run.
