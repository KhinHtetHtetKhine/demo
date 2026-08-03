import { test, expect } from '../fixtures/authenticated.fixture';
import { readRegressionCsv } from '../helpers/csv-reader';

const inventoryCases = readRegressionCsv().filter((r) => r.feature === 'inventory');

test.describe('Inventory — authenticated via saved session', () => {
  for (const data of inventoryCases) {
    test(`${data.testCaseNumber} - ${data.testCase}`, async ({ inventoryPage, attachScreenshot }) => {

      await test.step('Verify inventory page is loaded', async () => {
        await inventoryPage.expectLoaded();
        await attachScreenshot('01-inventory-loaded');
      });

      // TC_INV_001: verify total product count
      if (data.expectedItemCount) {
        await test.step(`Verify product count is ${data.expectedItemCount}`, async () => {
          const count = await inventoryPage.getItemCount();
          expect(count).toBe(Number(data.expectedItemCount));
          await attachScreenshot('02-product-count');
        });
      }

      // TC_INV_002 / TC_INV_003: add items and verify cart badge
      if (data.addToCart) {
        const items = data.addToCart.split('|');

        await test.step(`Add ${items.length} item(s) to cart`, async () => {
          for (const item of items) {
            await inventoryPage.addItemToCart(item.trim());
          }
          await attachScreenshot('03-after-add-to-cart');
        });

        await test.step(`Cart badge shows count ${data.expectedCartCount}`, async () => {
          await inventoryPage.expectCartBadge(Number(data.expectedCartCount));
          await attachScreenshot('04-cart-badge');
        });
      }
    });
  }
});
