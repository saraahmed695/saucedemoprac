import { test, expect } from '@playwright/test';
import { BurgerMenuPage } from '../../pages/BurgerMenuPage';
import { LoginPage } from '../../pages/LoginPage';
import { loginTestCases } from '../../data/loginTestData';

test.describe('Data-driven login tests', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoginFormVisible();
  });

  for (const testCase of loginTestCases) {
    test(`Login: ${testCase.name}`, async ({ page }) => {
      await loginPage.login(testCase.username, testCase.password);

      if (testCase.expectedResult.type === 'success') {
        await expect(page).toHaveURL(/inventory.html/);
        await expect(loginPage.productsHeading).toBeVisible();
        const burgerMenuPage = new BurgerMenuPage(page);
        await burgerMenuPage.open();
        await expect(burgerMenuPage.logoutLink).toBeVisible();
      } else {
        await loginPage.expectLoginError(testCase.expectedResult.message);
      }
    });
  }

  test('Login: submits login form using Enter key', async ({ page }) => {
    const validCredentials = loginTestCases[0];
    await loginPage.usernameInput.fill(validCredentials.username);
    await loginPage.passwordInput.fill(validCredentials.password);
    await loginPage.passwordInput.press('Enter');

    await expect(page).toHaveURL(/inventory.html/);
    await expect(loginPage.productsHeading).toBeVisible();
  });

  test('Login: masks password input', async () => {
    const validCredentials = loginTestCases[0];
    await loginPage.passwordInput.fill(validCredentials.password);

    await expect(loginPage.passwordInput).toHaveAttribute('type', 'password');
  });

  test('Login: dismisses login error using the close button', async () => {
    await loginPage.login('invalid_user_for_interaction_test', 'invalid_password');
    await loginPage.expectLoginError(
      'Epic sadface: Username and password do not match any user in this service',
    );
    await loginPage.errorCloseButton.click();

    await expect(loginPage.errorMessage).toBeHidden();
  });

  test('Login: clears previous login error after correcting credentials', async ({ page }) => {
    await loginPage.login('invalid_user_for_interaction_test', 'invalid_password');
    await loginPage.expectLoginError(
      'Epic sadface: Username and password do not match any user in this service',
    );

    const validCredentials = loginTestCases[0];
    await loginPage.login(validCredentials.username, validCredentials.password);

    await expect(page).toHaveURL(/inventory.html/);
    await expect(loginPage.errorMessage).toBeHidden();
  });
});