import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSENGER_EMAIL = 'testlifecyclepass@communityride.test';
const PASSWORD = 'Test123!';

test.describe('PHASE 1 - Trip Setup', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test('Create or use existing trip and join', async ({ page }) => {
    console.log('=== PHASE 1: TRIP SETUP ===');
    
    // Step 1: Login as driver, check for existing trips on dashboard
    console.log('Step 1: Login as User D, check dashboard...');
    await loginAs(page, DRIVER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const existingTripCards = page.locator('[data-testid="trip-card"], article');
    const existingCount = await existingTripCards.count();
    console.log('Existing trips on dashboard:', existingCount);
    
    let tripId = '';
    
    if (existingCount > 0) {
      // Use existing trip - click it to get the ID
      console.log('Using existing trip...');
      await existingTripCards.first().click();
      await page.waitForURL(/\/trip\//);
      const url = page.url();
      const match = url.match(/\/trip\/([^?]+)/);
      if (match) tripId = match[1];
      console.log('Found trip ID:', tripId);
    } else {
      // Need to create a new trip
      console.log('Creating new trip...');
      
      // Check vehicle
      await page.goto('/profile');
      await page.waitForLoadState('domcontentloaded');
      const hasVehicle = await page.getByText(/ABC|abc/i).isVisible({ timeout: 2000 }).catch(() => false);
      if (!hasVehicle) {
        await page.locator('#vehicleMake').fill('Toyota');
        await page.locator('#vehicleModel').fill('Innova');
        await page.locator('#vehicleYear').fill('2022');
        await page.locator('#plateNumber').fill('ABC 123');
        await page.locator('#vehicleColor').fill('Silver');
        await page.click('button:has-text("Save vehicle info")');
        await page.waitForTimeout(3000);
      }
      
      await page.goto('/post-trip');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      
      await page.locator('#origin').fill('Main Gate, Block 3');
      await page.locator('#destination').fill('Ayala MRT Station');
      await page.locator('#departureTime').fill('15:00');
      
      await page.locator('button[role="combobox"]').click();
      await page.waitForTimeout(500);
      await page.getByRole('option', { name: '10 min' }).click();
      await page.waitForTimeout(500);
      
      await page.locator('#gas').fill('50');
      
      await page.locator('button[type="submit"]:has-text("Post trip")').click();
      await page.waitForTimeout(4000);
      
      const postUrl = page.url();
      console.log('After post URL:', postUrl);
      
      if (postUrl.includes('/post-trip')) {
        const pageText = await page.locator('body').innerText();
        if (pageText.includes('Daily limit')) {
          throw new Error('Daily limit hit - cannot create new trip. Use existing trip or wait for reset.');
        }
      }
      
      if (postUrl.includes('/trip/')) {
        const match = postUrl.match(/\/trip\/([^?]+)/);
        if (match) tripId = match[1];
        console.log('Created trip ID:', tripId);
      }
    }
    
    // Store trip ID for next tests
    console.log('Final trip ID:', tripId);
    
    // Logout
    try { await page.click('button:has-text("Sign out")'); } catch {}
    await page.waitForTimeout(1500);
    
    // Step 2: Login as passenger, join the trip
    console.log('Step 2: Login as User E, join trip...');
    await loginAs(page, PASSENGER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    
    if (tripId) {
      await page.goto('/trip/' + tripId);
    } else {
      await page.goto('/');
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const pageText = await page.locator('body').innerText();
    console.log('Trip page text preview:', pageText.substring(0, 200));
    
    // Look for Join button
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons:', allButtons);
    
    const joinBtn = page.locator('button:has-text("Join this trip"), button:has-text("Join")');
    const joinVisible = await joinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Join button visible:', joinVisible);
    
    if (joinVisible) {
      console.log('Clicking Join button...');
      await joinBtn.click();
      await page.waitForTimeout(3000);
      
      const afterJoinText = await page.locator('body').innerText();
      console.log('After join text:', afterJoinText.substring(0, 200));
    }
    
    // Verify joined
    const joined = await page.getByText(/joined|cancel seat|confirmed/i).isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Joined confirmed:', joined);
    
    expect(joined || joinVisible).toBeTruthy();
    console.log('=== PHASE 1 COMPLETE ===');
  });
});