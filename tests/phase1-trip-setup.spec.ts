import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSENGER_EMAIL = 'testlifecyclepass@communityride.test';
const PASSWORD = 'Test123!';

let tripId = '';

test.describe('PHASE 1 - Trip Setup', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test('Create trip and passenger joins', async ({ page }) => {
    console.log('=== PHASE 1: TRIP SETUP ===');
    
    // Step 1: Log in as User D, navigate to /post-trip
    console.log('Step 1: Login as User D, go to post-trip...');
    await loginAs(page, DRIVER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    
    // First add vehicle info (required to post trips)
    console.log('Step 1a: Adding vehicle info...');
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
    
    // Cancel any existing trips to avoid daily limit
    console.log('Step 1b: Checking for existing trips to cancel...');
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const existingTripCards = page.locator('[data-testid="trip-card"], .trip-card, article');
    const tripCount = await existingTripCards.count();
    console.log('Existing trip cards:', tripCount);
    
    if (tripCount > 0) {
      // Try to cancel each trip
      for (let i = 0; i < tripCount; i++) {
        const card = existingTripCards.nth(i);
        await card.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1000);
        
        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Delete")').first();
        if (await cancelBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await cancelBtn.click();
          await page.waitForTimeout(2000);
        }
        await page.goto('/');
        await page.waitForTimeout(1000);
      }
    }
    console.log('Cleared existing trips');
    
    await page.goto('/post-trip');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    const postTripUrl = page.url();
    console.log('Current URL:', postTripUrl);
    
    // Verify we're on /post-trip
    expect(postTripUrl.includes('/post-trip')).toBeTruthy();
    
    await page.screenshot({ path: 'screenshots/Phase1-PostTrip-Empty.png' });
    
    // Step 2: Fill the form
    console.log('Step 2: Filling post-trip form...');
    
    // Fill origin (pickup)
    await page.locator('#origin').fill('Main Gate, Block 3');
    await page.waitForTimeout(500);
    
    // Fill destination
    await page.locator('#destination').fill('Ayala MRT Station');
    await page.waitForTimeout(500);
    
    // Fill departure time - need to set it to tomorrow 7:00 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    console.log('Setting date to:', dateStr);
    
    // For time, just set 07:00
    await page.locator('#departureTime').fill('07:00');
    await page.waitForTimeout(500);
    
    // Wait time - click the select trigger and pick 10 min
    const waitTrigger = page.locator('button[role="combobox"]:has-text("min")').first();
    await waitTrigger.click();
    await page.waitForTimeout(500);
    await page.getByRole('option', { name: '10 min' }).click();
    await page.waitForTimeout(500);
    
    // Available seats - default is 2, verify it's at 2
    const seatsDisplay = page.locator('span:has-text("2")').first();
    const seatsAt2 = await seatsDisplay.isVisible({ timeout: 2000 }).catch(() => false);
    console.log('Seats at 2:', seatsAt2);
    if (!seatsAt2) {
      await page.locator('button:has-text("+")').first().click();
      await page.waitForTimeout(300);
    }
    
    // Gas contribution
    await page.locator('#gas').fill('50');
    await page.waitForTimeout(500);
    
    // Step 3: Submit
    console.log('Step 3: Submitting trip...');
    await page.screenshot({ path: 'screenshots/Phase1-PostTrip-Filled.png' });
    
    const submitBtn = page.locator('button[type="submit"]:has-text("Post trip")');
    await submitBtn.click();
    
    // Wait for potential toast or navigation
    await page.waitForTimeout(3000);
    
    // Check for toast messages
    const toastVisible = await page.locator('[role="alert"], .sonner-toast, .toast').first().isVisible({ timeout: 2000 }).catch(() => false);
    if (toastVisible) {
      const toastText = await page.locator('[role="alert"], .sonner-toast, .toast').first().innerText().catch(() => '');
      console.log('Toast visible:', toastText);
    }
    
    const afterSubmitUrl = page.url();
    console.log('After submit, URL:', afterSubmitUrl);
    
    await page.screenshot({ path: 'screenshots/Phase1-PostTrip-AfterSubmit.png' });
    
    // Check if we stayed on /post-trip (error) or went to trip detail
    if (afterSubmitUrl.includes('/post-trip')) {
      // Check for error messages - get all visible text on page
      const pageText = await page.locator('body').innerText();
      console.log('Page text after submit:', pageText.substring(0, 800));
      
      // Check for any toasts
      const toasts = await page.locator('[role="alert"], [class*="toast"]').allTextContents();
      console.log('Toasts:', toasts);
      
      // Check if form still has values
      const originValue = await page.locator('#origin').inputValue();
      const destValue = await page.locator('#destination').inputValue();
      console.log('Form values - origin:', originValue, 'destination:', destValue);
      
      throw new Error('Trip submission failed - stayed on /post-trip. Page text: ' + pageText.substring(0, 200));
    }
    
    // Extract trip ID if URL contains it
    if (afterSubmitUrl.includes('/trip/')) {
      const match = afterSubmitUrl.match(/\/trip\/([^?]+)/);
      if (match) {
        tripId = match[1];
        console.log('Trip ID:', tripId);
      }
    }
    
    // Step 4: Find the trip on the page
    console.log('Step 4: Looking for posted trip...');
    const tripCard = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    const tripVisible = await tripCard.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Trip card visible:', tripVisible);
    
    // Step 5: Logout
    console.log('Step 5: Logging out...');
    try {
      await page.click('button:has-text("Sign out"), button:has-text("Log Out")');
    } catch {}
    await page.waitForTimeout(2000);
    
    // Step 6: Log in as User E, go to dashboard
    console.log('Step 6: Login as User E, go to dashboard...');
    await loginAs(page, PASSENGER_EMAIL, PASSWORD);
    await page.waitForTimeout(2000);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    await page.screenshot({ path: 'screenshots/Phase1-Passenger-Dashboard.png' });
    
    // Look for User D's trip - try to find by driver name
    const userDTrip = page.locator('text=Test Lifecycle Driver').first();
    const tripFound = await userDTrip.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('User D trip visible on dashboard:', tripFound);
    
    // If not visible on dashboard, try navigating directly to the trip URL
    if (!tripFound && tripId) {
      console.log('Navigating directly to trip URL...');
      await page.goto('/trip/' + tripId);
      await page.waitForURL(/\/trip\//);
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);
    } else if (tripFound) {
      // Click to open trip detail
      await userDTrip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1500);
    }
    
    // Get current URL and page content
    const tripPageUrl = page.url();
    console.log('Trip page URL:', tripPageUrl);
    const tripPageText = await page.locator('body').innerText();
    console.log('Trip page text:', tripPageText.substring(0, 300));
    
    await page.screenshot({ path: 'screenshots/Phase1-Passenger-TripDetail.png' });
    
    // Step 7: Check buttons and join
    console.log('Step 7: Checking trip detail for join button...');
    const joinBtn = page.locator('button:has-text("Join Trip")');
    const joinBtnVisible = await joinBtn.isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Join button visible:', joinBtnVisible);
    
    // Also check for already joined state
    const alreadyJoined = await page.getByText(/joined|cancel seat/i).isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Already joined:', alreadyJoined);
    
    if (!joinBtnVisible && !alreadyJoined) {
      const allButtons = await page.locator('button').allTextContents();
      console.log('All buttons on page:', allButtons);
      throw new Error('Join button not visible. Buttons: ' + allButtons.join(', '));
    }
    
    if (joinBtnVisible) {
      await joinBtn.click();
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'screenshots/Phase1-Passenger-Joined.png' });
    }
    
    // Step 8: Verify joined
    const confirmedJoined = await page.getByText(/joined|cancel seat/i).isVisible({ timeout: 3000 }).catch(() => false);
    console.log('Confirmed joined:', confirmedJoined);
    
    if (!confirmedJoined) {
      throw new Error('Join failed - button does not show "Joined"');
    }
    
    console.log('=== PHASE 1 PASSED ===');
    console.log('TRIP_ID:', tripId);
  });
});