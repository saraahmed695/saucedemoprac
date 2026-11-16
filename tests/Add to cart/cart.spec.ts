import { test, expect } from '../fixtures/authenticatedTest';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { cartProductTestCases } from '../../data/cartTestData';
import { productTestData } from '../../data/productTestData';

test.describe('Add to Cart functionality', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    productsPage = new ProductsPage(authenticatedPage);
  });

  for (const testCase of cartProductTestCases) {
    test(`adds ${testCase.name} and verifies its cart contents`, async ({ page }) => {
      await productsPage.addProductToCart(testCase.name);

      await expect(
        productsPage.productCard(testCase.name).getByRole('button', { name: 'Remove' }),
      ).toBeVisible();
      await expect(productsPage.cartBadge).toHaveText('1');
      await productsPage.openCart();

      const cartPage = new CartPage(page);
      await cartPage.expectVisible();
      await expect(cartPage.cartItems).toHaveCount(1);
      expect(await cartPage.getItemNames()).toEqual([testCase.name]);
      expect(await cartPage.getItemPrices()).toEqual([testCase.expectedPrice]);
    });
  }

  test('adds multiple products and verifies cart count and contents', async ({ page }) => {
    const expectedNames = [productTestData.backpack, productTestData.bikeLight];
    const expectedPrices = await Promise.all(expectedNames.map((name) => productsPage.getProductPrice(name)));

    for (const name of expectedNames) {
      await productsPage.addProductToCart(name);
    }

    await expect(productsPage.cartBadge).toHaveText(String(expectedNames.length));
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual(expectedNames);
    expect(await cartPage.getItemPrices()).toEqual(expectedPrices);
  });

  test('adds all available products to the cart', async ({ page }) => {
    for (const name of productTestData.all) {
      await productsPage.addProductToCart(name);
    }

    await expect(productsPage.cartBadge).toHaveText(String(productTestData.all.length));
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(productTestData.all.length);
    expect(await cartPage.getItemNames()).toEqual(productTestData.all);
  });

  test('displays correct product information in the cart', async ({ page }) => {
    const product = productTestData.catalog[0];
    await productsPage.addProductToCart(product.name);
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(1);
    expect(await cartPage.getItemNames()).toEqual([product.name]);
    expect(await cartPage.getItemDescriptions()).toEqual([product.description]);
    expect(await cartPage.getItemPrices()).toEqual([product.price]);
  });

  test('displays an empty cart before products are added', async ({ page }) => {
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(productsPage.cartBadge).toBeHidden();
  });

  test('adds a product to the cart from its details page', async ({ page }) => {
    const expectedPrice = await productsPage.getProductPrice(productTestData.backpack);
    await productsPage.openProduct(productTestData.backpack);
    await expect(productsPage.detailName).toHaveText(productTestData.backpack);
    await productsPage.addDetailProductToCart();
    await expect(productsPage.cartBadge).toHaveText('1');
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
    expect(await cartPage.getItemPrices()).toEqual([expectedPrice]);
  });

  test('removes a product and updates the cart', async ({ page }) => {
    await productsPage.addProductToCart(productTestData.backpack);
    await productsPage.addProductToCart(productTestData.bikeLight);
    await expect(productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(productsPage.productCard(productTestData.bikeLight).getByRole('button', { name: 'Remove' })).toBeVisible();
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await cartPage.removeProduct(productTestData.backpack);

    await expect(cartPage.cartItems).toHaveCount(1);
    expect(await cartPage.getItemNames()).toEqual([productTestData.bikeLight]);
    await expect(productsPage.cartBadge).toHaveText('1');

    await cartPage.removeProduct(productTestData.bikeLight);
    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(productsPage.cartBadge).toBeHidden();

    await cartPage.continueShopping();
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await expect(productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await expect(productsPage.productCard(productTestData.bikeLight).getByRole('button', { name: 'Add to cart' })).toBeVisible();
  });

  test('preserves cart contents when navigating between inventory and cart', async ({ page }) => {
    const expectedPrice = await productsPage.getProductPrice(productTestData.backpack);
    await productsPage.addProductToCart(productTestData.backpack);
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);

    await cartPage.continueShopping();
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
    await expect(productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' })).toBeVisible();

    await productsPage.openCart();
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
    expect(await cartPage.getItemPrices()).toEqual([expectedPrice]);
  });

  test('preserves cart contents when opening product details and returning', async ({ page }) => {
    await productsPage.addProductToCart(productTestData.backpack);
    await expect(productsPage.cartBadge).toHaveText('1');

    await productsPage.openProduct(productTestData.bikeLight);
    await expect(productsPage.detailName).toHaveText(productTestData.bikeLight);
    await productsPage.returnToInventory();

    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await expect(productsPage.cartBadge).toHaveText('1');
    await expect(
      productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' }),
    ).toBeVisible();
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
  });

  test('keeps product controls and cart contents synchronized when removing and re-adding', async ({ page }) => {
    const backpackCard = productsPage.productCard(productTestData.backpack);

    await productsPage.addProductToCart(productTestData.backpack);
    await expect(backpackCard.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(productsPage.cartBadge).toHaveText('1');

    await productsPage.removeProductFromCart(productTestData.backpack);
    await expect(backpackCard.getByRole('button', { name: 'Add to cart' })).toBeVisible();
    await expect(productsPage.cartBadge).toBeHidden();

    await productsPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(0);

    await cartPage.continueShopping();
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);

    await productsPage.addProductToCart(productTestData.backpack);
    await expect(backpackCard.getByRole('button', { name: 'Remove' })).toBeVisible();
    await expect(productsPage.cartBadge).toHaveText('1');
    await productsPage.openCart();

    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
  });

  test('preserves cart contents after refreshing the cart page', async ({ page }) => {
    await productsPage.addProductToCart(productTestData.backpack);
    await productsPage.openCart();

    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await page.reload();

    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(1);
    await expect(productsPage.cartBadge).toHaveText('1');
    expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
  });

  test('preserves cart contents after refreshing the inventory page', async ({ page }) => {
    const expectedNames = [productTestData.backpack, productTestData.bikeLight];
    for (const name of expectedNames) {
      await productsPage.addProductToCart(name);
    }

    await page.reload();

    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
    await expect(productsPage.cartBadge).toHaveText(String(expectedNames.length));
    for (const name of expectedNames) {
      await expect(
        productsPage.productCard(name).getByRole('button', { name: 'Remove' }),
      ).toBeVisible();
    }

    await productsPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual(expectedNames);
  });

  test('completes checkout successfully with an empty cart', async ({ page }) => {
    await productsPage.openCart();
    const cartPage = new CartPage(page);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(productsPage.cartBadge).toBeHidden();

    await cartPage.checkout();
    await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);

    const checkoutPage = new CheckoutPage(page);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.fillCustomerInformation({
      firstName: 'Test',
      lastName: 'Customer',
      postalCode: '12345',
    });
    await checkoutPage.continue();

    await expect(page).toHaveURL(/\/checkout-step-two\.html(?:[?#].*)?$/);
    await checkoutPage.expectOverviewVisible();
    await expect(checkoutPage.itemNames).toHaveCount(0);
    expect(await checkoutPage.getAmount(checkoutPage.subtotal)).toBe(0);
    expect(await checkoutPage.getAmount(checkoutPage.tax)).toBe(0);
    expect(await checkoutPage.getAmount(checkoutPage.total)).toBe(0);

    await checkoutPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeMessage).toContainText('Your order has been dispatched');
  });
});
