import { test as base } from '@playwright/test';
import { LoginPage } from '../src/pages/login.page';

type LoginFixtures = {
  attachScreenshot: (name: string) => Promise<void>;
  loginPage: LoginPage;
};

export const test = base.extend<LoginFixtures>({
  attachScreenshot: async ({ page }, use, testInfo) => {
    await use(async (name: string) => {
      await testInfo.attach(name, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  },

  loginPage: async ({ page, attachScreenshot }, use) => {
    const loginPage = new LoginPage(page);

    await page.goto('/');
    await attachScreenshot('01-login-page-loaded');
    await use(loginPage);
  },
});

export { expect } from '@playwright/test';
