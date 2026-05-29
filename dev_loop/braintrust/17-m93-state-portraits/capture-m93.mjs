#!/usr/bin/env node
// M93 capture script — boots the served build, navigates into the
// encounter screen for two target cases, and snapshots the patient
// panel area showing the new bay-monitor frame + state-responsive
// portrait.
//
// Usage: vite preview must be running on :4173.
//   npm run build && npm run preview &
//   node dev_loop/braintrust/17-m93-state-portraits/capture-m93.mjs --tag after
//
// `--tag <tag>` writes to /tmp/skitt-m93/{tag}-*.png so we can run it
// twice — once on the pre-M93 build (before) and once on the post-M93
// build (after) — for a side-by-side review.

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: { tag: { type: 'string', default: 'after' } },
});
const TAG = values.tag;
const OUT = '/tmp/skitt-m93';
mkdirSync(OUT, { recursive: true });

async function captureCase(page, label, openInstructions) {
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Click today's card in the rota
  const todayCard = page.locator('button.menu__card--today');
  if (await todayCard.count()) {
    await todayCard.click();
    await page.waitForTimeout(1200);
  }

  // Run the per-case instructions (which patient to click on the board)
  await openInstructions(page);

  // Wait for the encounter screen to settle
  await page.waitForTimeout(1200);

  // Full-page snapshot — the bay-monitor frame is in the top-right
  // patient panel; reviewer sees it in the broader UI context.
  const fullPath = `${OUT}/${TAG}-${label}-full.png`;
  await page.screenshot({ path: fullPath, fullPage: false });
  console.log(fullPath);

  // Cropped snapshot — just the patient panel area, scaled for a
  // clear view of the scanlines, vignette, and corner label chip.
  const panel = page.locator('.patient-panel').first();
  if (await panel.count()) {
    const cropPath = `${OUT}/${TAG}-${label}-panel.png`;
    await panel.screenshot({ path: cropPath });
    console.log(cropPath);
  }
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    args: ['--no-sandbox'],
  });
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await ctx.newPage();
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('CONSOLE-ERROR:', msg.text());
  });

  // Seed an inducted character so the menu doesn't gate us on the
  // induction flow.
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'theSkitt.character.v1',
        JSON.stringify({
          firstName: 'Sam',
          lastName: 'Carter',
          role: 'Registrar',
          inducted: true,
          createdIso: new Date().toISOString(),
        }),
      );
    } catch {}
  });

  // Case 1 — Beth (anaphylaxis adult, starts at triaged).
  await captureCase(page, '01-beth-triaged', async (p) => {
    const beth = p.getByRole('button', { name: /beth|peanut|anaphylaxis/i }).first();
    if (await beth.count()) {
      await beth.click();
    } else {
      // Fallback: just click the first card on the board.
      await p.locator('button.board__card-btn').first().click();
    }
  });

  // Case 2 — Marcus (DKA, starts at deteriorating).
  await captureCase(page, '02-marcus-deteriorating', async (p) => {
    const marcus = p.getByRole('button', { name: /marcus|dka/i }).first();
    if (await marcus.count()) {
      await marcus.click();
    } else {
      await p.locator('button.board__card-btn').nth(1).click();
    }
  });

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
