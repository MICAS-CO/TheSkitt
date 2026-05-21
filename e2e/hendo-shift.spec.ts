import { test, expect } from '@playwright/test';

/**
 * Single end-to-end smoke (per build prompt §"Playwright for one end-to-
 * end smoke test"): boot the production preview, navigate the menu, the
 * shift board, and an encounter, and confirm the kernel-backed UI renders
 * focus + ambient sections. Per-case happy-path is exercised by the
 * Vitest scoring tests.
 */
test('menu → hen-do shift → board → encounter', async ({ page }) => {
  // M74: skip the first-run induction by seeding a completed character.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      'theSkitt.character.v1',
      JSON.stringify({
        firstName: 'Test',
        lastName: 'Doctor',
        role: 'F1',
        inducted: true,
        createdIso: '2026-01-01T00:00:00.000Z',
      }),
    );
  });
  await page.goto('/');

  // Menu loads
  await expect(page.getByRole('heading', { name: 'The Skitt' })).toBeVisible();
  await page.getByRole('button', { name: /The hen-do/ }).click();

  // Shift board renders both sections
  await expect(page.getByRole('heading', { name: 'Focus cases' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ambient board' })).toBeVisible();
  await expect(page.getByText('Anaphylaxis — adult, peanut at restaurant')).toBeVisible();

  // Open Beth's encounter
  await page.getByText('Anaphylaxis — adult, peanut at restaurant').click();
  await expect(page.getByRole('heading', { name: 'Arrival' })).toBeVisible();
  // Clock controls visible — anchor on the exact ClockBar label.
  // M10+ default history landing happens to surface a topic containing
  // 'start', so a loose /start/ regex would match two elements.
  await expect(page.getByRole('button', { name: '▶ start' })).toBeVisible();

  // Return to board
  await page.getByRole('button', { name: '← board' }).click();
  await expect(page.getByRole('heading', { name: 'Focus cases' })).toBeVisible();
});
