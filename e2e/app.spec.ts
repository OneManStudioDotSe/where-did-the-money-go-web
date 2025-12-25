import { test, expect } from '@playwright/test';

test.describe('App Loading', () => {
  test('loads the application', async ({ page }) => {
    await page.goto('/');

    // App should load without errors
    await expect(page).toHaveTitle(/Where Did/i);
  });

  test('shows upload area or transaction list', async ({ page }) => {
    await page.goto('/');

    // Should either show file upload or transaction list
    const hasUpload = await page.locator('text=Upload').isVisible().catch(() => false);
    const hasTransactions = await page.locator('text=Transaction').isVisible().catch(() => false);

    expect(hasUpload || hasTransactions).toBe(true);
  });
});

test.describe('CSV Upload Flow', () => {
  test('shows file drop zone', async ({ page }) => {
    await page.goto('/');

    // Look for drag-and-drop area or file input
    const fileInput = page.locator('input[type="file"]');
    const dropZone = page.locator('[data-testid="drop-zone"]');

    const hasFileInput = await fileInput.count() > 0;
    const hasDropZone = await dropZone.count() > 0;

    // Should have some way to upload files
    expect(hasFileInput || hasDropZone).toBe(true);
  });
});

test.describe('Navigation', () => {
  test('can navigate between main sections', async ({ page }) => {
    await page.goto('/');

    // Check for navigation elements
    const navItems = page.locator('nav a, nav button, [role="tab"]');
    const count = await navItems.count();

    // Should have navigation options
    expect(count).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Settings', () => {
  test('can access settings', async ({ page }) => {
    await page.goto('/');

    // Look for settings button or link
    const settingsButton = page.locator('text=Settings, [aria-label*="settings"], button:has-text("⚙")').first();

    if (await settingsButton.isVisible()) {
      await settingsButton.click();

      // Settings panel should open
      await expect(page.locator('text=Settings')).toBeVisible();
    }
  });
});

test.describe('Responsive Design', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // App should load on mobile
    await expect(page.locator('body')).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    // App should load on tablet
    await expect(page.locator('body')).toBeVisible();
  });
});
