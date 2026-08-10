/**
 * Auth API Tests — DummyJSON demo API
 *
 * Hits POST /auth/login directly (no browser) via Playwright's built-in
 * APIRequestContext, wrapped by DummyJsonClient (src/api/dummyjson.client.ts).
 * Mirrors tests/login.spec.ts at the API layer — same idea (valid /
 * missing-field / wrong-password cases), CSV-driven test data.
 *
 * Test data sourced from testdata/api-login.csv.
 * Runs under the 'api' Playwright project (see playwright.config.ts).
 */
import { test, expect } from '../../fixtures/api.fixture';
import { readApiLoginCsv } from '../../helpers/api-csv-reader';

const loginCases = readApiLoginCsv();

test.describe('Auth API — POST /auth/login', () => {
  for (const data of loginCases) {
    test(`${data.testCaseNumber} - ${data.testCase}`, async ({ dummyJsonApi }) => {
      const response = await test.step('Send login request', () => {
        return dummyJsonApi.login({
          username: data.username,
          password: data.password || undefined,
        });
      });

      await test.step(`Expect status ${data.expectedStatus}`, async () => {
        expect(response.status()).toBe(Number(data.expectedStatus));
      });

      await test.step('Validate response body', async () => {
        const body = await response.json();
        if (data.expectedStatus === '200') {
          expect(body.accessToken).toBeTruthy();
        } else {
          expect(body.message).toContain(data.expectedError);
        }
      });
    });
  }
});
