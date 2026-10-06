import { test as base } from '@playwright/test';
import { Browser, Page } from '@playwright/test';
import { authenticateUser } from '../helpers/auth-setup';
import { InventoryPage } from '../src/pages/inventory.page';

type AuthenticatedFixtures = {
  authenticatedPage: Page;
  inventoryPage: InventoryPage;
};

export const test = base.extend<AuthenticatedFixtures>({
  authenticatedPage: async ({ browser }: { browser: Browser }, use) => {
    const page = await authenticateUser(browser, 'standard_user');
    await use(page);
    await page.context().close();
  },

  inventoryPage: async ({ authenticatedPage }, use) => {
    const inventoryPage = new InventoryPage(authenticatedPage);
    await use(inventoryPage);
  },
});

export { expect } from '@playwright/test';

