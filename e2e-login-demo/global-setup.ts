import { clearAllAuth } from './helpers/auth-setup';

export default async function globalSetup(): Promise<void> {
  if (process.env.CI) {
    await clearAllAuth();
  }
}
