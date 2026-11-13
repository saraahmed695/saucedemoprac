import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { ProductsPage } from '../../pages/ProductsPage';
import { productTestData } from '../../data/productTestData';

test.describe('Product functionality', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ page }) => {
    const password = process.env.TEST_PASSWORD;
    if (!password) {
      throw new Error('TEST_PASSWORD must be set in the selected environment file.');
    }

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('standard_user', password);

    productsPage = new ProductsPage(page);
    await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
    await productsPage.expectInventoryVisible();
  });

  test('displays all six available products on the inventory page', async () => {
    await expect(productsPage.productCards).toHaveCount(6);
    const displayedNames = await productsPage.getProductNames();
    expect([...displayedNames].sort()).toEqual([...productTestData.all].sort());
  });

  test('displays the correct name for every product', async () => {
    for (const product of productTestData.catalog) {
      const name = productsPage.productCard(product.name).locator('.inventory_item_name');
      await expect(name).toBeVisible();
      await expect(name).toHaveText(product.name);
    }
  });

  test('displays the correct description for every product', async () => {
    for (const product of productTestData.catalog) {
      await expect(
        productsPage.productCard(product.name).locator('.inventory_item_desc'),
      ).toHaveText(product.description);
    }
  });

  test('displays the correct price for every product', async () => {
    for (const product of productTestData.catalog) {
      await expect(
        productsPage.productCard(product.name).locator('.inventory_item_price'),
      ).toHaveText(product.price);
    }
  });

  test('loads an image for every product', async () => {
    for (const product of productTestData.catalog) {
      const image = productsPage.productCard(product.name).locator('.inventory_item_img img');
      await expect(image).toBeVisible();
      await expect
        .poll(() =>
          image.evaluate(
            (element) =>
              element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
  });

  test('shows an Add to Cart button for every product', async () => {
    const productCount = await productsPage.productCards.count();
    expect(productCount).toBeGreaterThan(0);
    await expect(productsPage.addToCartButtons).toHaveCount(productCount);

    for (let index = 0; index < productCount; index += 1) {
      const addToCartButton = productsPage.addToCartButtons.nth(index);
      await expect(addToCartButton).toBeVisible();
      await expect(addToCartButton).toBeEnabled();
    }
  });

  for (const product of productTestData.catalog) {
    test(`opens ${product.name} details and returns to the inventory`, async ({ page }) => {
      const expectedDetails = await productsPage.openProduct(product.name);

      await expect(page).toHaveURL(/\/inventory-item\.html(?:[?#].*)?$/);
      await expect(productsPage.detailName).toHaveText(product.name);
      await expect(productsPage.detailDescription).toHaveText(product.description);
      await expect(productsPage.detailPrice).toHaveText(product.price);
      await expect(productsPage.detailImage).toHaveAttribute('src', expectedDetails.imageSrc);
      await expect
        .poll(() =>
          productsPage.detailImage.evaluate(
            (element) =>
              element instanceof HTMLImageElement && element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
      await expect(productsPage.backToProductsButton).toBeVisible();

      await productsPage.returnToInventory();
      await expect(page).toHaveURL(/\/inventory\.html(?:[?#].*)?$/);
      await productsPage.expectInventoryVisible();
      await expect(productsPage.productNames).toHaveText(productTestData.all);
    });
  }
});
