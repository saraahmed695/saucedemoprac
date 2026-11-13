import { expect, Locator, Page } from '@playwright/test';

export type ProductSortOption = 'az' | 'za' | 'lohi' | 'hilo';

export type ProductDetails = {
  name: string;
  description: string;
  price: string;
  imageSrc: string;
};

export class ProductsPage {
  readonly title: Locator;
  readonly productCards: Locator;
  readonly sortDropdown: Locator;
  readonly productNames: Locator;
  readonly productDescriptions: Locator;
  readonly productPrices: Locator;
  readonly productImages: Locator;
  readonly addToCartButtons: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;
  readonly detailName: Locator;
  readonly detailDescription: Locator;
  readonly detailPrice: Locator;
  readonly detailImage: Locator;
  readonly detailAddToCartButton: Locator;
  readonly backToProductsButton: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('.title');
    this.productCards = page.locator('.inventory_item');
    this.sortDropdown = page.locator('[data-test="product-sort-container"]');
    this.productNames = page.locator('.inventory_item_name');
    this.productDescriptions = page.locator('.inventory_item_desc');
    this.productPrices = page.locator('.inventory_item_price');
    this.productImages = page.locator('.inventory_item_img img');
    this.addToCartButtons = this.productCards.locator('button[data-test^="add-to-cart"]');
    this.cartLink = page.locator('.shopping_cart_link');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.detailName = page.locator('.inventory_details_name');
    this.detailDescription = page.locator('.inventory_details_desc');
    this.detailPrice = page.locator('.inventory_details_price');
    this.detailImage = page.locator('.inventory_details_img');
    this.detailAddToCartButton = page.locator('.inventory_details button[data-test^="add-to-cart"]');
    this.backToProductsButton = page.locator('[data-test="back-to-products"]');
  }

  async expectInventoryVisible(): Promise<void> {
    await expect(this.title).toHaveText('Products');
    await expect(this.productCards.first()).toBeVisible();
  }

  async getProductNames(): Promise<string[]> {
    return (await this.productNames.allTextContents()).map((name) => name.trim());
  }

  async getProductPrices(): Promise<number[]> {
    const prices = await this.productPrices.allTextContents();
    return prices.map((price) => {
      const parsedPrice = Number(price.replace('$', '').trim());
      if (!Number.isFinite(parsedPrice)) {
        throw new Error(`Invalid product price displayed: "${price}"`);
      }
      return parsedPrice;
    });
  }

  async selectSort(option: ProductSortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  async getProductPrice(name: string): Promise<string> {
    return (await this.productCard(name).locator('.inventory_item_price').innerText()).trim();
  }

  async addProductToCart(name: string): Promise<void> {
    await this.productCard(name).getByRole('button', { name: 'Add to cart' }).click();
  }

  async removeProductFromCart(name: string): Promise<void> {
    await this.productCard(name).getByRole('button', { name: 'Remove' }).click();
  }

  async openCart(): Promise<void> {
    await this.cartLink.click();
  }

  async openFirstProduct(): Promise<ProductDetails> {
    const name = (await this.productNames.first().innerText()).trim();
    return this.openProduct(name);
  }

  async openProduct(name: string): Promise<ProductDetails> {
    const productCard = this.productCard(name);
    const image = productCard.locator('.inventory_item_img img');
    const imageSrc = await image.getAttribute('src');
    if (!imageSrc) {
      throw new Error(`Product image source is missing for "${name}".`);
    }

    const details = {
      name: (await productCard.locator('.inventory_item_name').innerText()).trim(),
      description: (await productCard.locator('.inventory_item_desc').innerText()).trim(),
      price: (await productCard.locator('.inventory_item_price').innerText()).trim(),
      imageSrc,
    };

    await productCard.locator('.inventory_item_name').click();
    return details;
  }

  async addDetailProductToCart(): Promise<void> {
    await this.detailAddToCartButton.click();
  }

  async returnToInventory(): Promise<void> {
    await this.backToProductsButton.click();
  }

  productCard(name: string): Locator {
    return this.productCards.filter({
      has: this.page.getByText(name, { exact: true }),
    });
  }
}
