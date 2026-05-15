import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
  test('admin page loads', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
