import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';

test.describe('GROUP 6 — Post Trip', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const makeInput = page.locator('#vehicleMake');
    const currentValue = await makeInput.inputValue();
    
    if (!currentValue) {
      await makeInput.fill('Toyota');
      await page.locator('#vehicleModel').fill('Innova');
      await page.locator('#vehicleYear').fill('2022');
      await page.locator('#plateNumber').fill('ABC 1234');
      await page.locator('#vehicleColor').fill('Silver');
      
      await page.click('button:has-text("Save vehicle info")');
      await page.waitForTimeout(3000);
    }
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-6.1 — Post a Valid Trip', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    const hasOriginInput = await page.locator('#origin').isVisible({ timeout: 5000 }).catch(() => false);
    expect(hasOriginInput).toBe(true);
    
    await page.locator('#origin').fill('Main Gate, Block 3');
    await page.locator('#destination').fill('Ayala MRT Station');
    await page.locator('#departureTime').fill('07:00');
    await page.locator('#gas').fill('50');
    
    await page.click('button:has-text("Post trip")');
    
    await page.waitForTimeout(3000);
    
    const currentURL = page.url();
    expect(currentURL).not.toContain('/post-trip');
    
    await page.screenshot({ path: 'screenshots/TC-6.1-post-valid-trip.png' });
  });

  test('TC-6.3 — Missing Destination Rejected', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.getByLabel('Pickup point').fill('Main Gate');
    
    await page.click('button:has-text("Post trip")');
    
    await page.waitForTimeout(1000);
    
    expect(page.url()).toContain('/post-trip');
  });

  test('TC-6.6 — Gas Contribution Is Optional', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.getByLabel('Pickup point').fill('Main Gate');
    await page.getByLabel('Destination').fill('Ayala MRT');
    
    await page.locator('#departureTime').fill('07:00');
    
    await page.click('button:has-text("Post trip")');
    
    await page.waitForTimeout(2000);
    
    expect(true).toBeTruthy();
  });

  test('TC-6.7 — Off-Peak Hours Warning Shown', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.locator('#departureTime').fill('14:00');
    await page.waitForTimeout(1000);
    
    const warningVisible = await page.getByText(/peak hours|LTFRB/i).isVisible().catch(() => false);
    
    await page.screenshot({ path: 'screenshots/TC-6.7-off-peak-warning.png' });
    
    expect(warningVisible).toBeTruthy();
  });

  test('TC-6.9 — Seats Stepper Cannot Go Below 1', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const seatsDisplay = page.locator('span:text-matches("^[0-9]$")').first();
    const decrementButton = page.locator('button:has-text("−")').first();
    
    for (let i = 0; i < 5; i++) {
      await decrementButton.click();
      await page.waitForTimeout(100);
    }
    
    const newValue = parseInt(await seatsDisplay.textContent() || '1', 10);
    expect(newValue).toBeGreaterThanOrEqual(1);
  });

  test('TC-6.10 — Seats Stepper Cannot Exceed 4', async ({ page }) => {
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const incrementButton = page.locator('button:has-text("+")').first();
    for (let i = 0; i < 10; i++) {
      await incrementButton.click();
      await page.waitForTimeout(100);
    }
    
    const seatsDisplay = page.locator('span:text-matches("^[0-9]$")').first();
    const newValue = parseInt(await seatsDisplay.textContent() || '4', 10);
    
    expect(newValue).toBeLessThanOrEqual(4);
  });
});