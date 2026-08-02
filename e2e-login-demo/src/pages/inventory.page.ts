import { expect, Locator, Page } from '@playwright/test';
import { inventoryLocators } from '../../locators/inventory.locators';

export class InventoryPage {
  readonly page: Page;
  readonly inventoryContainer: Locator;
  readonly inventoryItems: Locator;
  readonly cartBadge: Locator;
  readonly cartLink: Locator;
  readonly menuButton: Locator;
  readonly logoutLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.inventoryContainer = page.locator(inventoryLocators.inventoryContainer);
    this.inventoryItems     = page.locator(inventoryLocators.inventoryItem);
    this.cartBadge          = page.locator(inventoryLocators.cartBadge);
    this.cartLink           = page.locator(inventoryLocators.cartLink);
    this.menuButton         = page.locator(inventoryLocators.menuButton);
    this.logoutLink         = page.locator(inventoryLocators.logoutLink);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/.*inventory\.html/, { timeout: 10_000 });
    await expect(this.inventoryContainer).toBeVisible({ timeout: 10_000 });
  }

  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  async addItemToCart(itemName: string): Promise<void> {
    // Locate the specific item card and click its Add to cart button
    const item = this.page
      .locator(inventoryLocators.inventoryItem)
      .filter({ has: this.page.locator(inventoryLocators.itemName, { hasText: itemName }) });

    await item.locator(inventoryLocators.addToCartButton).click();
  }

  async expectCartBadge(count: number): Promise<void> {
    await expect(this.cartBadge).toHaveText(String(count), { timeout: 5_000 });
  }

  async logout(): Promise<void> {
    await this.menuButton.click();
    await this.logoutLink.click();
    await expect(this.page).toHaveURL('https://www.saucedemo.com/', { timeout: 10_000 });
  }
}
