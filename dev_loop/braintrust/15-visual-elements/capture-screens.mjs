import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const OUT = '/tmp/skitt-screens';
mkdirSync(OUT, { recursive: true });

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

  await page.addInitScript(() => {
    try {
      window.localStorage.setItem(
        'theSkitt.character.v1',
        JSON.stringify({
          firstName: 'Sam', lastName: 'Carter', role: 'Registrar',
          inducted: true, createdIso: new Date().toISOString(),
        }),
      );
    } catch {}
  });

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/01-menu-rota.png`, fullPage: true });
  console.log('01-menu-rota');

  const todayCard = page.locator('button.menu__card--today');
  if (await todayCard.count()) {
    await todayCard.click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${OUT}/02-shift-board.png`, fullPage: true });
    console.log('02-shift-board');

    const firstPatient = page.locator('button.board__card-btn').first();
    if (await firstPatient.count()) {
      await firstPatient.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: `${OUT}/03-encounter-history.png`, fullPage: true });
      console.log('03-encounter-history');

      const tabs = ['Examination', 'Differential', 'Management', 'Disposition'];
      for (let i = 0; i < tabs.length; i++) {
        const tab = page.getByRole('button', { name: tabs[i] });
        if (await tab.count()) {
          await tab.first().click();
          await page.waitForTimeout(400);
          const idx = String(4 + i).padStart(2, '0');
          await page.screenshot({
            path: `${OUT}/${idx}-encounter-${tabs[i].toLowerCase()}.png`,
            fullPage: true,
          });
          console.log(`${idx}-encounter-${tabs[i].toLowerCase()}`);
        }
      }

      const backBtn = page.getByRole('button', { name: /board/i }).first();
      if (await backBtn.count()) {
        await backBtn.click();
        await page.waitForTimeout(500);
      }
    }

    const hubBtn = page.getByRole('button', { name: /department view/i });
    if (await hubBtn.count()) {
      await hubBtn.click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: `${OUT}/08-department-hub.png`, fullPage: true });
      console.log('08-department-hub');
    }
  }

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const eportfolioBtn = page.getByRole('button', { name: /e-portfolio/i }).first();
  if (await eportfolioBtn.count()) {
    await eportfolioBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/09-eportfolio.png`, fullPage: true });
    console.log('09-eportfolio');
  }

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const skillTreeBtn = page.getByRole('button', { name: /skill tree/i }).first();
  if (await skillTreeBtn.count()) {
    await skillTreeBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/10-skill-tree.png`, fullPage: true });
    console.log('10-skill-tree');
  }

  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const ecgBtn = page.getByRole('button', { name: /ecg challenge/i }).first();
  if (await ecgBtn.count()) {
    await ecgBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: `${OUT}/11-ecg-drill.png`, fullPage: true });
    console.log('11-ecg-drill');
  }

  await page.goto('http://localhost:4173/?style-guide=1', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${OUT}/12-asset-library.png`, fullPage: true });
  console.log('12-asset-library');

  await page.evaluate(() => window.localStorage.removeItem('theSkitt.character.v1'));
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/13-induction.png`, fullPage: true });
  console.log('13-induction');

  await browser.close();
}

main().catch((err) => { console.error(err); process.exit(1); });
