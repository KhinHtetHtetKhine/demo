import * as fs from 'fs';
import * as path from 'path';

/** Raw row from api-regression.csv — all fields as strings. */
export type ApiRegressionRow = {
  feature: string;
  testCaseNumber: string;
  testCase: string;
  // login fields
  username: string;
  password: string;
  expectedError: string;
  // users fields
  /** Drives which DummyJsonClient method the test calls: list | get | create | update | delete */
  operation: string;
  userId: string;
  firstName: string;
  age: string;
  // shared
  expectedStatus: string;
};

//Read and parse api-regression.csv.
export function readApiRegressionCsv(): ApiRegressionRow[] {
  const csvPath = path.resolve(__dirname, '../testdata/api-regression.csv');
  const [headerLine, ...rows] = fs
    .readFileSync(csvPath, 'utf-8')
    .replace(/\r/g, '')
    .trim()
    .split('\n');

  const headers = headerLine.split(',');

  return rows
    .filter((row) => row.trim() !== '')
    .map((row) => {
      const values = row.split(',');
      const record = Object.fromEntries(
        headers.map((header, i) => [header, values[i] ?? ''])
      );
      return record as ApiRegressionRow;
    });
}
