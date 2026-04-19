import { test, expect } from '@playwright/test';

test('app redirects root to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
});

test('login page has title', async ({ page }) => {
  await page.goto('/login');
  await expect(page).toHaveTitle(/Online Jobfair/);
});
