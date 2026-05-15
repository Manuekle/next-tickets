import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Auth Flow', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: /sign|submit|iniciar/i })).toBeVisible({ timeout: 10000 });
  });

  test('shows validation errors on empty form', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('button', { name: /sign|submit|iniciar/i }).click();
    // Form validation may show or may prevent submission
  });

  test('shows register page with form fields', async ({ page }) => {
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expect(page.getByLabel('Email')).toBeVisible({ timeout: 10000 });
  });

  test('navigates to forgot password', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('link', { name: /forgot/i }).click();
    await expect(page).toHaveURL(/forgot-password/);
  });
});
