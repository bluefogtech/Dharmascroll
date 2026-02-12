import { test, expect } from '@playwright/test';

test('Homepage loads correctly', async ({ page }) => {
  await page.goto('https://dharmascroll.app');

  await expect(page).toHaveTitle(/Dharma/);

  // Check navigation buttons
  await expect(page.locator('text=Scroll Quotes')).toBeVisible();
  await expect(page.locator('text=Bhagavad Gita')).toBeVisible();
});

test('Navigate to Gita page', async ({ page }) => {
  await page.goto('https://dharmascroll.app');

  await page.click('text=Bhagavad Gita');

  await expect(page).toHaveURL(/gita/);
});
