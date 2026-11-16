import { productTestData } from './productTestData';

export type CartProductTestCase = {
  name: string;
  expectedPrice: string;
};

export const cartProductTestCases: CartProductTestCase[] = productTestData.catalog.map(
  ({ name, price }) => ({
    name,
    expectedPrice: price,
  }),
);
