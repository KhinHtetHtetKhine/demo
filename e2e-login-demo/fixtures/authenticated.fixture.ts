import { base, makeAttachScreenshot } from './base.fixture';
import { Browser, Page } from '@playwright/test';
import { authenticateUser } from '../helpers/auth-setup';
import { InventoryPage } from '../src/pages/inventory.page';

type AuthenticatedFixtures = {
  authenticatedPage: Page;
  inventoryPage: InventoryPage;
  attachScreenshot: (name: string) => Promise<void>;
};

export const test = base.extend<AuthenticatedFixtures>({
  // attachScreenshot wired to authenticatedPage — resolves after it in the fixture chain
  attachScreenshot: async ({ authenticatedPage }, use, testInfo) => {
    await use(makeAttachScreenshot(authenticatedPage, testInfo));
  },

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

