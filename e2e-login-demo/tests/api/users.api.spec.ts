import { APIResponse } from '@playwright/test';
import { test, expect } from '../../fixtures/api.fixture';
import { readApiRegressionCsv } from '../../helpers/api-csv-reader';

const userCases = readApiRegressionCsv().filter((r) => r.feature === 'users');

test.describe('Users API — /users', () => {
  for (const data of userCases) {
    test(`${data.testCaseNumber} - ${data.testCase}`, async ({ dummyJsonApi }) => {
      let response: APIResponse;

      await test.step(`Perform '${data.operation}' request`, async () => {
        switch (data.operation) {
          case 'list':
            response = await dummyJsonApi.listUsers();
            break;
          case 'get':
            response = await dummyJsonApi.getUser(data.userId);
            break;
          case 'create':
            response = await dummyJsonApi.createUser({ firstName: data.firstName, age: Number(data.age) });
            break;
          case 'update':
            response = await dummyJsonApi.updateUser(data.userId, { firstName: data.firstName });
            break;
          case 'delete':
            response = await dummyJsonApi.deleteUser(data.userId);
            break;
          default:
            throw new Error(`Unknown operation in api-users.csv: ${data.operation}`);
        }
      });

      await test.step(`Expect status ${data.expectedStatus}`, async () => {
        expect(response.status()).toBe(Number(data.expectedStatus));
      });

      await test.step('Validate response body', async () => {
        if (data.operation === 'list') {
          const body = await response.json();
          expect(Array.isArray(body.users)).toBe(true);
          expect(body.users.length).toBeGreaterThan(0);
        }

        if (data.operation === 'get' && data.expectedStatus === '200') {
          const body = await response.json();
          expect(body.id).toBe(Number(data.userId));
        }

        if (data.operation === 'create') {
          const body = await response.json();
          expect(body.firstName).toBe(data.firstName);
          expect(body.age).toBe(Number(data.age));
          expect(body.id).toBeTruthy();
        }

        if (data.operation === 'update') {
          const body = await response.json();
          expect(body.firstName).toBe(data.firstName);
        }

        if (data.operation === 'delete') {
          const body = await response.json();
          expect(body.isDeleted).toBe(true);
        }
      });
    });
  }
});
