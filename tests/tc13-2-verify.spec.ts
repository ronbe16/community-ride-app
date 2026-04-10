import { test } from '@playwright/test';
import { loginAs, clearAuth } from './helpers/auth';
import { wait } from './helpers/delay';

const DRIVER_EMAIL = 'testlifecycle@communityride.test';
const PASSWORD = 'Test123!';
const TRIP_ID = 'INyK8KKNJkqWTmV8rq9k';

test('TC-13.2 Verification - Three Steps', async ({ page, context }) => {
  await wait(500);
  await clearAuth(page);
  
  console.log('=== STEP 1: User D trip detail ===');
  await loginAs(page, DRIVER_EMAIL, PASSWORD);
  await page.waitForTimeout(2000);
  
  await page.goto('/trip/' + TRIP_ID);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);
  
  await page.screenshot({ path: 'screenshots/TC-13.2-Step1-TripDetail.png' });
  
  // Get page text to find status and buttons
  const pageText = await page.locator('body').innerText();
  console.log('=== TRIP DETAIL PAGE TEXT ===');
  console.log(pageText);
  
  const allButtons = await page.locator('button').allTextContents();
  console.log('=== BUTTONS ON PAGE ===');
  console.log(allButtons);
  
  // Look for status
  const statusMatch = pageText.match(/status[:\s]*(\w+)|(\w+)\s*-\s*(?:ongoing|open|completed)/i);
  console.log('=== STATUS FOUND ===');
  console.log('Status:', statusMatch ? statusMatch[0] : 'Not found');
  
  console.log('\n=== STEP 2: Profile page ===');
  await page.goto('/profile');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  await page.screenshot({ path: 'screenshots/TC-13.2-Step2-Profile.png' });
  
  const profileText = await page.locator('body').innerText();
  console.log('=== PROFILE PAGE TEXT ===');
  console.log(profileText);
  
  const tripCountMatch = profileText.match(/(\d+)\s*(?:trip|ride)/i);
  console.log('=== TRIP COUNT ===');
  console.log('Trip count:', tripCountMatch ? tripCountMatch[0] : 'Not found');
  
  console.log('\n=== STEP 3: Incognito view ===');
  const incognito = await context.newPage();
  await incognito.goto('/trip/' + TRIP_ID);
  await incognito.waitForLoadState('domcontentloaded');
  await incognito.waitForTimeout(2000);
  
  await incognito.screenshot({ path: 'screenshots/TC-13.2-Step3-Public.png' });
  
  const publicText = await incognito.locator('body').innerText();
  console.log('=== PUBLIC TRIP PAGE TEXT ===');
  console.log(publicText);
  
  const publicStatusMatch = publicText.match(/status[:\s]*(\w+)|(\w+)\s*-\s*(?:ongoing|open|completed)/i);
  console.log('=== PUBLIC STATUS ===');
  console.log('Status:', publicStatusMatch ? publicStatusMatch[0] : 'Not found');
  
  await incognito.close();
});