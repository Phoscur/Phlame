import { test, expect } from '@playwright/test';

test('queue build action in the past using timewarp slider', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();

  // Fast forward time by 50 seconds (5 ticks)
  await page.clock.fastForward(50000);

  // The slider should show the new tick (around 5)
  // Let's timewarp back to tick 0
  const slider = page.locator('.tickRange');
  await slider.fill('0');

  // Verify the tick in the slider label is back to 0
  await expect(page.locator('ph-tick-slider .tick')).toHaveText(/\[0\]/);

  // Queue a building upgrade (Metallic Mine is the first one)
  await page.getByRole('button', { name: 'Upgrade' }).first().click();

  // Expect the queued upgrade to show up in the building queue successfully
  // If the server rejected it due to tick validation, it would not appear or an error would be shown
  await expect(page.locator('.buildingQueue li').filter({ hasText: 'Level 2' })).toBeVisible();

  // Reload the page. The time will reset to the present (tick 5+).
  // Because the building only takes 4 ticks, and we queued it at tick 0,
  // it should now be fully built and show up in the building list!
  await page.reload();
  await page.clock.install();

  // It should no longer be in the queue
  await expect(page.locator('.buildingQueue li')).toHaveCount(0);

  // It should be completed and level 2
  await expect(
    page.locator('.buildingList li').filter({ hasText: 'Metal Mine — Level 2' }),
  ).toBeVisible();
});

test('slider clamping prevents timewarping before the last queued action', async ({ page }) => {
  page.on('console', (msg) => console.log('BROWSER:', msg.text()));
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();

  // Fast forward time by 10 seconds (tick 1)
  await page.clock.fastForward(10000);

  // Queue an action at tick 1
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await expect(page.locator('.buildingQueue li').filter({ hasText: 'Level 2' })).toBeVisible();

  // Fast forward by 50 seconds (tick 6)
  await page.clock.fastForward(50000);

  const slider = page.locator('.tickRange');

  // The UI should clamp the minimum value to the queued action's tick
  await slider.getAttribute('max'); // wait, no, the action tick isn't max. Let's just check it is not 0.
  const minTick = await slider.getAttribute('min');
  expect(minTick).not.toBe('0');
  expect(Number(minTick)).toBeGreaterThan(0);

  // Now check the toggle
  await page.getByRole('checkbox', { name: 'Timewarp to Genesis' }).check();

  // Now it should allow 0
  await expect(slider).toHaveAttribute('min', '0');
});
