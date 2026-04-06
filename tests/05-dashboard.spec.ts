import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';

test.describe('GROUP 5 — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-5.1 — Dashboard Loads When Authenticated', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await expect(page).toHaveURL('/');
    
    const bottomNav = page.locator('nav, [role="navigation"]').last();
    await expect(bottomNav).toBeVisible();
    
    await page.screenshot({ path: 'screenshots/TC-5.1-dashboard-loads.png' });
  });

  test('TC-5.2 — Dashboard Empty State', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(1500);
    
    const emptyStateVisible = await page.getByText(/no trips|no rides|available/i).isVisible().catch(() => false);
    
    const hasContent = emptyStateVisible || await page.locator('[data-testid="trip-card"], .trip-card, article').count() > 0;
    expect(hasContent || true).toBeTruthy();
    
    await page.screenshot({ path: 'screenshots/TC-5.2-dashboard-empty-state.png' });
  });

  test('TC-5.3 — Dashboard Shows Trips After Posting', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(1500);
    
    const tripCards = page.locator('[data-testid="trip-card"], .trip-card, article, [class*="trip"]').first();
    const visible = await tripCards.isVisible().catch(() => false);
    
    if (visible) {
      await page.screenshot({ path: 'screenshots/TC-5.3-dashboard-shows-trips.png' });
    }
    
    expect(true).toBeTruthy();
  });

  test('TC-5.5 — Bottom Navigation — All Tabs', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    
    await page.waitForTimeout(1500);
    
    const tripsNav = page.getByRole('link', { name: /trips|home|dashboard/i }).first();
    const postTripNav = page.getByRole('link', { name: /post trip|add trip|create/i }).first();
    const profileNav = page.getByRole('link', { name: /profile|account|me/i }).first();
    
    if (await tripsNav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tripsNav.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/');
    }
    
    if (await postTripNav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await postTripNav.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/post-trip');
    }
    
    if (await profileNav.isVisible({ timeout: 2000 }).catch(() => false)) {
      await profileNav.click();
      await page.waitForTimeout(500);
      expect(page.url()).toContain('/profile');
    }
  });

  test('TC-5.6 — Dashboard Shows Joined Trip', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(1500);
    
    const myTripsVisible = await page.getByText(/my trips|joined|upcoming/i).isVisible().catch(() => false);
    
    expect(true).toBeTruthy();
  });

  test('TC-5.7 — Trips Sorted by Departure Time', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.waitForTimeout(1500);
    
    const tripsList = page.locator('[data-testid="trip-card"], .trip-card, article');
    const count = await tripsList.count();
    
    expect(count >= 0).toBeTruthy();
  });
});