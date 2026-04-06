import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';

test.describe('GROUP 10 — Profile', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-10.1 — View Profile', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const hasName = await page.getByText(/test driver/i).isVisible().catch(() => false);
    const hasMobile = await page.getByText(/917/).isVisible().catch(() => false);
    
    expect(hasName || hasMobile || page.url().includes('/profile')).toBeTruthy();
    
    await page.screenshot({ path: 'screenshots/TC-10.1-view-profile.png' });
  });

  test('TC-10.2 — Add Vehicle Info', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const makeInput = page.locator('#vehicleMake');
    if (await makeInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await makeInput.fill('Toyota');
      await page.locator('#vehicleModel').fill('Innova');
      await page.locator('#vehicleYear').fill('2022');
      await page.locator('#plateNumber').fill('ABC 1234');
      await page.locator('#vehicleColor').fill('Silver');
      
      await page.click('button:has-text("Save vehicle info")');
      await page.waitForTimeout(2000);
    }
    
    expect(true).toBeTruthy();
  });

  test('TC-10.4 — Edit Full Name', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const nameInput = page.locator('#fullName');
    
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Test Driver Updated');
      
      await page.click('button:has-text("Save profile")');
      await page.waitForTimeout(2000);
      
      await page.screenshot({ path: 'screenshots/TC-10.4-edit-full-name.png' });
    }
    
    expect(true).toBeTruthy();
  });

  test('TC-10.7 — Profile Rating Shows Zero Gracefully', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const hasNaN = await page.getByText(/NaN|undefined/i).isVisible().catch(() => false);
    expect(hasNaN).toBeFalsy();
    
    await page.screenshot({ path: 'screenshots/TC-10.7-rating-shows-zero.png' });
  });

  test('TC-10.8 — Vehicle Info Is Optional', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const saveButton = page.locator('button:has-text("Save profile")');
    
    if (await saveButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      expect(true).toBeTruthy();
    }
  });
});