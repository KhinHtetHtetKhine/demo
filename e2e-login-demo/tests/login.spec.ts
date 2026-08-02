import { test } from '../fixtures/login.fixture';
import { readRegressionCsv } from '../helpers/csv-reader';

const loginCases = readRegressionCsv().filter((r) => r.feature === 'login');

test.describe('Login', () => {
  for (const data of loginCases) {
    test(`${data.testCaseNumber} - ${data.testCase}`, async ({ loginPage, attachScreenshot }) => {
      await test.step('Submit login details', async () => {
        await loginPage.login(data.username, data.password);
        await attachScreenshot('02-after-login-submit');
      });

      await test.step('Validate login result', async () => {
        if (data.expectedResult === 'success') {
          await loginPage.expectSuccessfulLogin();
        } else {
          await loginPage.expectLoginError(data.expectedMessage);
        }
        await attachScreenshot('03-after-result-validation');
      });
    });
  }
});
