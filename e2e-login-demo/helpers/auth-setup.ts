import { Browser, Page } from '@playwright/test';
import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import * as path from 'path';

const AUTH_DIR = 'playwright/.auth';
const AUTH_WAIT_TIMEOUT = 30_000;
const LOCK_TIMEOUT = 10_000;
const LOCK_STALE_THRESHOLD = 5_000;
const LOCK_CHECK_INTERVAL = 100;
const AUTH_FILE_SETTLE_DELAY = 500;

const BASE_URL = process.env.BASE_URL ?? 'https://www.saucedemo.com';

const CREDENTIALS: Record<string, { username: string; password: string }> = {
  standard_user: {
    username: process.env.AUTH_USERNAME ?? 'standard_user',
    password: process.env.AUTH_PASSWORD ?? 'secret_sauce',
  },
};

// Public helpers
//Wipe all saved auth files — call in global teardown if needed.
export async function clearAllAuth(): Promise<void> {
  if (fsSync.existsSync(AUTH_DIR)) {
    const files = await fs.readdir(AUTH_DIR);
    await Promise.all(files.map((f) => fs.unlink(path.join(AUTH_DIR, f))));
    console.log('[auth-setup] Cleared all authentication files');
  }
}

export async function authenticateUser(browser: Browser, user: string = 'standard_user'): Promise<Page> {
  if (!browser) throw new Error('Browser instance is required');
  if (!CREDENTIALS[user]) throw new Error(`No credentials configured for user: ${user}`);

  const auth_dir = path.resolve(process.cwd(), AUTH_DIR);
  const auth_file = path.join(auth_dir, `${user}-state.json`);
  const lock_file = path.join(auth_dir, `${user}.lock`);

  // Ensure the auth directory exists
  if (!fsSync.existsSync(auth_dir)) {
    await fs.mkdir(auth_dir, { recursive: true });
  }

  // try to reuse an existing saved state
  if (fsSync.existsSync(auth_file)) {
    const content = await fs.readFile(auth_file, 'utf-8');

    if (!content || content.trim() === '') {
      await _safeUnlink(auth_file);
    } else {
      console.log(`[Worker ${process.pid}] Validating existing auth for "${user}"`);
      const page = await _loadAuthPage(browser, auth_file);

      if (await _isSessionValid(page)) {
        console.log(`[Worker ${process.pid}] Session valid — reusing saved state`);
        return page;
      }

      console.log(`[Worker ${process.pid}] Session expired — re-logging in`);
      await page.context().close();
      await _safeUnlink(auth_file);
    }
  }

  if (fsSync.existsSync(lock_file)) {
    console.log(`[Worker ${process.pid}] Lock detected — waiting for "${user}" auth to complete`);
    const appeared = await _waitForAuthFile(auth_file);
    if (appeared) {
      return authenticateUser(browser, user); // recurse to pick up the new file
    }
    await _handleStaleLock(lock_file, user);
  }

  //acquire lock and perform fresh login 
  await _handleStaleLock(lock_file, user);
  console.log(`[Worker ${process.pid}] Acquiring lock for "${user}"`);

  const acquired = await _acquireLock(lock_file);
  if (!acquired) {
    if (_isLockStale(lock_file)) {
      await _handleStaleLock(lock_file, user);
      return authenticateUser(browser, user);
    }
    throw new Error(`[auth-setup] Failed to acquire lock for "${user}" after ${LOCK_TIMEOUT}ms`);
  }

  try {
    if (fsSync.existsSync(auth_file)) {
      await _releaseLock(lock_file);
      return authenticateUser(browser, user);
    }

    console.log(`[Worker ${process.pid}] Logging in as "${user}"`);
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // Perform login
      await page.goto(BASE_URL);
      await page.locator('[data-test="username"]').fill(CREDENTIALS[user].username);
      await page.locator('[data-test="password"]').fill(CREDENTIALS[user].password);
      await page.locator('[data-test="login-button"]').click();
      await page.waitForURL(/.*inventory\.html/, { timeout: 10_000 });

      await context.storageState({ path: auth_file });
      console.log(`[Worker ${process.pid}] Auth state saved → ${auth_file}`);
    } finally {
      await context.close();
    }

    return _loadAuthPage(browser, auth_file);
  } finally {
    await _releaseLock(lock_file);
  }
}

// Private helpers
async function _loadAuthPage(browser: Browser, auth_file: string): Promise<Page> {
  const context = await browser.newContext({ storageState: auth_file });
  const page = await context.newPage();
  await page.goto(`${BASE_URL}/inventory.html`);
  return page;
}


async function _isSessionValid(page: Page): Promise<boolean> {
  await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => {});
  return page.url().includes('/inventory.html');
}

async function _waitForAuthFile(auth_file: string): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < AUTH_WAIT_TIMEOUT) {
    if (fsSync.existsSync(auth_file)) {
      await new Promise((r) => setTimeout(r, AUTH_FILE_SETTLE_DELAY));
      return true;
    }
    await new Promise((r) => setTimeout(r, LOCK_CHECK_INTERVAL));
  }
  return false;
}

async function _acquireLock(lock_file: string): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < LOCK_TIMEOUT) {
    try {
      // wx  fails if file already exists
      await fs.writeFile(lock_file, process.pid.toString(), { flag: 'wx' });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, LOCK_CHECK_INTERVAL));
    }
  }
  return false;
}

//Delete the lock file, ignoring errors
async function _releaseLock(lock_file: string): Promise<void> {
  try {
    if (fsSync.existsSync(lock_file)) await fs.unlink(lock_file);
  } catch {
    // ignore
  }
}

/** Delete a file, ignoring ENOENT — safe when multiple workers race to delete. */
async function _safeUnlink(file: string): Promise<void> {
  try {
    await fs.unlink(file);
  } catch (err: any) {
    if (err?.code !== 'ENOENT') throw err;
  }
}

// True if the lock file exists but is older than LOCK_STALE_THRESHOLD.
function _isLockStale(lock_file: string): boolean {
  if (!fsSync.existsSync(lock_file)) return false;
  return Date.now() - fsSync.statSync(lock_file).mtimeMs > LOCK_STALE_THRESHOLD;
}

// Remove the lock if it is stale.
async function _handleStaleLock(lock_file: string, user: string): Promise<void> {
  if (_isLockStale(lock_file)) {
    console.log(`[Worker ${process.pid}] Removing stale lock for "${user}"`);
    await _releaseLock(lock_file);
  }
}
