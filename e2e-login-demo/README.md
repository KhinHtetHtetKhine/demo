# e2e-login-demo

A Playwright + TypeScript automation demo covering login testing, authenticated session reuse, page object model, CSV-driven tests, and multi-environment configuration.

---

## Project Structure

```
e2e-login-demo/
├── fixtures/
│   ├── base.fixture.ts           # makeAttachScreenshot — shared screenshot utility
│   ├── login.fixture.ts          # loginPage fixture, composes from base
│   └── authenticated.fixture.ts  # pre-authenticated page via saved session, composes from base
├── helpers/
│   ├── auth-setup.ts             # parallel-safe session cache (lock + storageState)
│   └── csv-reader.ts             # shared CSV parser — readRegressionCsv()
├── locators/
│   ├── login.locators.ts         # login form selectors
│   └── inventory.locators.ts     # post-login inventory selectors
├── src/pages/
│   ├── login.page.ts             # LoginPage — actions + assertions
│   └── inventory.page.ts         # InventoryPage — actions + assertions
├── testdata/
│   └── regression.csv            # unified test data — feature column discriminates suites
├── tests/
│   ├── login.spec.ts             # Login form tests (no session cache)
│   └── inventory.spec.ts         # Inventory tests (authenticated via saved state)
├── .env.example                  # Safe template — commit this
├── .env.qa                       # QA credentials — do NOT commit
├── .env.uat                      # UAT credentials — do NOT commit
├── playwright.config.ts          # Loads .env.<TEST_ENV>, sets baseURL
├── package.json
└── tsconfig.json
```

---

## Prerequisites

- Node.js 18+
- npm 9+

---

## Setup

```bash
# Install dependencies
npm ci

# Install Playwright Chromium browser
npx playwright install --with-deps chromium
```

---

## Environment Configuration

Environment config is separated from test logic. Each environment has its own `.env` file:

| File | Purpose | Committed? |
|---|---|---|
| `.env.example` | Template with placeholder values | ✅ Yes |
| `.env.qa` | QA credentials and base URL | ❌ No |
| `.env.uat` | UAT credentials and base URL | ❌ No |

To set up a new environment:

```bash
cp .env.example .env.qa
# Edit .env.qa with real values
```

Each `.env` file contains:

```env
BASE_URL=https://your-app.com
AUTH_USERNAME=your_username
AUTH_PASSWORD=your_password
```

`playwright.config.ts` reads `TEST_ENV` at startup and loads the matching file:

```ts
const env = process.env.TEST_ENV ?? 'qa';
dotenv.config({ path: `.env.${env}` });
```

---

## Running Tests

```bash
# Run all tests (defaults to QA environment)
npm test

# Run against a specific environment
npm run test:qa
npm run test:uat

# Run a specific feature suite
npm run test:login
npm run test:inventory

# Run headed (visible browser)
npm run test:headed

# Filter by test name (Playwright built-in)
npx playwright test --grep "TC_LOGIN"
npx playwright test --grep "TC_INV"

# Open HTML report after a run
npm run report
```

You can also pass `TEST_ENV` inline on any platform via `cross-env`:

```bash
npx cross-env TEST_ENV=uat npm test
```

---

## Test Data

All test cases live in a single file: `testdata/regression.csv`.

A `feature` column acts as a discriminator. Each spec reads the full CSV and filters to its own rows:

```ts
const loginCases     = readRegressionCsv().filter(r => r.feature === 'login');
const inventoryCases = readRegressionCsv().filter(r => r.feature === 'inventory');
```

**Schema:**

| Column | Used by | Description |
|---|---|---|
| `feature` | all | `login` or `inventory` — drives which spec owns the row |
| `testCaseNumber` | all | Unique ID e.g. `TC_LOGIN_001` |
| `testCase` | all | Human-readable name |
| `username` | login | Login credential |
| `password` | login | Login credential |
| `expectedResult` | login | `success` or `error` |
| `expectedMessage` | login | Expected error message text |
| `addToCart` | inventory | Pipe-separated item names e.g. `Item A\|Item B` |
| `expectedCartCount` | inventory | Expected cart badge number |
| `expectedItemCount` | inventory | Expected total products on page |

Columns irrelevant to a feature are left empty — no sparse data causes failures because each spec only reads the columns it declared.

---

## Test Suites

### `tests/login.spec.ts` — Login form tests

Tests the login form directly. Every test navigates to the login page and interacts with the form. No session cache is used — this is correct because the purpose is to verify the login form itself.

| ID | Scenario | Expected |
|---|---|---|
| TC_LOGIN_001 | Valid credentials | Success — lands on inventory |
| TC_LOGIN_002 | Wrong password | Error message |
| TC_LOGIN_003 | Locked out user | Locked error message |

