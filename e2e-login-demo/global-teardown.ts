import { clearAllAuth } from './helpers/auth-setup';

async function globalTeardown() {
  await clearAllAuth();
}

export default globalTeardown;
