import { test, expect } from '../../fixtures/api.fixture';
import { readApiRegressionCsv } from '../../helpers/api-csv-reader';

const loginCases = readApiRegressionCsv().filter((r) => r.feature === 'login');

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
