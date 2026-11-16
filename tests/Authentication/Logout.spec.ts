import { test, expect } from '@playwright/test';
import { BurgerMenuPage } from '../../pages/BurgerMenuPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { productTestData } from '../../data/productTestData';

test('User can successfully log in and then log out', async ({ page }) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD must be set in the selected environment file.');
  }

  const loginPage = new LoginPage(page);
  const burgerMenuPage = new BurgerMenuPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', password);

  await expect(page).toHaveURL(/inventory\.html/);
  await burgerMenuPage.open();
  await expect(burgerMenuPage.logoutLink).toBeVisible();
  await burgerMenuPage.logout();

  await expect(page).toHaveURL(/\/$/);
  await loginPage.expectLoginFormVisible();

  await page.goto('/inventory.html');
  await expect(page).toHaveURL(/\/$/);
  await loginPage.expectLoginFormVisible();
});

test('Authenticated session is maintained after refreshing the inventory page', async ({ page }) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD must be set in the selected environment file.');
  }

  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', password);
  await expect(page).toHaveURL(/inventory\.html/);

  await page.reload();

  await expect(page).toHaveURL(/inventory\.html/);
  await expect(page.getByText('Products', { exact: true })).toBeVisible();
});

test('Cart item remains after logging out from checkout and logging in again', async ({ page }) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD must be set in the selected environment file.');
  }

  const loginPage = new LoginPage(page);
  const burgerMenuPage = new BurgerMenuPage(page);
  const productsPage = new ProductsPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', password);

  await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
  await productsPage.addProductToCart(productTestData.backpack);
  await expect(productsPage.cartBadge).toHaveText('1');
  await productsPage.openCart();

  const cartPage = new CartPage(page);
  await cartPage.expectVisible();
  expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
  await cartPage.checkout();
  await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
  await new CheckoutPage(page).expectInformationVisible();

  await burgerMenuPage.open();
  await burgerMenuPage.logout();
  await expect(page).toHaveURL(/\/$/);
  await loginPage.expectLoginFormVisible();

  await loginPage.login('standard_user', password);
  await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
  await expect(productsPage.cartBadge).toHaveText('1');
  await expect(
    productsPage.productCard(productTestData.backpack).getByRole('button', { name: 'Remove' }),
  ).toBeVisible();

  await productsPage.openCart();
  await cartPage.expectVisible();
  await expect(cartPage.cartItems).toHaveCount(1);
  expect(await cartPage.getItemNames()).toEqual([productTestData.backpack]);
  expect(await cartPage.getItemPrices()).toEqual([productTestData.catalog[0].price]);
});

test('Browser back after logout does not restore authenticated access', async ({ page }) => {
  const password = process.env.TEST_PASSWORD;
  if (!password) {
    throw new Error('TEST_PASSWORD must be set in the selected environment file.');
  }

  const loginPage = new LoginPage(page);
  const burgerMenuPage = new BurgerMenuPage(page);
  await loginPage.goto();
  await loginPage.login('standard_user', password);
  await expect(page).toHaveURL(/inventory\.html/);
  await burgerMenuPage.open();
  await burgerMenuPage.logout();
  await expect(page).toHaveURL(/\/$/);

  await page.goBack();

  await expect(page).not.toHaveURL(/inventory\.html/);
  await loginPage.expectLoginFormVisible();
});
