import { test as base, expect } from '@playwright/test';
import { DummyJsonClient } from '../src/api/dummyjson.client';

type ApiFixtures = {
  dummyJsonApi: DummyJsonClient;
};

export const test = base.extend<ApiFixtures>({
  dummyJsonApi: async ({ request }, use) => {
    await use(new DummyJsonClient(request));
  },
});

export { expect };
