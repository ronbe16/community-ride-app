import { test, expect } from '@playwright/test';
import { signupAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

test.describe('GROUP 1 — Auth: Signup (Email/Password)', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-1.1 — Successful Signup User A', async ({ page }) => {
    const email = `testdriver+${Date.now()}@communityride.test`;
    await signupAs(
      page,
      'Test Driver',
      email,
      'Test123!',
      '9171234567'
    );
    
    await expect(page).toHaveURL('/');
    await page.screenshot({ path: 'screenshots/TC-1.1-successful-signup-user-a.png' });
  });

  test('TC-1.3 — Signup User B', async ({ page }) => {
    const email = `testpassenger+${Date.now()}@communityride.test`;
    await signupAs(
      page,
      'Test Passenger',
      email,
      'Test123!',
      '9189876543'
    );
    
    await expect(page).toHaveURL('/');
  });

  test('TC-1.4 — Signup User C', async ({ page }) => {
    const email = `testthird+${Date.now()}@communityride.test`;
    await signupAs(
      page,
      'Test Third',
      email,
      'Test123!',
      '9181112222'
    );
    
    await expect(page).toHaveURL('/');
  });

  test('TC-1.5 — Duplicate Email Rejected', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.getByPlaceholder(/juan.*cruz/i).fill('Test Duplicate');
    await page.getByPlaceholder(/you@email/i).fill('testdriver@communityride.test');
    await page.getByPlaceholder(/••••••••/).fill('Test123!');
    await page.getByPlaceholder(/917\d{7}/).fill('9171111111');
    await page.click('label[for="consent"]');
    await page.click('button[type="submit"], button:has-text("Join Now")');
    
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveURL(/\/signup/);
    
    const errorVisible = await page.getByText(/already.*use|already.*exist/i).isVisible().catch(() => false);
    expect(errorVisible).toBeTruthy();
  });

  test('TC-1.6 — Consent Checkbox Required', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.getByPlaceholder(/juan.*cruz/i).fill('Test User');
    await page.getByPlaceholder(/you@email/i).fill('testuser@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Test123!');
    await page.getByPlaceholder(/917\d{7}/).fill('9171234567');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Join Now")').first();
    const isDisabled = await submitButton.isDisabled();
    
    if (!isDisabled) {
      await submitButton.click();
      await page.waitForTimeout(1000);
      await expect(page).toHaveURL(/\/signup/);
    }
  });

  test('TC-1.7 — Short Password Rejected', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.getByPlaceholder(/juan.*cruz/i).fill('Test User');
    await page.getByPlaceholder(/you@email/i).fill('testuser@example.com');
    await page.getByPlaceholder(/••••••••/).fill('abc');
    await page.getByPlaceholder(/917\d{7}/).fill('9171234567');
    await page.click('label[for="consent"]');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Join Now")').first();
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('TC-1.8 — Invalid Email Format Rejected', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.getByPlaceholder(/juan.*cruz/i).fill('Test User');
    await page.getByPlaceholder(/you@email/i).fill('notanemail');
    await page.getByPlaceholder(/••••••••/).fill('Test123!');
    await page.getByPlaceholder(/917\d{7}/).fill('9171234567');
    await page.click('label[for="consent"]');
    
    const emailInput = page.getByPlaceholder(/you@email/i);
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
    expect(isInvalid).toBeTruthy();
  });

  test('TC-1.9 — Empty Full Name Rejected', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.getByPlaceholder(/you@email/i).fill('testuser@example.com');
    await page.getByPlaceholder(/••••••••/).fill('Test123!');
    await page.getByPlaceholder(/917\d{7}/).fill('9171234567');
    await page.click('label[for="consent"]');
    
    const submitButton = page.locator('button[type="submit"], button:has-text("Join Now")').first();
    const isDisabled = await submitButton.isDisabled();
    expect(isDisabled).toBeTruthy();
  });

  test('TC-1.10 — Signup Page Has Google Button', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const googleButton = page.getByText(/continue with google/i);
    await expect(googleButton).toBeVisible();
    
    const divider = page.getByText(/or continue with email/i);
    await expect(divider).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/TC-1.10-google-button-on-signup.png' });
  });
});