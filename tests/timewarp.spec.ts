import { test, expect, type Page } from '@playwright/test';

// the observed frontier (ADR 0020): the slider's floor, enforced by the server as well
const frontier = async (page: Page) => Number(await page.locator('.tickRange').getAttribute('min'));

test('queue build action in the past using timewarp slider', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();
  const born = await frontier(page);

  // Fast forward time by 50 seconds (5 ticks)
  await page.clock.fastForward(50000);

  // timewarp back to the frontier: the empire has not observed anything since its birth
  const slider = page.locator('.tickRange');
  await slider.fill(`${born}`);
  await expect(page.locator('ph-tick-slider .tick')).toHaveText(`[${born}]`);

  // Queue a building upgrade (Metallic Mine is the first one) - ordered 5 ticks ago,
  // it only takes 4 ticks: the client rebuilds from the log and shows it built already
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await expect(
    page.locator('.buildingList li').filter({ hasText: 'Metal Mine — Level 2' }),
  ).toBeVisible();
  await expect(page.locator('.buildingQueue li')).toHaveCount(0);

  // Reload: the server ordered it at the same tick, so persistence agrees
  await page.reload();
  await page.clock.install();
  await expect(page.locator('.buildingQueue li')).toHaveCount(0);
  await expect(
    page.locator('.buildingList li').filter({ hasText: 'Metal Mine — Level 2' }),
  ).toBeVisible();
});

test('slider and server clamp backdating to the observed frontier', async ({ page }) => {
  await page.clock.install();
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Planet', exact: true })).toBeVisible();
  const born = await frontier(page);

  // an order at the present moves nothing below it (the fake clock runs ahead of the
  // server, which clamps the order to its own tick - the frontier stays at birth)
  await page.getByRole('button', { name: 'Upgrade' }).first().click();
  await expect(page.locator('.buildingQueue li').filter({ hasText: 'Level 2' })).toBeVisible();
  expect(await frontier(page)).toBe(born);

  // Fast forward by 50 seconds (5 ticks): the slider still offers nothing below the frontier
  await page.clock.fastForward(50000);
  const slider = page.locator('.tickRange');
  await expect(slider).toHaveAttribute('min', `${born}`);

  // and the server refuses what the slider does not offer (409, ADR 0020)
  const empire = await page.locator('empire-ctx').getAttribute('id');
  const planet = await page.locator('.phlame-grade-btn').first().getAttribute('data-planet');
  const res = await page.request.post(`/empires/${empire}/entities/${planet}/actions`, {
    data: {
      type: 'update',
      payload: { id: 'backdated', phelopmentID: 'mine-metallic', grade: 'up' },
      at: born - 1,
    },
  });
  expect(res.status()).toBe(409);
});
