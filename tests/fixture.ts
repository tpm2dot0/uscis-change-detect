import { test as base, chromium, type BrowserContext, type Page } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const PROJECT_ROOT = path.resolve(process.cwd());
const CHROME_CANARY = '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary';
const PROFILE_DIR = path.join(PROJECT_ROOT, '.chrome-profile');
const PROFILE_STORE = path.join(PROJECT_ROOT, '.chrome-profile-persist');

/**
 * Playwright's launchPersistentContext deletes the userDataDir on context.close().
 * We work around this by keeping a backup copy in .chrome-profile-persist and
 * restoring it before each launch.
 */
function restoreProfile() {
  if (!fs.existsSync(PROFILE_DIR) && fs.existsSync(PROFILE_STORE)) {
    fs.renameSync(PROFILE_STORE, PROFILE_DIR);
  }
  if (!fs.existsSync(PROFILE_DIR)) {
    fs.mkdirSync(PROFILE_DIR, { recursive: true });
  }
}

function backupProfile() {
  if (fs.existsSync(PROFILE_DIR)) {
    if (fs.existsSync(PROFILE_STORE)) {
      fs.rmSync(PROFILE_STORE, { recursive: true, force: true });
    }
    fs.cpSync(PROFILE_DIR, PROFILE_STORE, { recursive: true });
  }
}

type Fixtures = {
  ctx: BrowserContext;
  pg: Page;
};

export const test = base.extend<Fixtures>({
  ctx: async ({}, use) => {
    restoreProfile();
    const context = await chromium.launchPersistentContext(PROFILE_DIR, {
      executablePath: CHROME_CANARY,
      headless: false,
      args: [
        '--no-first-run',
        '--disable-blink-features=AutomationControlled',
      ],
      viewport: { width: 1280, height: 800 },
    });
    await use(context);
    backupProfile();
    await context.close();
  },
  pg: async ({ ctx }, use) => {
    const page = ctx.pages()[0] ?? await ctx.newPage();
    await use(page);
  },
});

export { expect } from '@playwright/test';
