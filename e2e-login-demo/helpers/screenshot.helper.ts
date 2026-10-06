import { Page, TestInfo } from '@playwright/test';

export function makeAttachScreenshot(page: Page, testInfo: TestInfo) {
  return async (name: string): Promise<void> => {
    await testInfo.attach(name, {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    });
  };
}