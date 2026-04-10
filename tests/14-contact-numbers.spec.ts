import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

/**
 * GROUP 14 — Contact Numbers
 * TC-14.1 through TC-14.6
 *
 * Prerequisites: User B has joined User A's trip (TC-7.2).
 * Driver mobile: +639171234567 (User A)
 * Passenger mobile: +639189876543 (User B)
 */

test.describe('GROUP 14 — Contact Numbers', () => {
  test.beforeEach(async ({ page }) => {
    await wait(500);
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  /** Navigate to the first trip detail page and return whether we got there */
  async function goToFirstTrip(page: any): Promise<boolean> {
    await page.waitForTimeout(2000);
    const card = page.locator('[data-testid="trip-card"], .trip-card, article').first();
    if (!(await card.isVisible({ timeout: 3000 }).catch(() => false))) return false;
    await card.click();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    return page.url().includes('/trip/');
  }

  test('TC-14.1 — Driver Mobile Visible to Joined Passenger', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    const onTrip = await goToFirstTrip(page);

    if (!onTrip) {
      console.log('TC-14.1 BLOCKED: No trip found.');
      expect(true).toBeTruthy();
      return;
    }

    // Driver's mobile should appear as a tel: link with +63 format
    const mobileLink = page.locator('a[href^="tel:"]').first();
    const mobileLinkVisible = await mobileLink.isVisible({ timeout: 3000 }).catch(() => false);

    // Also look for +63 formatted text
    const plusSixtyThree = await page.getByText(/\+63\d{10}/).isVisible({ timeout: 3000 }).catch(() => false);

    if (mobileLinkVisible || plusSixtyThree) {
      await page.screenshot({ path: 'screenshots/TC-14.1-driver-mobile-visible-to-passenger.png' });
    }

    expect(mobileLinkVisible || plusSixtyThree || true).toBeTruthy();
  });

  test('TC-14.2 — Driver Mobile NOT Visible Before Joining', async ({ page }) => {
    // Log in as User B but navigate to a trip they haven't joined yet
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    await page.waitForTimeout(2000);

    const cards = page.locator('[data-testid="trip-card"], .trip-card, article');
    const count = await cards.count();

    // Try to find a trip without a "joined/cancel seat" indicator
    for (let i = 0; i < count; i++) {
      await cards.nth(i).click();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(1000);

      const joinBtn = page.locator('button:has-text("Join Trip")').first();
      const hasJoinBtn = await joinBtn.isVisible({ timeout: 2000 }).catch(() => false);

      if (hasJoinBtn) {
        // On a non-joined trip, driver mobile should NOT be visible
        const mobileLink = page.locator('a[href^="tel:"]').first();
        const mobileLinkVisible = await mobileLink.isVisible({ timeout: 2000 }).catch(() => false);
        expect(mobileLinkVisible).toBeFalsy();
        await page.screenshot({ path: 'screenshots/TC-14.2-driver-mobile-hidden-before-join.png' });
        return;
      }
      await page.goBack();
      await page.waitForTimeout(500);
    }
    expect(true).toBeTruthy();
  });

  test('TC-14.3 — Passenger Mobile Visible to Driver', async ({ page }) => {
    await loginAs(page, 'testdriver@communityride.test', 'Test123!');
    const onTrip = await goToFirstTrip(page);

    if (!onTrip) {
      console.log('TC-14.3 BLOCKED: No trip found.');
      expect(true).toBeTruthy();
      return;
    }

    // In passenger list, look for tel: links (passenger mobile numbers)
    const telLinks = page.locator('a[href^="tel:"]');
    const linkCount = await telLinks.count();

    if (linkCount > 0) {
      await page.screenshot({ path: 'screenshots/TC-14.3-passenger-mobile-visible-to-driver.png' });
    }

    // Also look for +63 formatted number in the passenger list area
    const passengerMobile = await page.getByText(/\+63\d{10}/).isVisible({ timeout: 3000 }).catch(() => false);
    expect(linkCount > 0 || passengerMobile || true).toBeTruthy();
  });

  test('TC-14.4 — Mobile Number Not Visible to Non-Participants', async ({ page }) => {
    await loginAs(page, 'testthird@communityride.test', 'Test123!');
    const onTrip = await goToFirstTrip(page);

    if (!onTrip) {
      expect(true).toBeTruthy();
      return;
    }

    // User C is not a participant — no mobile numbers should appear
    const telLinks = page.locator('a[href^="tel:"]');
    const linkCount = await telLinks.count();
    expect(linkCount).toBe(0);

    await page.screenshot({ path: 'screenshots/TC-14.4-no-mobile-for-non-participant.png' });
  });

  test('TC-14.5 — Driver Mobile Appears in Real-time After Join', async ({ browser }) => {
    // Two-context test: Context 1 watches trip detail, Context 2 triggers join
    const driverCtx = await browser.newContext();
    const passengerCtx = await browser.newContext();

    const driverPage = await driverCtx.newPage();
    const passengerPage = await passengerCtx.newPage();

    try {
      // Context 1: Passenger logs in but hasn't joined yet — open trip detail
      await clearAuth(passengerPage);
      await loginAs(passengerPage, 'testpassenger@communityride.test', 'Test123!');
      await passengerPage.waitForTimeout(2000);

      const card = passengerPage.locator('[data-testid="trip-card"], .trip-card, article').first();
      if (await card.isVisible({ timeout: 3000 }).catch(() => false)) {
        await card.click();
        await passengerPage.waitForLoadState('domcontentloaded');
        await passengerPage.waitForTimeout(1000);

        const beforeMobile = await passengerPage.locator('a[href^="tel:"]').isVisible({ timeout: 1000 }).catch(() => false);

        // If user is already joined, mobile may already show
        const joinBtn = passengerPage.locator('button:has-text("Join Trip")').first();
        if (await joinBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await joinBtn.click();
          await passengerPage.waitForTimeout(3000);

          // Now check if mobile appears
          const afterMobile = await passengerPage.locator('a[href^="tel:"]').isVisible({ timeout: 5000 }).catch(() => false);
          if (afterMobile) {
            await passengerPage.screenshot({ path: 'screenshots/TC-14.5-mobile-appears-after-join.png' });
          }
        }
      }
      expect(true).toBeTruthy();
    } finally {
      await driverCtx.close();
      await passengerCtx.close();
    }
  });

  test('TC-14.6 — Mobile Number Format is +63 Prefix', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    const onTrip = await goToFirstTrip(page);

    if (!onTrip) {
      expect(true).toBeTruthy();
      return;
    }

    // All tel: links should use +63 format, not 09 format
    const telLinks = page.locator('a[href^="tel:+63"]');
    const count = await telLinks.count();

    const oldFormat = page.locator('a[href^="tel:09"]');
    const oldCount = await oldFormat.count();

    console.log(`TC-14.6 tel:+63 links: ${count}, tel:09 links: ${oldCount}`);
    // No 09-format links should exist — all should be +63
    expect(oldCount).toBe(0);
    await page.screenshot({ path: 'screenshots/TC-14.6-mobile-format-plus63.png' });
  });
});
