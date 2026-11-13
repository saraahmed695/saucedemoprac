import { expect, Locator, Page } from '@playwright/test';

export type CheckoutCustomerInformation = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

export class CheckoutPage {
  readonly title: Locator;
  readonly firstNameInput: Locator;
  readonly lastNameInput: Locator;
  readonly postalCodeInput: Locator;
  readonly continueButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessage: Locator;
  readonly itemNames: Locator;
  readonly itemQuantities: Locator;
  readonly itemPrices: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;
  readonly completeHeader: Locator;
  readonly completeMessage: Locator;
  readonly backHomeButton: Locator;
  readonly generatePdfButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.title');
    this.firstNameInput = page.locator('[data-test="firstName"]');
    this.lastNameInput = page.locator('[data-test="lastName"]');
    this.postalCodeInput = page.locator('[data-test="postalCode"]');
    this.continueButton = page.locator('[data-test="continue"]');
    this.cancelButton = page.locator('[data-test="cancel"]');
    this.errorMessage = page.locator('[data-test="error"]');
    this.itemNames = page.locator('.cart_item .inventory_item_name');
    this.itemQuantities = page.locator('.cart_item .cart_quantity');
    this.itemPrices = page.locator('.cart_item .inventory_item_price');
    this.subtotal = page.locator('.summary_subtotal_label');
    this.tax = page.locator('.summary_tax_label');
    this.total = page.locator('.summary_total_label');
    this.finishButton = page.locator('[data-test="finish"]');
    this.completeHeader = page.locator('.complete-header');
    this.completeMessage = page.locator('.complete-text');
    this.backHomeButton = page.locator('[data-test="back-to-products"]');
    this.generatePdfButton = page.getByRole('button', { name: 'Generate PDF order' });
  }

  async expectInformationVisible(): Promise<void> {
    await expect(this.title).toHaveText('Checkout: Your Information');
    await expect(this.firstNameInput).toBeVisible();
    await expect(this.lastNameInput).toBeVisible();
    await expect(this.postalCodeInput).toBeVisible();
  }

  async fillCustomerInformation(information: CheckoutCustomerInformation): Promise<void> {
    await this.firstNameInput.fill(information.firstName);
    await this.lastNameInput.fill(information.lastName);
    await this.postalCodeInput.fill(information.postalCode);
  }

  async continue(): Promise<void> {
    await this.continueButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectValidationError(message: string): Promise<void> {
    await expect(this.errorMessage).toHaveText(message);
  }

  async expectOverviewVisible(): Promise<void> {
    await expect(this.title).toHaveText('Checkout: Overview');
    await expect(this.finishButton).toBeVisible();
    await expect(this.subtotal).toBeVisible();
    await expect(this.tax).toBeVisible();
    await expect(this.total).toBeVisible();
  }

  async getItemNames(): Promise<string[]> {
    return (await this.itemNames.allTextContents()).map((name) => name.trim());
  }

  async getItemQuantities(): Promise<number[]> {
    const quantities = await this.itemQuantities.allTextContents();
    return quantities.map((quantity) => {
      const parsedQuantity = Number(quantity.trim());
      if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
        throw new Error(`Invalid product quantity displayed: "${quantity}"`);
      }
      return parsedQuantity;
    });
  }

  async getItemPrices(): Promise<string[]> {
    return (await this.itemPrices.allTextContents()).map((price) => price.trim());
  }

  async getAmount(locator: Locator): Promise<number> {
    const text = await locator.innerText();
    const amount = text.match(/\$([\d,]+(?:\.\d{2})?)/);
    if (!amount) {
      throw new Error(`Could not read currency amount from "${text}"`);
    }

    return Number(amount[1].replace(',', ''));
  }

  async finish(): Promise<void> {
    await this.finishButton.click();
  }

  async backHome(): Promise<void> {
    await this.backHomeButton.click();
  }

  async generateOrderPdf(): Promise<void> {
    await this.generatePdfButton.click();
  }
}
