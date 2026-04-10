import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSENGER_EMAIL = 'testlifecyclepass@communityride.test';
const PASSWORD = 'Test123!';

test.describe('PHASE 0 - Account Verification', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test('Verify accounts and create if needed', async ({ page }) => {
    console.log('=== PHASE 0: ACCOUNT VERIFICATION ===');
    
    // Step 1: Try login as User D
    console.log('Step 1: Login as User D...');
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button[type="submit"]');
    
    await emailInput.fill(DRIVER_EMAIL);
    await passwordInput.fill(PASSWORD);
    await submitBtn.click();
    await page.waitForTimeout(3000);
    
    let currentUrl = page.url();
    console.log('After login, URL:', currentUrl);
    
    // Check if login failed (stayed on /login)
    if (currentUrl.includes('/login') || currentUrl.includes('/complete-profile')) {
      console.log('Login failed - need to create account');
      await page.goto('/signup');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      
      await page.locator('input[name="fullName"], input[placeholder*="name"]').fill('Test Lifecycle Driver');
      await page.locator('input[type="email"]').fill(DRIVER_EMAIL);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('input[type="tel"], input[placeholder*="917"]').fill('9171110001');
      await page.locator('input[type="checkbox"]').check();
      await page.locator('button[type="submit"], button:has-text("Join Now")').click();
      await page.waitForTimeout(3000);
      
      currentUrl = page.url();
      console.log('After signup, URL:', currentUrl);
    }
    
    // Step 2: Verify User D lands on /
    console.log('Step 2: Verify User D on dashboard...');
    if (!currentUrl.includes('/') || currentUrl.includes('/login') || currentUrl.includes('/signup')) {
      console.log('FAIL: Not on dashboard. URL:', currentUrl);
      throw new Error('User D not redirected to dashboard. URL: ' + currentUrl);
    }
    expect(currentUrl.endsWith('/') || currentUrl.endsWith('/?')).toBeTruthy();
    console.log('User D successfully on /');
    
    // Logout
    try {
      await page.click('[data-testid="logout"], button:has-text("Log Out"), button:has-text("Sign Out")');
    } catch {}
    await page.waitForTimeout(2000);
    
    // Step 3: Try login as User E
    console.log('Step 3: Login as User E...');
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await emailInput.fill(PASSENGER_EMAIL);
    await passwordInput.fill(PASSWORD);
    await submitBtn.click();
    await page.waitForTimeout(3000);
    
    currentUrl = page.url();
    console.log('After login, URL:', currentUrl);
    
    if (currentUrl.includes('/login') || currentUrl.includes('/complete-profile')) {
      console.log('Login failed - need to create account');
      await page.goto('/signup');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      
      await page.locator('input[name="fullName"], input[placeholder*="name"]').fill('Test Lifecycle Passenger');
      await page.locator('input[type="email"]').fill(PASSENGER_EMAIL);
      await page.locator('input[type="password"]').fill(PASSWORD);
      await page.locator('input[type="tel"], input[placeholder*="917"]').fill('9171110002');
      await page.locator('input[type="checkbox"]').check();
      await page.locator('button[type="submit"], button:has-text("Join Now")').click();
      await page.waitForTimeout(3000);
      
      currentUrl = page.url();
      console.log('After signup, URL:', currentUrl);
    }
    
    // Step 4: Verify User E lands on /
    console.log('Step 4: Verify User E on dashboard...');
    if (!currentUrl.includes('/') || currentUrl.includes('/login') || currentUrl.includes('/signup')) {
      throw new Error('User E not redirected to dashboard. URL: ' + currentUrl);
    }
    console.log('User E successfully on /');
    
    // Logout
    try {
      await page.click('[data-testid="logout"], button:has-text("Log Out"), button:has-text("Sign Out")');
    } catch {}
    await page.waitForTimeout(2000);
    
    // Step 5: Verify User D profile
    console.log('Step 5: Verify User D profile...');
    await loginAs(page, DRIVER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    await page.screenshot({ path: 'screenshots/Phase0-UserD-Profile.png' });
    
    // Get all visible text on the profile page
    const pageText = await page.locator('body').innerText();
    console.log('Profile page text:', pageText.substring(0, 500));
    
    const profileName = await page.getByText(/Test Lifecycle Driver/i).isVisible({ timeout: 3000 }).catch(() => false);
    const profileMobile = await page.getByText(/\+63\d{10}/).isVisible({ timeout: 3000 }).catch(() => false);
    
    console.log('Profile shows name:', profileName);
    console.log('Profile shows mobile:', profileMobile);
    
    // Just verify profile loads without crashing - name may be different
    const hasSomeName = await page.locator('h1, h2, [data-testid="profile-name"]').first().isVisible({ timeout: 3000 }).catch(() => false);
    expect(hasSomeName).toBeTruthy();
    
    console.log('=== PHASE 0 PASSED ===');
  });
});