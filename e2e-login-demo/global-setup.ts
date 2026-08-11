import { clearAllAuth } from './helpers/auth-setup';

// CI runners can be reused between jobs (self-hosted) or restored from a
// cache that outlives the checkout — either way, a leftover
// playwright/.auth/*-state.json from a prior run could get reused against
// a different environment/BASE_URL. Wipe it before every CI run so each
// run always performs a fresh login. Local dev keeps the cache across runs
// (that's the point of auth-setup.ts), so this only fires when CI=true.
export default async function globalSetup(): Promise<void> {
  if (process.env.CI) {
    await clearAllAuth();
  }
}
