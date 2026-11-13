import { expect, Locator, Page } from '@playwright/test';

export class LoginPage {
  readonly loginContainer: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly productsHeading: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;

  constructor(private readonly page: Page) {
    this.loginContainer = page.locator('#login_button_container');
    this.usernameInput = page.locator('[data-test="username"]');
    this.passwordInput = page.locator('[data-test="password"]');
    this.loginButton = page.locator('[data-test="login-button"]');
    this.productsHeading = page.getByText('Products', { exact: true });
    this.errorMessage = page.locator('[data-test="error"]');
    this.errorCloseButton = this.errorMessage.locator('button');
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
  }

  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.loginContainer).toBeVisible();
    await expect(this.usernameInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
  }

  async expectLoginError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }
}
