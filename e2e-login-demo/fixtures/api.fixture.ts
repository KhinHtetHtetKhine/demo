import { test as base, expect } from '@playwright/test';
import { DummyJsonClient } from '../src/api/dummyjson.client';

type ApiFixtures = {
  dummyJsonApi: DummyJsonClient;
};

/**
 * API test fixture — extends Playwright's base test with a `dummyJsonApi`
 * client bound to the built-in `request` fixture. `request` already
 * resolves against the 'api' project's `baseURL` (see playwright.config.ts),
 * so no manual APIRequestContext setup is needed here.
 */
export const test = base.extend<ApiFixtures>({
  dummyJsonApi: async ({ request }, use) => {
    await use(new DummyJsonClient(request));
  },
});

export { expect };
