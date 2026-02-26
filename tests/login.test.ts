/**
 * Run this once to log in manually:
 *   pnpm exec playwright test tests/login.test.ts
 *
 * It opens Chrome Canary with the persistent profile to my.uscis.gov.
 * Log in manually, then the test auto-detects when you reach the account page.
 * The session persists in .chrome-profile for future tests.
 */
import { test, expect } from './fixture';

test('manual login - log in to my.uscis.gov', async ({ pg }) => {
  test.setTimeout(300_000);
  await pg.goto('https://my.uscis.gov/account');
  // Wait up to 5 minutes for manual login - the URL ends up at /account/applicant
  await pg.waitForURL(/account\/applicant/, { timeout: 300_000 });
  console.log('Login successful! URL:', pg.url());
  await pg.screenshot({ path: 'tests/screenshots/login-success.png' });
  await expect(pg).toHaveURL(/account\/applicant/);
});
