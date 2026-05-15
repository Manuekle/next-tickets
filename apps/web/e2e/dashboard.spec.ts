import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test('homepage loads', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
