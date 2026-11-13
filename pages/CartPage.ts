import { expect, Locator, Page } from '@playwright/test';

export class CartPage {
  readonly title: Locator;
  readonly cartItems: Locator;
  readonly itemNames: Locator;
  readonly itemDescriptions: Locator;
  readonly itemPrices: Locator;
  readonly removeButtons: Locator;
  readonly continueShoppingButton: Locator;
  readonly checkoutButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.title');
    this.cartItems = page.locator('.cart_item');
    this.itemNames = page.locator('.cart_item .inventory_item_name');
    this.itemDescriptions = page.locator('.cart_item .inventory_item_desc');
    this.itemPrices = page.locator('.cart_item .inventory_item_price');
    this.removeButtons = page.locator('.cart_item button[data-test^="remove-"]');
    this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
    this.checkoutButton = page.locator('[data-test="checkout"]');
  }

  async expectVisible(): Promise<void> {
    await expect(this.title).toHaveText('Your Cart');
  }

  async getItemNames(): Promise<string[]> {
    return (await this.itemNames.allTextContents()).map((name) => name.trim());
  }

  async getItemDescriptions(): Promise<string[]> {
    return (await this.itemDescriptions.allTextContents()).map((description) =>
      description.trim(),
    );
  }

  async getItemPrices(): Promise<string[]> {
    return (await this.itemPrices.allTextContents()).map((price) => price.trim());
  }

  async removeProduct(name: string): Promise<void> {
    const item = this.cartItems.filter({
      has: this.page.getByText(name, { exact: true }),
    });
    await item.getByRole('button', { name: 'Remove' }).click();
  }

  async continueShopping(): Promise<void> {
    await this.continueShoppingButton.click();
  }

  async checkout(): Promise<void> {
    await this.checkoutButton.click();
  }
}
