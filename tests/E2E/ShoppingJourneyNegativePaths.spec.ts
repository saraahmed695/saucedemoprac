import { expect, test } from '../fixtures/authenticatedTest';
import { BurgerMenuPage } from '../../pages/BurgerMenuPage';
import { CartPage } from '../../pages/CartPage';
import { CheckoutPage } from '../../pages/CheckoutPage';
import { LoginPage } from '../../pages/LoginPage';
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

const journeyProducts = productTestData.catalog.slice(0, 2);

test.describe('E2E Scenario 2: Checkout negative paths', () => {
  let loginPage: LoginPage;
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    loginPage = new LoginPage(authenticatedPage);
    productsPage = new ProductsPage(authenticatedPage);
  });

  test('validates checkout, preserves the cart on cancel, and rejects post-logout access', async ({
    authenticatedPage,
  }) => {
    test.setTimeout(60_000);

    for (const product of journeyProducts) {
      await productsPage.addProductToCart(product.name);
    }
    await expect(productsPage.cartBadge).toHaveText(String(journeyProducts.length));
    await productsPage.openCart();
    await expect(authenticatedPage).toHaveURL(/\/cart\.html(?:[?#].*)?$/);

    const cartPage = new CartPage(authenticatedPage);
    await cartPage.expectVisible();
    await cartPage.checkout();
    await expect(authenticatedPage).toHaveURL(/\/checkout-step-one\.html(?:[?#].*)?$/);

    const checkoutPage = new CheckoutPage(authenticatedPage);
    await checkoutPage.expectInformationVisible();
    await checkoutPage.continue();
    await checkoutPage.expectValidationError('Error: First Name is required');

    await checkoutPage.fillCustomerInformation({
      ...customerInformation,
      postalCode: '',
    });
    await checkoutPage.continue();
    await checkoutPage.expectValidationError('Error: Postal Code is required');

    await checkoutPage.fillCustomerInformation(customerInformation);
    await checkoutPage.continue();
    await expect(authenticatedPage).toHaveURL(/\/checkout-step-two\.html(?:[?#].*)?$/);
    await checkoutPage.expectOverviewVisible();
    expect(await checkoutPage.getItemNames()).toEqual(journeyProducts.map(({ name }) => name));

    await checkoutPage.cancel();
    await expect(authenticatedPage).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
    await expect(productsPage.cartBadge).toHaveText(String(journeyProducts.length));

    await productsPage.openCart();
    await expect(authenticatedPage).toHaveURL(/\/cart\.html(?:[?#].*)?$/);
    await cartPage.expectVisible();
    expect(await cartPage.getItemNames()).toEqual(journeyProducts.map(({ name }) => name));
    expect(await cartPage.getItemPrices()).toEqual(journeyProducts.map(({ price }) => price));

    const burgerMenuPage = new BurgerMenuPage(authenticatedPage);
    await burgerMenuPage.open();
    await burgerMenuPage.logout();
    await expect(authenticatedPage).toHaveURL(/\/$/);
    await loginPage.expectLoginFormVisible();

    await authenticatedPage.goto('/inventory.html');
    await expect(authenticatedPage).toHaveURL(/\/$/);
    await loginPage.expectLoginFormVisible();
    await authenticatedPage.goBack();
    await expect(authenticatedPage).not.toHaveURL(/\/inventory\.html/);
    await loginPage.expectLoginFormVisible();
  });
});
