import { test, expect } from '@playwright/test';

test('queue build action', async ({ page }) => {
  await page.goto('http://localhost:4200/');
  await expect(page.getByRole('heading', { name: 'Planet' })).toBeVisible();

  await page.getByRole('button', { name: 'Upgrade' }).click();

  // Expects the heading to be translated
  await expect(page.getByRole('list', { name: 'Level 3' })).toBeVisible();
});
