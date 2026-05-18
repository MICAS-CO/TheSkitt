import { test, expect } from '@playwright/test';

/**
 * Single end-to-end smoke (per build prompt §"Playwright for one end-to-
 * end smoke test"): boot the production preview, navigate the menu, the
 * shift board, and an encounter, and confirm the kernel-backed UI renders
 * focus + ambient sections. Per-case happy-path is exercised by the
 * Vitest scoring tests.
 */
test('menu → hen-do shift → board → encounter', async ({ page }) => {
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
  // Clock controls visible
  await expect(page.getByRole('button', { name: /start/ })).toBeVisible();

  // Return to board
  await page.getByRole('button', { name: '← board' }).click();
  await expect(page.getByRole('heading', { name: 'Focus cases' })).toBeVisible();
});
