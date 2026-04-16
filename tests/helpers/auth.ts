import { Page } from '@playwright/test';

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  await page.getByPlaceholder(/you@example/i).fill(email);
  await page.getByPlaceholder(/••••••••/).fill(password);
  await page.click('button[type="submit"]');
  // Accept either / or /complete-profile as a successful login redirect
  await page.waitForURL(/\/(complete-profile)?(\?.*)?$/, { timeout: 15000 });
}

export async function logout(page: Page) {
  // Try multiple selectors for logout button
  const logoutSelectors = [
    '[data-testid="logout"]',
    'text=Log Out',
    'text=Sign Out',
    'button:has-text("Log Out")',
    'button:has-text("Sign Out")',
  ];
  
  for (const selector of logoutSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      await page.waitForURL('/login', { timeout: 10000 });
      return;
    } catch (e) {
      // Try next selector
      continue;
    }
  }
  
  throw new Error('Could not find logout button');
}

export async function signupAs(
  page: Page,
  name: string,
  email: string,
  password: string,
  mobile: string
) {
  await page.goto('/signup');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
  
  // Fill form fields using getByPlaceholder (more reliable for shadcn/ui inputs)
  await page.getByPlaceholder(/juan.*cruz/i).fill(name);
  await page.getByPlaceholder(/you@email/i).fill(email);
  await page.getByPlaceholder(/••••••••/).fill(password);
  await page.getByPlaceholder(/917\d{7}/).fill(mobile);
  
  // Handle Radix UI checkbox - try multiple approaches
  try {
    // Try clicking the label (most reliable for Radix UI)
    await page.click('label[for="consent"]', { timeout: 2000 });
  } catch (e) {
    try {
      // Fallback: Try role-based selector
      await page.getByRole('checkbox', { name: /agree/i }).click({ timeout: 2000 });
    } catch (e2) {
      try {
        // Fallback: Try ID selector with force click
        await page.locator('#consent').click({ force: true, timeout: 2000 });
      } catch (e3) {
        // Last resort: any checkbox
        await page.locator('[role="checkbox"]').first().click({ force: true });
      }
    }
  }
  
  // Try multiple submit button selectors
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Join Now")',
    'button:has-text("Sign Up")',
  ];
  
  for (const selector of submitSelectors) {
    try {
      await page.click(selector, { timeout: 2000 });
      break;
    } catch (e) {
      continue;
    }
  }
  
  try {
    await page.waitForURL('**/', { timeout: 15000 });
  } catch (e) {
    const currentUrl = page.url();
    const errorText = await page.getByText(/error|failed|problem/i).first().isVisible().catch(() => false);
    console.log('Signup navigation failed. Current URL:', currentUrl);
    if (errorText) {
      const errorMsg = await page.getByText(/error|failed|problem/i).textContent().catch(() => '');
      console.log('Visible error:', errorMsg);
    }
    throw e;
  }
}

export async function clearAuth(page: Page) {
  await page.context().clearCookies();
  
  // Navigate to the app first to avoid localStorage security errors
  try {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  } catch (e) {
    // If navigation fails or localStorage is not accessible, just clear cookies
    console.log('Could not clear localStorage:', e);
  }
}
