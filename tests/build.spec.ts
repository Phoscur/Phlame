import { test, expect } from '@playwright/test';

// TDD spec for the M1 building queue (see PLAN.md) — the Upgrade buttons render but
// have no action wired up yet, so this cannot pass. Flip fixme -> test when the queue
// UI lands.
test.fixme('queue build action', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();

  // first building in the list: the metallic mine (level 2)
  await page.getByRole('button', { name: 'Upgrade' }).first().click();

  // expect the queued upgrade to show up in the building queue
  await expect(page.getByRole('list', { name: 'Level 3' })).toBeVisible();
});
