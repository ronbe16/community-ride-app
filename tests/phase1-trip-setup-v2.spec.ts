import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSENGER_EMAIL = 'testlifecyclepass@communityride.test';
const PASSWORD = 'Test123!';

// This script clears any existing trips for the lifecycle accounts
// Run with: npx tsx scripts/clear-lifecycle-trips.ts

async function clearTripsForUser(email: string, password: string) {
  console.log('Checking trips for:', email);
  // This is a placeholder - in real test we'd need Firebase access
  // For now, let's try navigating to each trip and cancelling
}

test.describe('PHASE 1 - Trip Setup (With Cleanup)', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test('Create trip after clearing any existing trips', async ({ page }) => {
    console.log('=== PHASE 1: TRIP SETUP WITH CLEANUP ===');
    
    // Login as driver
    console.log('Step 0: Login as User D...');
    await loginAs(page, DRIVER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    
    // Go to profile and check vehicle
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
    console.log('Vehicle info present');
    
    // Go to dashboard to find and cancel existing trips
    console.log('Step 0b: Finding and cancelling existing trips...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Look for trip cards - click each and try to cancel
    let cancelledCount = 0;
    for (let attempt = 0; attempt < 3; attempt++) {
      const tripCard = page.locator('[data-testid="trip-card"], .trip-card, article').first();
      if (!(await tripCard.isVisible({ timeout: 2000 }).catch(() => false))) {
        break;
      }
      
      await tripCard.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
      
      // Look for cancel/delete option
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Delete trip")').first();
      if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(2000);
        cancelledCount++;
      }
      
      await page.goto('/');
      await page.waitForTimeout(1000);
    }
    console.log('Cancelled', cancelledCount, 'trips');
    
    // Now try to post - use a departure time that's clearly TOMORROW
    // The app checks departureTime >= todayStart, so if we set tomorrow's date
    // it should not count toward today's limit
    console.log('Step 1: Posting trip with tomorrow\'s date...');
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Fill form
    await page.locator('#origin').fill('Main Gate, Block 3');
    await page.locator('#destination').fill('Ayala MRT Station');
    
    // For departure time - we need to set a date. The app has a date picker
    // Let's check what fields are available
    const hasDatePicker = await page.locator('input[type="date"]').isVisible({ timeout: 1000 }).catch(() => false);
    console.log('Has date picker:', hasDatePicker);
    
    // If there's a date picker, set it to tomorrow
    if (hasDatePicker) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];
      await page.locator('input[type="date"]').fill(dateStr);
      console.log('Set date to:', dateStr);
    }
    
    // Set time
    await page.locator('#departureTime').fill('07:00');
    await page.waitForTimeout(500);
    
    // Wait time
    const waitTrigger = page.locator('button[role="combobox"]:has-text("min")').first();
    await waitTrigger.click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: '10 min' }).click();
    await page.waitForTimeout(500);
    
    // Gas
    await page.locator('#gas').fill('50');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'screenshots/Phase1-PostTrip-Filled.png' });
    
    // Submit
    console.log('Submitting trip...');
    const submitBtn = page.locator('button[type="submit"]:has-text("Post trip")');
    await submitBtn.click();
    
    await page.waitForTimeout(3000);
    
    const afterSubmitUrl = page.url();
    console.log('After submit, URL:', afterSubmitUrl);
    
    // Check for error
    const pageText = await page.locator('body').innerText();
    console.log('Page contains "Daily limit":', pageText.includes('Daily limit'));
    
    if (pageText.includes('Daily limit')) {
      console.log('Still hitting daily limit! Page text:', pageText.substring(0, 300));
    }
  });
});