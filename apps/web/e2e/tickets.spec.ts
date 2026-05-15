import { test, expect } from '@playwright/test';

test.describe('Tickets', () => {
  test('ticket list page loads', async ({ page }) => {
    await page.goto('/tickets');
    await page.waitForLoadState('networkidle');
    const body = page.locator('body');
    await expect(body).toBeAttached();
  });
});
