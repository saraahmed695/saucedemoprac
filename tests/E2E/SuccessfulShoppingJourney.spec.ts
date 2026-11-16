import { expect, test } from '../fixtures/authenticatedTest';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { loginTestCases } from '../../data/loginTestData';
import { productTestData } from '../../data/productTestData';

const validCredentials = loginTestCases.find(
  (testCase) => testCase.expectedResult.type === 'success',
);

if (!validCredentials) {
  throw new Error('At least one valid login case is required for end-to-end shopping journeys.');
}

test.use({ authUsername: validCredentials.username });

const customerInformation = {
  firstName: 'End-to-end',
  lastName: 'Tester',
  postalCode: '12345',
};

const journeyProducts = productTestData.catalog.slice(0, 3);
const removedProduct = journeyProducts[journeyProducts.length - 1];
const remainingProducts = journeyProducts.slice(0, -1);

const toCents = (price: string): number =>
  Math.round(Number(price.replace('$', '')) * 100);

test.describe('E2E Scenario 1: Successful shopping journey', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    productsPage = new ProductsPage(authenticatedPage);
  });

  test('sorts, updates the cart, and completes checkout', async ({ authenticatedPage }) => {
    await expect(productsPage.productNames).toHaveText(productTestData.all);
    await productsPage.selectSort('lohi');
    await expect(productsPage.sortDropdown).toHaveValue('lohi');
    const sortedPrices = await productsPage.getProductPrices();
    expect(sortedPrices).toEqual([...sortedPrices].sort((left, right) => left - right));

    for (const product of journeyProducts) {
      await productsPage.addProductToCart(product.name);
    }
    await expect(productsPage.cartBadge).toHaveText(String(journeyProducts.length));
    await productsPage.openCart();
    await expect(authenticatedPage).toHaveURL(/\/cart\.html(?:[?#].*)?$/);

    const cartPage = new CartPage(authenticatedPage);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual(journeyProducts.map(({ name }) => name));
    await cartPage.removeProduct(removedProduct.name);

    await expect(cartPage.cartItems).toHaveCount(remainingProducts.length);
    await expect(productsPage.cartBadge).toHaveText(String(remainingProducts.length));
    expect(await cartPage.getItemNames()).toEqual(remainingProducts.map(({ name }) => name));
    expect(await cartPage.getItemPrices()).toEqual(remainingProducts.map(({ price }) => price));

    await cartPage.checkout();
    await expect(authenticatedPage).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);
    const checkoutPage = new CheckoutPage(authenticatedPage);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.fillCustomerInformation(customerInformation);
    await checkoutPage.continue();
    await expect(authenticatedPage).toHaveURL(/\/checkout-step-two\.html(?:[?#].*)?$/);
    await checkoutPage.expectOverviewVisible();

    const expectedSubtotalCents = remainingProducts.reduce(
      (subtotal, product) => subtotal + toCents(product.price),
      0,
    );
    const subtotalCents = Math.round((await checkoutPage.getAmount(checkoutPage.subtotal)) * 100);
    const taxCents = Math.round((await checkoutPage.getAmount(checkoutPage.tax)) * 100);
    const totalCents = Math.round((await checkoutPage.getAmount(checkoutPage.total)) * 100);

    expect(await checkoutPage.getItemNames()).toEqual(remainingProducts.map(({ name }) => name));
    expect(await checkoutPage.getItemPrices()).toEqual(remainingProducts.map(({ price }) => price));
    expect(subtotalCents).toBe(expectedSubtotalCents);
    expect(taxCents).toBe(Math.round(expectedSubtotalCents * 0.08));
    expect(totalCents).toBe(subtotalCents + taxCents);

    await checkoutPage.finish();
    await expect(authenticatedPage).toHaveURL(/\/checkout-complete\.html(?:[?#].*)?$/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(checkoutPage.completeMessage).toContainText('Your order has been dispatched');
  });
});