### `tests/inventory.spec.ts` — Inventory tests (authenticated)

Tests post-login behaviour. Uses the `authenticatedPage` fixture which handles session caching internally — the login form is never shown in these tests.

| ID | Scenario |
|---|---|
| TC_INV_001 | Inventory page loads with 6 products |
| TC_INV_002 | Add one item — cart badge shows 1 |
| TC_INV_003 | Add two items — cart badge shows 2 |

---

## Authentication Session Caching

`helpers/auth-setup.ts` implements the same pattern used in production test suites:

**First run** — performs a real login, saves `playwright/.auth/<user>-state.json` (cookies + localStorage).

**Subsequent runs** — loads the saved state file, skips the login form entirely. The session is validated before reuse; if expired, it re-logs in automatically.

**Parallel workers** — a file-based lock (`<user>.lock`) ensures only one worker performs the login at a time. Other workers wait and then reuse the same session file. Stale locks (from crashed workers) are detected by `mtime` and removed automatically.

```
Worker 1                    Worker 2
───────                     ────────
No auth file found
Acquire lock ✓              Sees lock → wait for auth file...
Login → save state.json
Release lock
                            Auth file appeared → load state → skip login ✓
```

**Timing constants** (all in milliseconds):

| Constant | Value | Purpose |
|---|---|---|
| `AUTH_WAIT_TIMEOUT` | 30_000 | Max time a waiting worker polls for the auth file |
| `LOCK_TIMEOUT` | 10_000 | Max time to keep retrying lock acquisition before failing |
| `LOCK_STALE_THRESHOLD` | 5_000 | Lock files older than this are treated as abandoned |
| `LOCK_CHECK_INTERVAL` | 100 | Polling frequency for lock and auth file checks |
| `AUTH_FILE_SETTLE_DELAY` | 500 | Extra wait after auth file appears before reading it |

The `_` separator in numeric literals (e.g. `30_000`) is a JavaScript ES2021 feature — purely visual, identical value to `30000`. It makes millisecond values immediately readable without counting zeros.

The `playwright/.auth/` directory is in `.gitignore` — session files are never committed.

---

## Key Design Decisions

**Why two separate test files?**
`login.spec.ts` tests the login mechanism itself — it must exercise the real form every time. `inventory.spec.ts` tests what happens after login — it should not waste time on the form. Mixing them would either slow down inventory tests or compromise login test isolation.

**Why one `regression.csv` instead of separate files per feature?**
A single file with a `feature` discriminator column mirrors how production suites work at scale — one data source, each spec filters its own rows. Columns irrelevant to a feature are left empty. This keeps data in one place, easy to review and extend, without schema explosion. For very large suites with fundamentally different data shapes, per-feature files become appropriate — but at this scale one file is cleaner.

**Why a shared `base.fixture.ts`?**
`attachScreenshot` was originally duplicated in both `login.fixture.ts` and `authenticated.fixture.ts`. Extracting `makeAttachScreenshot` into `base.fixture.ts` means the implementation lives in one place. Both fixtures call it with their own page — `page` for login, `authenticatedPage` for inventory. Adding a third fixture in future requires no duplication.

**Why not a fixture per page object?**
Fixtures own lifecycle — setup that runs before every test and teardown after. Page objects are just classes. New page objects get added as fixtures inside the existing `authenticated.fixture.ts`, not as new fixture files. A new fixture file is only warranted when there is a genuinely different session context — for example, an admin user or a guest session.

**Why `attachScreenshot` instead of Playwright's built-in screenshot?**
Playwright's built-in `screenshot: 'only-on-failure'` captures one snapshot at the end of a failed test. `attachScreenshot` captures named checkpoints at specific steps — before a click, after a submit, after validation — so you can see exactly which step broke when reviewing results. Screenshots are attached via `testInfo.attach()` so they appear inline in the HTML report for every test, pass or fail, without opening a separate trace viewer.

**Why `data-test` selectors?**
`[data-test="..."]` attributes are stable test hooks that survive CSS and layout changes. They signal intent and don't break when styles are refactored.

**Why `cross-env`?**
`KEY=value command` syntax is Unix-only. `cross-env` makes the same scripts work on Windows, macOS, and Linux without changes.

---

## CI/CD

GitHub Actions workflow at `.github/workflows/demo-playwright-ci.yml` runs on every push and pull request to `e2e-login-demo/**`.

Steps:
1. Checkout
2. Setup Node.js 22 with npm cache
3. `npm ci`
4. Install Playwright Chromium
5. TypeScript check (`tsc --noEmit`)
6. Run tests
7. Upload HTML report and test results as artifacts (retained 7 days)
