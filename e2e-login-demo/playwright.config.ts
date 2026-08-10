import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

// Load the right .env file based on TEST_ENV
const env = process.env.TEST_ENV ?? 'qa';
dotenv.config({ path: path.resolve(__dirname, `.env.${env}`) });

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['html'], ['list'], ['json', { outputFile: 'playwright-report/results.json' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://www.saucedemo.com',
    trace: 'on',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: '**/api/**',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: '**/api/**',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      // API tests don't need a browser — they use Playwright's built-in
      // `request` fixture, bound to this project's baseURL.
      name: 'api',
      testDir: './tests/api',
      use: { baseURL: process.env.API_BASE_URL ?? 'https://dummyjson.com' },
    },
  ],
});
