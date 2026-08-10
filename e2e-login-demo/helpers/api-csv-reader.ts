import * as fs from 'fs';
import * as path from 'path';

/** Raw row from api-login.csv — all fields as strings. */
export type ApiLoginRow = {
  testCaseNumber: string;
  testCase: string;
  username: string;
  password: string;
  expectedStatus: string;
  expectedError: string;
};

/** Raw row from api-users.csv — all fields as strings. */
export type ApiUserRow = {
  testCaseNumber: string;
  testCase: string;
  /** Drives which DummyJsonClient method the test calls: list | get | create | update | delete */
  operation: string;
  userId: string;
  firstName: string;
  age: string;
  expectedStatus: string;
};

/**
 * Generic CSV parser shared by both API test-data readers.
 * - Normalises CRLF → LF (Windows safety)
 * - Returns typed rows based on the header row
 */
function parseCsv<T>(fileName: string): T[] {
  const csvPath = path.resolve(__dirname, `../testdata/${fileName}`);
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
      return record as T;
    });
}

export function readApiLoginCsv(): ApiLoginRow[] {
  return parseCsv<ApiLoginRow>('api-login.csv');
}

export function readApiUsersCsv(): ApiUserRow[] {
  return parseCsv<ApiUserRow>('api-users.csv');
}
