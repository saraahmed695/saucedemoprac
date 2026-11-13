import { expect, Locator, Page } from '@playwright/test';

export class BurgerMenuPage {
  readonly menuButton: Locator;
  readonly closeMenuButton: Locator;
  readonly topLevelMenuItems: Locator;
  readonly allItemsLink: Locator;
  readonly dynamicCatalogLink: Locator;
  readonly dynamicCatalogLazyLoadLink: Locator;
  readonly dynamicCatalogSpinnerLink: Locator;
  readonly dynamicCatalogSliderLink: Locator;
  readonly aboutLink: Locator;
  readonly logoutLink: Locator;
  readonly resetAppStateLink: Locator;
  readonly menuPanel: Locator;

  constructor(page: Page) {
    this.menuButton = page.locator('#react-burger-menu-btn');
    this.closeMenuButton = page.locator('#react-burger-cross-btn');
    this.topLevelMenuItems = page.locator('.bm-item-list > a');
    this.allItemsLink = page.locator('[data-test="inventory-sidebar-link"]');
    this.dynamicCatalogLink = page.locator('[data-test="dynamic-catalog-sidebar-link"]');
    this.dynamicCatalogLazyLoadLink = page.locator('[data-test="dynamic-catalog-lazy-load-link"]');
    this.dynamicCatalogSpinnerLink = page.locator('[data-test="dynamic-catalog-spinner-link"]');
    this.dynamicCatalogSliderLink = page.locator('[data-test="dynamic-catalog-slider-link"]');
    this.aboutLink = page.locator('[data-test="about-sidebar-link"]');
    this.logoutLink = page.locator('[data-test="logout-sidebar-link"]');
    this.resetAppStateLink = page.locator('[data-test="reset-sidebar-link"]');
    this.menuPanel = page.locator('.bm-menu-wrap');
  }

  async open(): Promise<void> {
    if ((await this.menuPanel.getAttribute('aria-hidden')) !== 'false') {
      await this.menuButton.click();
    }
    await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'false');
    await this.waitForMenuTransition();
    await expect(this.closeMenuButton).toBeVisible();
  }

  async close(): Promise<void> {
    if ((await this.menuPanel.getAttribute('aria-hidden')) !== 'true') {
      await this.closeMenuButton.click();
    }
    await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'true');
    await this.waitForMenuTransition();
  }

  async goToAllItems(): Promise<void> {
    await this.allItemsLink.click();
    await this.waitForMenuClosed();
  }

  async toggleDynamicCatalog(): Promise<void> {
    await this.dynamicCatalogLink.click();
  }

  async goToLazyLoad(): Promise<void> {
    await this.dynamicCatalogLazyLoadLink.click();
    await this.waitForMenuClosed();
  }

  async goToSpinner(): Promise<void> {
    await this.dynamicCatalogSpinnerLink.click();
    await this.waitForMenuClosed();
  }

  async goToSlider(): Promise<void> {
    await this.dynamicCatalogSliderLink.click();
    await this.waitForMenuClosed();
  }

  async openAbout(): Promise<void> {
    await this.aboutLink.click();
  }

  async logout(): Promise<void> {
    await this.logoutLink.click();
  }

  async resetAppState(): Promise<void> {
    await this.resetAppStateLink.click();
  }

  private async waitForMenuClosed(): Promise<void> {
    await expect(this.menuPanel).toHaveAttribute('aria-hidden', 'true');
    await this.waitForMenuTransition();
  }

  private async waitForMenuTransition(): Promise<void> {
    await this.menuPanel.evaluate(async (menu) => {
      const nextFrame = (): Promise<void> =>
        new Promise((resolve) => requestAnimationFrame(() => resolve()));
      let previousTransform = getComputedStyle(menu).transform;
      let stableFrames = 0;

      while (stableFrames < 2) {
        await nextFrame();
        const transform = getComputedStyle(menu).transform;
        stableFrames = transform === previousTransform ? stableFrames + 1 : 0;
        previousTransform = transform;
      }
    });
  }
}
