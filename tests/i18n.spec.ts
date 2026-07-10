import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Phlame/);
});

test('i18n', async ({ page }) => {
  await page.goto('/');
  // Expects the heading to exist
  await expect(page.getByRole('heading', { name: 'Home' })).toBeVisible();

  // Click the language selector
  await page.getByRole('button', { name: 'English' }).click();
  // Switch the language
  await page.getByRole('button', { name: 'Deutsch' }).click();

  // Expects the heading to be translated
  await expect(page.getByRole('heading', { name: 'Übersicht' })).toBeVisible();
});
