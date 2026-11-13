import { test, expect } from '@playwright/test';
import { BurgerMenuPage } from '../../pages/BurgerMenuPage';
import { LoginPage } from '../../pages/LoginPage';

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
