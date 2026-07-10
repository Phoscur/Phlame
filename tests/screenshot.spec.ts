import { test, expect } from '@playwright/test';

/* Full-page screenshot of the home planet view — the checked-in, reviewable
 * replacement for ad-hoc screenshot scripts (see PLAN-CONTAINERS.md). Runs in the
 * containerized playwright runner; `screenshots/` is a mounted artifact sink.
 *
 *   npm run screenshot:docker
 */
test('capture home screen', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();
  await page.screenshot({ path: 'screenshots/home.png', fullPage: true });
});
