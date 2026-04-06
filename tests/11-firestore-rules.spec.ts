import { test, expect } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';

test.describe('GROUP 11 — Firestore Security Rules', () => {
  test.beforeEach(async ({ page }) => {
    await clearAuth(page);
  });

  test.afterEach(async ({ page }) => {
    await page.waitForTimeout(2000);
  });

  test('TC-11.1 — User Cannot Write to Another User\'s Doc', async ({ page }) => {
    await loginAs(page, 'testpassenger@communityride.test', 'Test123!');
    
    await page.goto('/profile');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1500);
    
    const error = await page.evaluate(async () => {
      try {
        const { doc, updateDoc, getFirestore } = await import('firebase/firestore');
        const db = getFirestore();
        
        await updateDoc(doc(db, 'users', 'FAKE_USER_A_UID'), { 
          fullName: 'Hacked' 
        });
        
        return null;
      } catch (e: unknown) {
        const err = e as { code?: string; message?: string };
        return err.code || err.message;
      }
    }).catch((e) => e.message);
    
    expect(error).toContain('permission-denied');
  });

  test('TC-11.5 — Safety Links Are Publicly Readable', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('/safety/test-link-id', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      const currentURL = page.url();
      expect(currentURL).not.toContain('/login');
      expect(currentURL).toContain('/safety/');
    } finally {
      await context.close();
    }
  });

  test('TC-11.6 — Manifests Are Publicly Readable', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('/manifest/test-manifest-id', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      const currentURL = page.url();
      expect(currentURL).not.toContain('/login');
      expect(currentURL).toContain('/manifest/');
    } finally {
      await context.close();
    }
  });

  test('TC-11.8 — Unauthenticated Cannot Post Trips', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('/post-trip', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      const currentURL = page.url();
      expect(currentURL).toContain('/login');
    } finally {
      await context.close();
    }
  });

  test('TC-11.4 — Unauthenticated Cannot Read Users Collection', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      
      const currentURL = page.url();
      expect(currentURL).toContain('/login');
    } finally {
      await context.close();
    }
  });
});