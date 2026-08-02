import * as fs from 'fs';
import * as path from 'path';

/** Raw row from regression.csv — all fields as strings. */
export type RegressionRow = {
  feature: string;
  testCaseNumber: string;
  testCase: string;
  // login fields
  username: string;
  password: string;
  expectedResult: string;
  expectedMessage: string;
  // inventory fields
  addToCart: string;          // pipe-separated item names e.g. "Sauce Labs Backpack|Sauce Labs Bike Light"
  expectedCartCount: string;
  expectedItemCount: string;
};

/**
 * Read and parse regression.csv.
 * - Normalises CRLF → LF (Windows safety)
 * - Returns all rows; callers filter by `feature`
 */
export function readRegressionCsv(): RegressionRow[] {
  const csvPath = path.resolve(__dirname, '../testdata/regression.csv');
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
      return record as RegressionRow;
    });
}
