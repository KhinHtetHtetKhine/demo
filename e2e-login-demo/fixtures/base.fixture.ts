import { Page, TestInfo } from '@playwright/test';

export type BaseFixtures = {
  attachScreenshot: (name: string) => Promise<void>;
};


export function makeAttachScreenshot(page: Page, testInfo: TestInfo) {
  return async (name: string): Promise<void> => {
    await testInfo.attach(name, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  };
}

// Re-export base test for fixtures to extend from
export { test as base, expect } from '@playwright/test';
