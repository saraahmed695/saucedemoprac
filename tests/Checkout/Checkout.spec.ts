import { test, expect } from '../fixtures/authenticatedTest';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { CartPage } from '../../pages/CartPage';
import { CheckoutCustomerInformation, CheckoutPage } from '../../pages/CheckoutPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { productTestData } from '../../data/productTestData';

const checkoutInformation: CheckoutCustomerInformation = {
  firstName: 'Test',
  lastName: 'Customer',
  postalCode: '12345',
};

const checkoutValidationCases: {
  name: string;
  information: CheckoutCustomerInformation;
  errorMessage: string;
}[] = [
  {
    name: 'first name',
    information: { ...checkoutInformation, firstName: '' },
    errorMessage: 'Error: First Name is required',
  },
  {
    name: 'last name',
    information: { ...checkoutInformation, lastName: '' },
    errorMessage: 'Error: Last Name is required',
  },
  {
    name: 'postal code',
    information: { ...checkoutInformation, postalCode: '' },
    errorMessage: 'Error: Postal Code is required',
  },
];

const whitespaceCheckoutCases: {
  name: string;
  information: CheckoutCustomerInformation;
}[] = [
  {
    name: 'first name',
    information: { ...checkoutInformation, firstName: '   ' },
  },
  {
    name: 'last name',
    information: { ...checkoutInformation, lastName: '   ' },
  },
  {
    name: 'postal code',
    information: { ...checkoutInformation, postalCode: '   ' },
  },
];

const checkoutProductNames = [productTestData.backpack, productTestData.bikeLight];

