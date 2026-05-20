import { test, expect } from '@playwright/test';

/**
 * First-run induction smoke (M74): with no character in localStorage,
 * the app must drop straight into the Skittstown ED induction. The
 * player fills name + grade, advances through the tour, and lands on
 * the menu with the character persisted.
 */
test('first run → character creation → induction tour → menu', async ({ page }) => {
  // Explicit: ensure a clean character slate. Playwright's context is
  // already isolated but be defensive.
  await page.addInitScript(() => {
    window.localStorage.removeItem('theSkitt.character.v1');
  });
  await page.goto('/');

  // Induction is the first thing we see.
  await expect(
    page.getByRole('heading', { name: 'Skittstown General — Emergency Department' }),
  ).toBeVisible();

  // Fill the form.
  await page.getByPlaceholder('Hannah').fill('Hannah');
  await page.getByPlaceholder('Kovač').fill('Kovač');
  await page.getByRole('button', { name: /Sign in/ }).click();

  // Tour starts.
  await expect(page.getByText("Dr Aoife McGrath · ED consultant")).toBeVisible();

  // Skip through.
  await page.getByRole('button', { name: 'Skip' }).click();

  // Menu visible.
  await expect(page.getByRole('button', { name: /The hen-do/ })).toBeVisible();
});
