import { test, expect } from '../fixtures/authenticatedTest';
import { BurgerMenuPage } from '../../pages/BurgerMenuPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { productTestData } from '../../data/productTestData';

test.use({ launchOptions: { slowMo: 0 } });

const topLevelMenuEntries = [
  'All Items',
  'Dynamic Catalog',
  'About',
  'Logout',
  'Reset App State',
];

const dynamicCatalogProducts = [
  productTestData.bikeLight,
  productTestData.boltTShirt,
  productTestData.onesie,
  productTestData.redTShirt,
  productTestData.backpack,
  productTestData.fleeceJacket,
].map((name) => {
  const product = productTestData.catalog.find((item) => item.name === name);
  if (!product) {
    throw new Error(`Missing expected product data for "${name}".`);
  }
  return product;
});

const resetRoutes = [
  'inventory',
  'cart',
  'product details',
  'lazy load',
  'spinner',
  'slider',
] as const;

test.describe('Burger menu functionality', () => {
  let burgerMenuPage: BurgerMenuPage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    burgerMenuPage = new BurgerMenuPage(authenticatedPage);
    productsPage = new ProductsPage(authenticatedPage);
  });

  test('starts with the menu closed', async () => {
    await expect(burgerMenuPage.menuButton).toBeVisible();
    await expect(burgerMenuPage.menuButton).toBeEnabled();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
    for (const menuItem of [
      burgerMenuPage.allItemsLink,
      burgerMenuPage.dynamicCatalogLink,
      burgerMenuPage.aboutLink,
      burgerMenuPage.logoutLink,
      burgerMenuPage.resetAppStateLink,
    ]) {
      await expect(menuItem).toBeHidden();
    }
  });

  test('opens, closes, and reopens with exactly five top-level entries', async () => {
    await burgerMenuPage.open();

    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'false');
    await expect(burgerMenuPage.topLevelMenuItems).toHaveText(topLevelMenuEntries);
    await expect(burgerMenuPage.closeMenuButton).toBeVisible();
    await expect(burgerMenuPage.dynamicCatalogLink).toHaveAttribute('aria-expanded', 'false');

    await burgerMenuPage.close();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
    await expect(burgerMenuPage.allItemsLink).toBeHidden();
    await expect(burgerMenuPage.dynamicCatalogLink).toBeHidden();
    await expect(burgerMenuPage.aboutLink).toBeHidden();
    await expect(burgerMenuPage.logoutLink).toBeHidden();
    await expect(burgerMenuPage.resetAppStateLink).toBeHidden();

    await burgerMenuPage.open();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'false');
    await expect(burgerMenuPage.topLevelMenuItems).toHaveText(topLevelMenuEntries);
  });

  test('menu supports repeated open and close cycles', async () => {
    for (let cycle = 0; cycle < 3; cycle += 1) {
      await burgerMenuPage.open();
      await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'false');
      await expect(burgerMenuPage.topLevelMenuItems).toHaveText(topLevelMenuEntries);

      await burgerMenuPage.close();
      await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
    }
  });

  test('expands and collapses the Dynamic Catalog submenu', async ({ page }) => {
    await burgerMenuPage.open();

    await expect(burgerMenuPage.dynamicCatalogLink).toHaveAttribute('aria-expanded', 'false');
    await expect(burgerMenuPage.dynamicCatalogLazyLoadLink).toBeHidden();
    await expect(burgerMenuPage.dynamicCatalogSpinnerLink).toBeHidden();
    await expect(burgerMenuPage.dynamicCatalogSliderLink).toBeHidden();

    await burgerMenuPage.toggleDynamicCatalog();
    await expect(burgerMenuPage.dynamicCatalogLink).toHaveAttribute('aria-expanded', 'true');
    await expect(burgerMenuPage.dynamicCatalogLazyLoadLink).toHaveText('Lazy Load');
    await expect(burgerMenuPage.dynamicCatalogSpinnerLink).toHaveText('Spinner');
    await expect(burgerMenuPage.dynamicCatalogSliderLink).toHaveText('Slider');
    await expect(burgerMenuPage.dynamicCatalogLazyLoadLink).toBeVisible();
    await expect(burgerMenuPage.dynamicCatalogSpinnerLink).toBeVisible();
    await expect(burgerMenuPage.dynamicCatalogSliderLink).toBeVisible();

    await burgerMenuPage.toggleDynamicCatalog();
    await expect(burgerMenuPage.dynamicCatalogLink).toHaveAttribute('aria-expanded', 'false');
    await expect(burgerMenuPage.dynamicCatalogLazyLoadLink).toBeHidden();
    await expect(burgerMenuPage.dynamicCatalogSpinnerLink).toBeHidden();
    await expect(burgerMenuPage.dynamicCatalogSliderLink).toBeHidden();
  });

  test('All Items returns from product details to the complete inventory', async ({ page }) => {
    await productsPage.openFirstProduct();
    await expect(page).toHaveURL(/\/inventory-item\.html(?:[?#].*)?$/);

    await burgerMenuPage.open();
    await burgerMenuPage.goToAllItems();

    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
    await expect(productsPage.productNames).toHaveText(productTestData.all);
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
  });

  test('All Items returns from cart and preserves selected products', async ({ page }) => {
    await productsPage.addProductToCart(productTestData.backpack);
    await expect(productsPage.cartBadge).toHaveText('1');
    await productsPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);

    await burgerMenuPage.open();
    await burgerMenuPage.goToAllItems();

    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
    await expect(productsPage.cartBadge).toHaveText('1');
    await expect(
      productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' }),
    ).toBeVisible();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
  });

  test('Lazy Load adds products when scrolling', async ({ page }) => {
    await burgerMenuPage.open();
    await burgerMenuPage.toggleDynamicCatalog();
    await burgerMenuPage.goToLazyLoad();

    await expect(page).toHaveURL(/\/dynamic-catalog-lazy-load\.html(?:[?#].*)?$/);
    await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Lazy Load');

    const itemNames = page.locator('[data-test^="lazy-load-item-"][data-test$="-name"]');
    await expect(itemNames.first()).toBeVisible();
    const initialNames = (await itemNames.allTextContents()).map((name) => name.trim());
    expect(initialNames.length).toBeGreaterThan(0);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect
      .poll(() => itemNames.count(), { timeout: 15_000 })
      .toBeGreaterThan(initialNames.length);

    const loadedNames = (await itemNames.allTextContents()).map((name) => name.trim());
    expect(loadedNames.slice(0, initialNames.length)).toEqual(initialNames);
  });

  test('Spinner resolves and displays all expected catalog products', async ({ page }) => {
    test.setTimeout(60_000);
    await burgerMenuPage.open();
    await burgerMenuPage.toggleDynamicCatalog();
    await burgerMenuPage.goToSpinner();

    await expect(page).toHaveURL(/\/dynamic-catalog-spinner\.html(?:[?#].*)?$/);
    await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Spinner');

    const spinner = page.locator('[data-test="dynamic-catalog-spinner"]');
    await expect(spinner).toBeVisible();
    await expect(spinner).toHaveAttribute('role', 'status');
    await expect(spinner).toHaveAttribute('aria-label', 'Loading');
    await expect(spinner).toBeHidden({ timeout: 30_000 });

    const itemNames = page.locator('[data-test^="spinner-item-"][data-test$="-name"]');
    const itemPrices = page.locator('[data-test^="spinner-item-"][data-test$="-price"]');
    await expect(itemNames).toHaveText(dynamicCatalogProducts.map(({ name }) => name));
    await expect(itemPrices).toHaveText(dynamicCatalogProducts.map(({ price }) => price));
  });

  test('Slider dots select each expected product', async ({ page }) => {
    await burgerMenuPage.open();
    await burgerMenuPage.toggleDynamicCatalog();
    await burgerMenuPage.goToSlider();

    await expect(page).toHaveURL(/\/dynamic-catalog-slider\.html(?:[?#].*)?$/);
    await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Slider');

    await page.locator('[data-test="dynamic-catalog-slider-dots"]').hover();
    const dots = page.locator('[data-test^="dynamic-catalog-slider-dot-"]');
    const itemName = page.locator('[data-test="dynamic-catalog-slider-item-name"]');
    const itemPrice = page.locator('[data-test="dynamic-catalog-slider-item-price"]');
    await expect(dots).toHaveCount(dynamicCatalogProducts.length);

    for (let index = 0; index < dynamicCatalogProducts.length; index += 1) {
      await dots.nth(index).click();
      await expect(dots.nth(index)).toHaveAttribute('aria-current', 'true');
      await expect(itemName).toHaveText(dynamicCatalogProducts[index].name);
      await expect(itemPrice).toHaveText(dynamicCatalogProducts[index].price);
    }
  });

  test('About navigates to the Sauce Labs website', async ({ page }) => {
    await burgerMenuPage.open();
    await burgerMenuPage.openAbout();

    await expect(page).toHaveURL(/^https:\/\/saucelabs\.com\/?$/);
    await expect(burgerMenuPage.menuButton).toBeHidden();
  });

  test('Logout closes the menu and returns to the login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await burgerMenuPage.open();
    await burgerMenuPage.logout();

    await expect(page).toHaveURL(/\/$/);
    await loginPage.expectLoginFormVisible();
    await expect(burgerMenuPage.menuButton).toBeHidden();
  });

  test('Reset App State clears multiple products, restores controls, and allows re-adding', async ({ page }) => {
    for (const name of productTestData.all.slice(0, 3)) {
      await productsPage.addProductToCart(name);
    }
    await expect(productsPage.cartBadge).toHaveText('3');

    await burgerMenuPage.open();
    await burgerMenuPage.resetAppState();
    await expect(productsPage.cartBadge).toBeHidden();
    await productsPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(0);

    await page.goto('/inventory.html');
    await productsPage.expectInventoryVisible();
    for (const name of productTestData.all.slice(0, 3)) {
      await expect(
        productsPage.productCard(name).getByRole('button', { name: 'Add to cart' }),
      ).toBeVisible();
    }

    await productsPage.addProductToCart(productTestData.backpack);
    await expect(productsPage.cartBadge).toHaveText('1');
    await expect(
      productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' }),
    ).toBeVisible();
    await productsPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(cartPage.itemNames).toHaveText([productTestData.backpack]);
  });

  test('Reset App State is safe when the cart is empty', async ({ page }) => {
    await productsPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(0);

    await burgerMenuPage.open();
    await burgerMenuPage.resetAppState();

    await expect(productsPage.cartBadge).toBeHidden();
    await expect(page.locator('[data-test="error"]')).toBeHidden();
    await page.goto('/inventory.html');
    await productsPage.expectInventoryVisible();
  });

  test('menu remains functional after refreshing inventory', async ({ page }) => {
    await page.reload();
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();

    await burgerMenuPage.open();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'false');
    await expect(burgerMenuPage.topLevelMenuItems).toHaveText(topLevelMenuEntries);
    await burgerMenuPage.close();
    await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
  });

  test('menu is available on product details, cart, and checkout pages', async ({ page }) => {
    const expectMenuUsable = async (): Promise<void> => {
      await expect(burgerMenuPage.menuButton).toBeVisible();
      await expect(burgerMenuPage.menuButton).toBeEnabled();
      await burgerMenuPage.open();
      await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'false');
      await expect(burgerMenuPage.topLevelMenuItems).toHaveText(topLevelMenuEntries);
      await burgerMenuPage.close();
      await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
    };

    const checkoutInformation: {
      firstName: string;
      lastName: string;
      postalCode: string;
    } = {
      firstName: 'Test',
      lastName: 'Customer',
      postalCode: '12345',
    };

    await productsPage.openFirstProduct();
    await expect(page).toHaveURL(/\/inventory-item\.html(?:[?#].*)?$/);
    await expectMenuUsable();

    await productsPage.returnToInventory();
    await productsPage.addProductToCart(productTestData.backpack);
    await productsPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await expectMenuUsable();

    const cartPage = new CartPage(page);
    await cartPage.checkout();
    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.expectInformationVisible();
    await expectMenuUsable();

    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
    await expectMenuUsable();

    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expectMenuUsable();
  });

  for (const route of resetRoutes) {
    test(`Reset App State clears cart from ${route}`, async ({ page }) => {
      await productsPage.addProductToCart(productTestData.backpack);
      await productsPage.addProductToCart(productTestData.bikeLight);
      await expect(productsPage.cartBadge).toHaveText('2');

      if (route === 'cart') {
        await productsPage.openCart();
      } else if (route === 'product details') {
        await productsPage.openProduct(productTestData.backpack);
      } else if (route === 'lazy load' || route === 'spinner' || route === 'slider') {
        await burgerMenuPage.open();
        await burgerMenuPage.toggleDynamicCatalog();
        if (route === 'lazy load') {
          await burgerMenuPage.goToLazyLoad();
          await expect(page).toHaveURL(/\/dynamic-catalog-lazy-load\.html(?:[?#].*)?$/);
          await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Lazy Load');
          await expect(page.locator('[data-test^="lazy-load-item-"][data-test$="-name"]').first()).toBeVisible();
        } else if (route === 'spinner') {
          await burgerMenuPage.goToSpinner();
          await expect(page).toHaveURL(/\/dynamic-catalog-spinner\.html(?:[?#].*)?$/);
          await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Spinner');
          await expect(page.locator('[data-test="dynamic-catalog-spinner"]')).toBeHidden();
          await expect(page.locator('[data-test^="spinner-item-"][data-test$="-name"]').first()).toBeVisible();
        } else {
          await burgerMenuPage.goToSlider();
          await expect(page).toHaveURL(/\/dynamic-catalog-slider\.html(?:[?#].*)?$/);
          await expect(page.locator('.title')).toHaveText('Dynamic Catalog - Slider');
          await expect(page.locator('[data-test="dynamic-catalog-slider-item-name"]')).toBeVisible();
        }
        await expect(burgerMenuPage.menuPanel).toHaveAttribute('aria-hidden', 'true');
      }

      await burgerMenuPage.open();
      await expect(burgerMenuPage.resetAppStateLink).toBeVisible();
      await burgerMenuPage.resetAppState();
      await expect(productsPage.cartBadge).toBeHidden();

      await page.goto('/cart.html');
      const cartPage = new CartPage(page);
      await cartPage.expectVisible();
      await expect(cartPage.cartItems).toHaveCount(0);

      await page.goto('/inventory.html');
      await productsPage.expectInventoryVisible();
      await expect(productsPage.productNames).toHaveText(productTestData.all);
      await expect(productsPage.addToCartButtons).toHaveCount(productTestData.all.length);
    });
  }
});