test.describe('Checkout functionality', () => {
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;
  let expectedPrices: string[];

  test.beforeEach(async ({ authenticatedPage }) => {
    const productsPage = new ProductsPage(authenticatedPage);
    await productsPage.expectInventoryVisible();

    expectedPrices = await Promise.all(
      checkoutProductNames.map((name) => productsPage.getProductPrice(name)),
    );
    for (const name of checkoutProductNames) {
      await productsPage.addProductToCart(name);
    }
    await productsPage.openCart();

    cartPage = new CartPage(authenticatedPage);
    await cartPage.expectVisible();
    checkoutPage = new CheckoutPage(authenticatedPage);
  });

  test('completes an order successfully', async ({ page }) => {
    await cartPage.checkout();
    await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();

    await expect(page).toHaveURL(/\/checkout-step-two\.html(?:[?#].*)?$/);
    await checkoutPage.expectOverviewVisible();
    await checkoutPage.finish();

    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeMessage).toContainText('Your order has been dispatched');
    await expect(checkoutPage.finishButton).toBeHidden();

    await checkoutPage.backHome();
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);

    const productsPage = new ProductsPage(page);
    await expect(productsPage.cartBadge).toBeHidden();
    await productsPage.openCart();
    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await expect(cartPage.cartItems).toHaveCount(0);
  });

  test('does not expose a second submission after order completion', async ({ page }) => {
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
    await checkoutPage.finish();

    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.finishButton).toHaveCount(0);
    await expect(checkoutPage.generatePdfButton).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.finishButton).toHaveCount(0);
  });

  test('downloads the completed order PDF', async ({ page }, testInfo) => {
    await cartPage.checkout();
    await checkoutPage.expectInformationVisible();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();

    await checkoutPage.finish();
    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.generatePdfButton).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await checkoutPage.generateOrderPdf();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
    const pdfPath = testInfo.outputPath(path.basename(download.suggestedFilename()));
    await download.saveAs(pdfPath);
    const fileStats = await stat(pdfPath);
    expect(fileStats.isFile()).toBe(true);
    expect(fileStats.size).toBeGreaterThan(0);

    const fileContents = await readFile(pdfPath);
    expect(fileContents.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  test('shows the correct products and order summary amounts', async () => {
    await cartPage.checkout();
    await checkoutPage.expectInformationVisible();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();

    expect(await checkoutPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await checkoutPage.getItemPrices()).toEqual(expectedPrices);

    const expectedSubtotalCents = expectedPrices.reduce(
      (total, price) => total + Math.round(Number(price.replace('$', '')) * 100),
      0,
    );
    const subtotalCents = Math.round((await checkoutPage.getAmount(checkoutPage.subtotal)) * 100);
    const taxCents = Math.round((await checkoutPage.getAmount(checkoutPage.tax)) * 100);
    const totalCents = Math.round((await checkoutPage.getAmount(checkoutPage.total)) * 100);

    expect(subtotalCents).toBe(expectedSubtotalCents);
    expect(taxCents).toBeGreaterThan(0);
    expect(totalCents).toBe(subtotalCents + taxCents);
  });

  test('displays the correct product quantities in the checkout overview', async () => {
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();

    expect(await checkoutPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await checkoutPage.getItemQuantities()).toEqual([1, 1]);
  });

  test('calculates tax and total correctly for a single product', async () => {
    await cartPage.removeProduct(productTestData.bikeLight);
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();

    expect(await checkoutPage.getItemNames()).toEqual([productTestData.backpack]);
    const subtotalCents = Math.round((await checkoutPage.getAmount(checkoutPage.subtotal)) * 100);
    const taxCents = Math.round((await checkoutPage.getAmount(checkoutPage.tax)) * 100);
    const totalCents = Math.round((await checkoutPage.getAmount(checkoutPage.total)) * 100);
    expect(subtotalCents).toBe(2999);
    expect(taxCents).toBe(Math.round(subtotalCents * 0.08));
    expect(totalCents).toBe(subtotalCents + taxCents);
  });

  test('rounds tax correctly at a cent boundary', async () => {
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();

    const subtotalCents = Math.round((await checkoutPage.getAmount(checkoutPage.subtotal)) * 100);
    const taxCents = Math.round((await checkoutPage.getAmount(checkoutPage.tax)) * 100);
    const totalCents = Math.round((await checkoutPage.getAmount(checkoutPage.total)) * 100);
    expect(subtotalCents).toBe(3998);
    expect(taxCents).toBe(Math.round(subtotalCents * 0.08));
    expect(taxCents).toBe(320);
    expect(totalCents).toBe(subtotalCents + taxCents);
  });

  for (const boundaryCase of whitespaceCheckoutCases) {
    test(`accepts whitespace-only ${boundaryCase.name}`, async () => {
      await cartPage.checkout();
      await checkoutPage.fillCustomerInformation(boundaryCase.information);
      await checkoutPage.continue();
      await checkoutPage.expectOverviewVisible();
    });
  }

  test('accepts long checkout field values', async () => {
    const longInformation = {
      firstName: 'A'.repeat(256),
      lastName: 'B'.repeat(256),
      postalCode: '9'.repeat(256),
    };

    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(longInformation);
    await expect(checkoutPage.firstNameInput).toHaveValue(longInformation.firstName);
    await expect(checkoutPage.lastNameInput).toHaveValue(longInformation.lastName);
    await expect(checkoutPage.postalCodeInput).toHaveValue(longInformation.postalCode);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
  });

  test('accepts checkout field values containing special characters', async () => {
    const specialInformation = {
      firstName: "O'Neil-测试",
      lastName: 'QA & Co.',
      postalCode: 'A1 #?!',
    };

    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(specialInformation);
    await expect(checkoutPage.firstNameInput).toHaveValue(specialInformation.firstName);
    await expect(checkoutPage.lastNameInput).toHaveValue(specialInformation.lastName);
    await expect(checkoutPage.postalCodeInput).toHaveValue(specialInformation.postalCode);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
  });

  test('keeps checkout usable and preserves cart after reloading checkout information', async ({ page }) => {
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await page.reload();

    await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.cancel();

    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await expect(cartPage.cartItems).toHaveCount(checkoutProductNames.length);
    expect(await cartPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await cartPage.getItemPrices()).toEqual(expectedPrices);

    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
  });

  test('preserves cart and checkout usability after browser back from overview', async ({ page }) => {
    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
    await page.goBack();

    await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.cancel();

    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await expect(cartPage.cartItems).toHaveCount(checkoutProductNames.length);
    expect(await cartPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await cartPage.getItemPrices()).toEqual(expectedPrices);

    await cartPage.checkout();
    await checkoutPage.fillCustomerInformation(checkoutInformation);
    await checkoutPage.continue();
    await checkoutPage.expectOverviewVisible();
  });

  for (const validationCase of checkoutValidationCases) {
    test(`requires the ${validationCase.name}`, async ({ page }) => {
      await cartPage.checkout();
      await checkoutPage.expectInformationVisible();
      await checkoutPage.fillCustomerInformation(validationCase.information);
      await checkoutPage.continue();
      await checkoutPage.expectValidationError(validationCase.errorMessage);
      await expect(page).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
      await expect(checkoutPage.title).toHaveText('Checkout: Your Information');
      await expect(checkoutPage.finishButton).toBeHidden();
    });
  }

  test('completes an order after direct navigation to checkout overview without entering information', async ({
    page,
  }) => {
    await page.goto('/checkout-step-two.html');

    await expect(page).toHaveURL(/\/checkout-step-two\.html(?:[?#].*)?$/);
    await checkoutPage.expectOverviewVisible();
    expect(await checkoutPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await checkoutPage.getItemPrices()).toEqual(expectedPrices);

    await checkoutPage.finish();

    await expect(page).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeMessage).toContainText('Your order has been dispatched');
  });

  test('cancels checkout and keeps cart items', async ({ page }) => {
    await cartPage.checkout();
    await checkoutPage.expectInformationVisible();
    await checkoutPage.cancel();

    await expect(page).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await cartPage.expectVisible();
    await expect(cartPage.cartItems).toHaveCount(checkoutProductNames.length);
    expect(await cartPage.getItemNames()).toEqual(checkoutProductNames);
    expect(await cartPage.getItemPrices()).toEqual(expectedPrices);
  });
});
