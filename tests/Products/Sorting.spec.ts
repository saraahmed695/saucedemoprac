import { test, expect } from '../fixtures/authenticatedTest';
import { ProductsPage, ProductSortOption } from '../../pages/ProductsPage';
import { productTestData } from '../../data/productTestData';

const sortCases: {
  name: string;
  option: ProductSortOption;
  by: 'name' | 'price';
  descending?: boolean;
}[] = [
  { name: 'name ascending', option: 'az', by: 'name' },
  { name: 'name descending', option: 'za', by: 'name', descending: true },
  { name: 'price ascending', option: 'lohi', by: 'price' },
  { name: 'price descending', option: 'hilo', by: 'price', descending: true },
];

test.describe('Product sorting', () => {
  let productsPage: ProductsPage;

  test.beforeEach(async ({ authenticatedPage }) => {
    productsPage = new ProductsPage(authenticatedPage);
  });

  test('displays products in alphabetical order by default', async () => {
    expect(await productsPage.getProductNames()).toEqual(
      [...productTestData.all].sort((left, right) => left.localeCompare(right)),
    );
    await expect(productsPage.sortDropdown).toHaveValue('az');
  });

  for (const sortCase of sortCases) {
    test(`sorts products by ${sortCase.name}`, async () => {
      const originalValues =
        sortCase.by === 'name'
          ? await productsPage.getProductNames()
          : await productsPage.getProductPrices();
      const sortedValues = [...originalValues].sort((left, right) =>
        sortCase.by === 'name'
          ? String(left).localeCompare(String(right))
          : Number(left) - Number(right),
      );
      if (sortCase.descending) {
        sortedValues.reverse();
      }

      await productsPage.selectSort(sortCase.option);
      await expect(productsPage.sortDropdown).toHaveValue(sortCase.option);

      const actualValues =
        sortCase.by === 'name'
          ? await productsPage.getProductNames()
          : await productsPage.getProductPrices();
      expect(actualValues).toEqual(sortedValues);
    });
  }

  test('applies multiple sort options consecutively', async () => {
    await productsPage.selectSort('az');
    await expect(productsPage.sortDropdown).toHaveValue('az');
    expect(await productsPage.getProductNames()).toEqual(
      [...(await productsPage.getProductNames())].sort((left, right) => left.localeCompare(right)),
    );

    await productsPage.selectSort('hilo');
    await expect(productsPage.sortDropdown).toHaveValue('hilo');
    expect(await productsPage.getProductPrices()).toEqual(
      [...(await productsPage.getProductPrices())].sort((left, right) => right - left),
    );
  });

  test('sorts equal-price products without losing or duplicating products', async () => {
    const namesBeforeSort = await productsPage.getProductNames();
    const productCount = await productsPage.productCards.count();

    await productsPage.selectSort('lohi');

    const namesAfterSort = await productsPage.getProductNames();
    const pricesAfterSort = await productsPage.getProductPrices();
    expect(namesAfterSort).toHaveLength(productCount);
    expect([...namesAfterSort].sort()).toEqual([...namesBeforeSort].sort());
    expect(pricesAfterSort).toEqual([...pricesAfterSort].sort((left, right) => left - right));
    expect(namesAfterSort).toEqual(
      expect.arrayContaining([productTestData.boltTShirt, productTestData.redTShirt]),
    );
  });
});
