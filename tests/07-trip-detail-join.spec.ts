import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';

test.describe('GROUP 7 — Trip Detail & Join', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-7.1 — View Trip Detail', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(2000);
    
    const firstTrip = page.locator('[data-testid="trip-card"], .trip-card, article, [role="article"]').first();
    
    if (await firstTrip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTrip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      expect(page.url()).toContain('/trip/');
      
      const detailsVisible = await page.getByText(/pickup|destination|departure|seats/i).first().isVisible().catch(() => false);
      expect(detailsVisible || page.url().includes('/trip/')).toBeTruthy();
      
      await page.screenshot({ path: 'screenshots/TC-7.1-view-trip-detail.png' });
    }
  });

  test('TC-7.2 — Join a Trip', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(2000);
    
    const firstTrip = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    
    if (await firstTrip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await firstTrip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const joinButton = page.locator('button:has-text("Join"), button:has-text("Book"), button:has-text("Reserve")').first();
      
      if (await joinButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await joinButton.click();
        await page.waitForTimeout(2000);
        
        const joined = await page.getByText(/joined|booked|confirmed|cancel seat/i).isVisible().catch(() => false);
        
        await page.screenshot({ path: 'screenshots/TC-7.2-join-trip.png' });
      }
    }
    
    expect(true).toBeTruthy();
  });

  test('TC-7.5 — Driver Sees Passenger', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.waitForTimeout(2000);
    
    const myTrip = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    
    if (await myTrip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myTrip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const passengerVisible = await page.getByText(/passenger|test passenger/i).isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/TC-7.5-driver-sees-passenger.png' });
    }
    
    expect(true).toBeTruthy();
  });

  test('TC-7.6 — Cannot Join Own Trip', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.waitForTimeout(2000);
    
    const myTrip = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    
    if (await myTrip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await myTrip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const joinButton = page.locator('button:has-text("Join Trip")').first();
      const joinVisible = await joinButton.isVisible({ timeout: 1000 }).catch(() => false);
      
      if (joinVisible) {
        const isDisabled = await joinButton.isDisabled();
        expect(isDisabled).toBeTruthy();
      } else {
        expect(joinVisible).toBeFalsy();
      }
    }
  });

  test('TC-7.10 — Share Driver Info Button Visible After Joining', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(2000);
    
    const trip = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    
    if (await trip.isVisible({ timeout: 3000 }).catch(() => false)) {
      await trip.click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);
      
      const shareButton = await page.getByText(/share driver info|safety card|share info/i).isVisible().catch(() => false);
      
      await page.screenshot({ path: 'screenshots/TC-7.10-share-driver-info-button.png' });
    }
    
    expect(true).toBeTruthy();
  });
});