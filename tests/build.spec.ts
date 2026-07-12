import { test, expect } from '@playwright/test';

// TDD spec for the M1 building queue (see PLAN.md)
test('queue build action', async ({ page }) => {
  page.on('console', (msg) => console.log(msg.text()));
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();

  // first building in the list: the metallic mine (starts at level 1)
  await page.getByRole('button', { name: 'Upgrade' }).first().click();

  // expect the queued upgrade to show up in the building queue
  await expect(page.locator('.buildingQueue li').filter({ hasText: 'Level 2' })).toBeVisible();

  // after the queue row appears, page.reload() and expect the queue row is still visible
  await page.reload();
  await page.clock.install();
  await expect(page.locator('.buildingQueue li').filter({ hasText: 'Level 2' })).toBeVisible();

  // Fast-forward time to complete the building
  // Duration is 4 ticks (40 seconds default msPerIteration)
  await page.clock.fastForward(50000); // Fast forward 50 seconds

  // expect the queue to be empty (unqueued)
  await expect(page.locator('.buildingQueue li')).toHaveCount(0);

  // then fast-forward past completion and expect 'Metal Mine — Level 2' in .buildingList after another reload
  await page.reload();
  await page.clock.install();
  await expect(
    page.locator('.buildingList li').filter({ hasText: 'Metal Mine — Level 2' }),
  ).toBeVisible();
});
