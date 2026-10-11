// Additional notch/home-indicator checks; run against the same production build as mobile-audit.cjs.
const fs = require('node:fs');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/THINKPAD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const executablePath = process.env.CHROMIUM_EXECUTABLE || 'C:/Users/THINKPAD/Documents/Codex/playwright-browsers/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe';
const url = process.env.MOBILE_TEST_URL || 'http://127.0.0.1:4173/';
const cases = [
  { width: 390, height: 844, insets: { top: 44, bottom: 34, left: 0, right: 0 } },
  { width: 375, height: 667, insets: { top: 44, bottom: 34, left: 0, right: 0 } },
  { width: 844, height: 390, insets: { top: 0, bottom: 21, left: 44, right: 44 } },
];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function swipe(cdp, width, height) {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: width * .75, y: height * .65 }] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: width * .75, y: height * .65 - Math.min(180, height * .3) * i / 10 }] });
    await sleep(20);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
let browser;
(async () => {
  browser = await chromium.launch({ executablePath, headless: true, args: ['--no-sandbox'] });
  const results = [];
  for (const test of cases) {
    const context = await browser.newContext({ viewport: { width: test.width, height: test.height }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const page = await context.newPage(), cdp = await context.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: test.insets });
    await page.goto(url);
    await page.waitForSelector('.institutional-landing-hero[data-assets-ready="true"]');
    await page.waitForSelector('.institutional-landing.is-done');
    const record = { ...test, schools: [] };
    for (let index = 0; index < 7; index++) {
      await swipe(cdp, test.width, test.height);
      await page.waitForFunction(index => document.querySelector('.touch-school-stage')?.getAttribute('data-active-index') === String(index), index);
      await page.waitForTimeout(index === 0 ? 1100 : 430);
      record.schools.push(await page.evaluate(({ insets, width, height }) => {
        const rect = selector => { const b = document.querySelector(selector).getBoundingClientRect(); return { x: b.x, y: b.y, right: b.right, bottom: b.bottom }; };
        const active = '.touch-school-slide[aria-hidden="false"]';
        const title = rect(`${active} h2`), mascot = rect(`${active} .touch-school-mascot`), cta = rect(`${active} button`);
        const brand = rect('.institutional-landing-brand-logo'), rail = rect('.touch-school-navigation'), stage = rect('.touch-school-stage');
        const overlap = (a,b) => a.x < b.right - 1 && a.right > b.x + 1 && a.y < b.bottom - 1 && a.bottom > b.y + 1;
        const pass = document.scrollingElement.scrollWidth <= innerWidth && Math.abs(stage.y) < 1 && brand.y >= insets.top && brand.bottom <= rail.y && cta.x >= Math.max(16, insets.left) - 1 && cta.right <= width - Math.max(16, insets.right) + 1 && cta.bottom <= height - insets.bottom && !overlap(title, mascot) && !overlap(title, cta) && !overlap(mascot, cta);
        return { school: document.querySelector('.touch-school-stage').getAttribute('data-school'), pass, title, mascot, cta, brand, rail, stage };
      }, test));
    }
    results.push(record);
    await page.screenshot({ path: `test-assets/mobile/${test.width}x${test.height}-safe-area.png` });
    await context.close();
  }
  const reducedContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3, reducedMotion: 'reduce' });
  const reducedPage = await reducedContext.newPage();
  await reducedPage.goto(url);
  await reducedPage.waitForSelector('.research-stage-selection.is-static');
  await reducedPage.waitForSelector('.institutional-landing-hero[data-assets-ready="true"]');
  await reducedPage.waitForTimeout(250);
  const reduced = await reducedPage.evaluate(() => ({
    staticCards: document.querySelectorAll('.research-stage-school-card').length,
    animatedStages: document.querySelectorAll('.touch-school-stage').length,
    animations: document.getAnimations().filter(a => a.playState === 'running').length,
    overflow: document.scrollingElement.scrollWidth > innerWidth,
  }));
  reduced.pass = reduced.staticCards === 7 && reduced.animatedStages === 0 && reduced.animations === 0 && !reduced.overflow;
  await reducedContext.close();
  fs.writeFileSync('test-assets/mobile/safe-area-measurements.json', JSON.stringify({ cases: results, reduced }, null, 2));
  console.log(JSON.stringify(results.map(r => ({ size: `${r.width}x${r.height}`, pass: r.schools.every(s => s.pass), failures: r.schools.filter(s => !s.pass) })), null, 2));
  console.log(JSON.stringify({ reduced }, null, 2));
  process.exitCode = results.every(r => r.schools.every(s => s.pass)) && reduced.pass ? 0 : 1;
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => browser?.close());
