import { expect, test as base, type Page } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';

type AuthenticatedFixtures = {
  authenticatedPage: Page;
  authUsername: string;
};

export const test = base.extend<AuthenticatedFixtures>({
  authUsername: ['standard_user', { option: true }],
  authenticatedPage: async ({ page, authUsername }, use) => {
    const password = process.env.TEST_PASSWORD;
    if (!password) {
      throw new Error('TEST_PASSWORD must be set in the selected environment file.');
    }

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(authUsername, password);

    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await new ProductsPage(page).expectInventoryVisible();
    await use(page);
  },
});

export { expect };
