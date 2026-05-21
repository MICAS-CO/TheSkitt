import { test, expect } from '@playwright/test';

/**
 * Smoke for the department-view (static SVG floorplan) flow:
 *  menu → hen-do → board → switch to department view → back to board.
 *
 * M92: previously a Phaser canvas; now a static SVG floorplan with
 * absolutely-positioned patient-card buttons. Verifies the view toggle
 * wires up, the floorplan mounts, and returning to the board works.
 */
test('hen-do shift: board ↔ department view toggle', async ({ page }) => {
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
  await page.getByRole('button', { name: /The hen-do/ }).click();
  await expect(page.getByRole('heading', { name: 'Focus cases' })).toBeVisible();

  // Switch to the department view
  await page.getByRole('button', { name: /department view/ }).click();
  // Hub header is visible
  await expect(page.getByText(/department view/)).toBeVisible();
  // The static SVG floorplan mounts (div with data-testid="ed-floorplan")
  await expect(page.getByTestId('ed-floorplan')).toBeVisible();

  // Switch back to the board
  await page.getByRole('button', { name: /board view/ }).click();
  await expect(page.getByRole('heading', { name: 'Focus cases' })).toBeVisible();
});
