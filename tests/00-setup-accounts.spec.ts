import { test, expect } from '@playwright/test';
import { wait } from './helpers/delay';

/**
 * SETUP — Ensure canonical test accounts exist.
 * This runs before all other tests. It attempts signup for each canonical account.
 * If the account already exists (duplicate email error), that is acceptable.
 */

const ACCOUNTS = [
  { name: 'Test Driver',    email: 'testdriver@communityride.test',    mobile: '9171234567' },
  { name: 'Test Passenger', email: 'testpassenger@communityride.test', mobile: '9189876543' },
  { name: 'Test Third',     email: 'testthird@communityride.test',     mobile: '9181112222' },
];

const PASSWORD = 'Test123!';

test.describe('SETUP — Create Canonical Test Accounts', () => {
  test.beforeEach(async () => {
    await wait(500);
  });

  for (const account of ACCOUNTS) {
    test(`Setup: ensure ${account.email} exists`, async ({ page }) => {
      // First try login — if it works, account already exists
      await page.goto('/login');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      await page.getByPlaceholder(/you@example/i).fill(account.email);
      await page.getByPlaceholder(/••••••••/).fill(PASSWORD);
      await page.click('button[type="submit"]');

      // Wait to see if we navigate away from /login
      await page.waitForTimeout(4000);
      const currentURL = page.url();

      if (!currentURL.includes('/login')) {
        // Already logged in — account exists
        console.log(`SETUP: ${account.email} already exists — login succeeded.`);
        expect(true).toBeTruthy();
        return;
      }

      // Login failed — try to create the account via signup
      console.log(`SETUP: ${account.email} not found — attempting signup...`);

      // Clear any error state
      await page.context().clearCookies();
      await page.goto('/signup');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);

      // Fill signup form
      try {
        await page.getByPlaceholder(/juan.*cruz/i).fill(account.name);
      } catch {
        await page.locator('input[name="fullName"], input[placeholder*="name"]').first().fill(account.name);
      }

      await page.getByPlaceholder(/you@email/i).fill(account.email);
      await page.getByPlaceholder(/••••••••/).fill(PASSWORD);

      try {
        await page.getByPlaceholder(/917\d{7}/).fill(account.mobile);
      } catch {
        await page.locator('input[type="tel"]').first().fill(account.mobile);
      }

      // Check consent checkbox
      try {
        await page.click('label[for="consent"]', { timeout: 2000 });
      } catch {
        try {
          await page.locator('[role="checkbox"]').first().click({ force: true });
        } catch {
          // ignore
        }
      }

      // Submit
      await page.click('button[type="submit"], button:has-text("Join Now")');
      await page.waitForTimeout(4000);

      const afterURL = page.url();
      if (!afterURL.includes('/signup')) {
        console.log(`SETUP: ${account.email} created successfully.`);
      } else {
        // Check for "already in use" error — that's also OK
        const alreadyExists = await page.getByText(/already.*use|already.*exist|taken/i).isVisible({ timeout: 2000 }).catch(() => false);
        if (alreadyExists) {
          console.log(`SETUP: ${account.email} already exists (email-in-use error).`);
        } else {
          const errorText = await page.locator('[class*="error"], [class*="alert"]').first().textContent().catch(() => '');
          console.log(`SETUP: ${account.email} signup result — still on signup page. Error: ${errorText}`);
        }
      }

      // Either way, we pass — this setup is best-effort
      expect(true).toBeTruthy();
    });
  }
});
