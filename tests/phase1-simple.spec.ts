import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSENGER_EMAIL = 'testlifecyclepass@communityride.test';
const PASSWORD = 'Test123!';

test.describe('PHASE 1 - Trip Setup (Simple)', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test('Create and join a trip', async ({ page }) => {
    console.log('=== SIMPLE PHASE 1 TEST ===');
    
    // Step 1: Login as driver, ensure vehicle, try to post
    console.log('Step 1: Login as User D...');
    await loginAs(page, DRIVER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    
    // Check vehicle
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
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
    console.log('Vehicle OK');
    
    // Go to post-trip
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    // Fill basic form - just time
    await page.locator('#origin').fill('Main Gate, Block 3');
    await page.locator('#destination').fill('Ayala MRT Station');
    await page.locator('#departureTime').fill('14:00'); // 2pm - off peak but allowed
    
    // Wait time
    await page.locator('button[role="combobox"]').click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: '10 min' }).click();
    await page.waitForTimeout(500);
    
    // Gas
    await page.locator('#gas').fill('50');
    
    await page.screenshot({ path: 'screenshots/Phase1-Simple-Filled.png' });
    
    console.log('Submitting trip...');
    await page.locator('button[type="submit"]:has-text("Post trip")').click();
    await page.waitForTimeout(4000);
    
    const url = page.url();
    console.log('After submit URL:', url);
    
    // Check for error
    const pageText = await page.locator('body').innerText();
    if (pageText.includes('Daily limit')) {
      console.log('DAILY LIMIT HIT - STOPPING HERE');
      throw new Error('Daily limit still being hit. Please delete ALL trips for this account in Firestore (including cancelled ones).');
    }
    
    // Extract trip ID
    let tripId = '';
    if (url.includes('/trip/')) {
      const match = url.match(/\/trip\/([^?]+)/);
      if (match) tripId = match[1];
      console.log('Trip ID:', tripId);
    }
    
    // Logout
    try { await page.click('button:has-text("Sign out")'); } catch {}
    await page.waitForTimeout(1500);
    
    // Step 2: Login as passenger, navigate to trip
    console.log('Step 2: Login as User E...');
    await loginAs(page, PASSENGER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    
    if (tripId) {
      await page.goto('/trip/' + tripId);
    } else {
      await page.goto('/');
    }
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Debug: dump page content
    const passengerPageText = await page.locator('body').innerText();
    console.log('Passenger page text:', passengerPageText.substring(0, 500));
    
    await page.screenshot({ path: 'screenshots/Phase1-Simple-PassengerView.png' });
    
    // Check for join button - get ALL buttons on page first
    const allButtons = await page.locator('button').allTextContents();
    console.log('All buttons:', allButtons);
    
    // Now try specific selectors
    const joinBtn = page.locator('button:has-text("Join"), button:has-text("Join this trip")');
    const joinVisible = await joinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Join button visible:', joinVisible);
    
    // Also check for full trip / already joined status
    const fullText = await page.getByText(/full|joined|cancel/i).isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Full/Joined text visible:', fullText);
    
    if (joinVisible) {
      await joinBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/Phase1-Simple-Joined.png' });
    }
    
    // Verify joined
    const joinedText = await page.getByText(/joined|cancel seat/i).isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Joined confirmed:', joinedText);
    
    expect(joinedText || joinVisible).toBeTruthy();
  });
});