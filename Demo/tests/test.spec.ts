import * as fs from 'fs';
import * as path from 'path';
import { test } from '../fixtures/login.fixture';

type LoginTestData = {
  testCaseNumber: string;
  testCase: string;
  username: string;
  password: string;
  expectedResult: 'success' | 'error';
  expectedMessage: string;
};

function readLoginData(): LoginTestData[] {
  const csvPath = path.resolve(__dirname, '../testdata/login.csv');
  const [headerLine, ...rows] = fs.readFileSync(csvPath, 'utf-8').trim().split('\n');
  const headers = headerLine.split(',');

  return rows.map((row) => {
    const values = row.split(',');
    const record = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));

    return {
      testCaseNumber: record.testCaseNumber,
      testCase: record.testCase,
      username: record.username,
      password: record.password,
      expectedResult: record.expectedResult as LoginTestData['expectedResult'],
      expectedMessage: record.expectedMessage,
    };
  });
}

test.describe('Login', () => {
  for (const data of readLoginData()) {
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
