const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'C:/Users/THINKPAD/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const url = process.env.PRIORITY_TEST_URL || 'http://192.168.2.17:3004/';
const outputDir = 'test-assets/mobile';
const resultPath = process.env.PRIORITY_RESULTS || `${outputDir}/priority-loading-live.json`;
const schools = ['ECIAA', 'ECBI', 'ECFN', 'ECTEA', 'ECMC', 'ECQI', 'YTLC'];
fs.mkdirSync(outputDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_EXECUTABLE || 'C:/Users/THINKPAD/Documents/Codex/playwright-browsers/chromium_headless_shell-1234/chrome-headless-shell-win64/chrome-headless-shell.exe',
    headless: true,
    args: ['--no-sandbox'],
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const result = {
    url,
    date: new Date().toISOString(),
    viewport: '390x844',
    emulation: { isMobile: true, hasTouch: true, deviceScaleFactor: 3, cpuSlowdown: 4, network: 'Fast 3G, cache disabled' },
    welcomeMs: null,
    shellLogos: [],
    reactReadyMs: null,
    portalRequestedBeforeSchoolWalkthrough: false,
    mascotRequests: [],
    schoolResults: [],
    failures: [],
  };
  const testStartedAt = Date.now();
  page.on('requestfinished', request => {
    if (request.url().includes('/mascot-optimized/')) result.mascotRequests.push({ url: request.url(), atMs: Date.now() - testStartedAt });
  });
  page.on('request', request => {
    if (/PortalApp-[^/]+\.js/.test(request.url())) result.portalRequestedBeforeSchoolWalkthrough = true;
  });
  await page.addInitScript(() => {
    const record = () => {
      const root = document.documentElement;
      if (root.dataset.simapcStartup !== 'welcome' || root.dataset.simapcLogosReady !== 'true' || window.__priorityWelcomeSnapshot) return;
      window.__priorityWelcomeRecorded = true;
      const logos = [...document.querySelectorAll('#simapc-startup-logos img')].map(image => {
        const box = image.getBoundingClientRect();
        return { loaded: image.complete && image.naturalWidth > 0, x: box.x, y: box.y, right: box.right, bottom: box.bottom, width: box.width, height: box.height };
      });
      window.__priorityWelcomeSnapshot = { time: performance.now(), logos };
    };
    new MutationObserver(record).observe(document, { subtree: true, attributes: true, attributeFilter: ['data-simapc-startup', 'data-simapc-logos-ready'] });
    record();
  });
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 200000, uploadThroughput: 93750, connectionType: 'cellular3g' });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  try {
    await page.goto(url, { waitUntil: 'commit', timeout: 60000 });
    await page.locator('#simapc-startup').waitFor({ timeout: 10000 });
    await page.screenshot({ path: `${outputDir}/priority-intro-390.png` }).catch(() => {});
    await page.waitForFunction(() => !!window.__priorityWelcomeSnapshot, null, { timeout: 30000 });
    const snapshot = await page.evaluate(() => window.__priorityWelcomeSnapshot);
    result.welcomeMs = snapshot.time;
    result.shellLogos = snapshot.logos;
    await page.waitForTimeout(700);
    await page.screenshot({ path: `${outputDir}/priority-welcome-390.png` }).catch(() => {});
    const logosValid = result.shellLogos.length === 7 && result.shellLogos.every(image => image.loaded && image.x >= -1 && image.y >= -1 && image.right <= 391 && image.bottom <= 845);
    if (result.welcomeMs >= 4000) result.failures.push({ check: 'bienvenida antes de 4 s', value: result.welcomeMs });
    if (!logosValid) result.failures.push({ check: 'siete logos visibles y sin recortes', value: result.shellLogos });

    await page.locator('.institutional-landing-hero[data-assets-ready="true"]').waitFor({ timeout: 90000 });
    await page.locator('.touch-school-stage').waitFor({ timeout: 90000 });
    result.reactReadyMs = await page.evaluate(() => performance.now());

    const stage = page.locator('.touch-school-stage');
    await stage.scrollIntoViewIfNeeded();
    for (let index = 0; index < schools.length; index++) {
      const school = schools[index];
      const chip = page.locator(`.touch-school-navigation [data-school-index="${index}"]`);
      await chip.evaluate(element => element.click());
      await page.waitForFunction(code => {
        const stageElement = document.querySelector('.touch-school-stage');
        const active = stageElement?.querySelector('.touch-school-slide[aria-hidden="false"]');
        return stageElement?.getAttribute('data-school') === code && !!active?.querySelector('h2') && !!active?.querySelector('.touch-school-cta') && !!stageElement.querySelector('.touch-school-graph');
      }, school, { timeout: 10000 });
      const immediate = await page.evaluate(() => {
        const active = document.querySelector('.touch-school-slide[aria-hidden="false"]');
        const image = active?.querySelector('.touch-school-mascot img');
        return { school: document.querySelector('.touch-school-stage')?.getAttribute('data-school'), title: !!active?.querySelector('h2')?.textContent?.trim(), graph: !!document.querySelector('.touch-school-graph'), cta: !!active?.querySelector('.touch-school-cta'), mascotLoaded: !!image && image.complete && image.naturalWidth > 0 };
      });
      if (!immediate.title || !immediate.graph || !immediate.cta) result.failures.push({ check: `${school} contenido disponible sin mascota`, value: immediate });
      await page.waitForFunction(() => {
        const active = document.querySelector('.touch-school-slide[aria-hidden="false"]');
        const image = active?.querySelector('.touch-school-mascot img');
        return !!image && image.complete && image.naturalWidth > 0 && Number(getComputedStyle(active.querySelector('.touch-school-mascot')).opacity) > 0.95;
      }, null, { timeout: 30000 });
      const settled = await page.evaluate(() => {
        const active = document.querySelector('.touch-school-slide[aria-hidden="false"]');
        const image = active?.querySelector('.touch-school-mascot img');
        return { school: document.querySelector('.touch-school-stage')?.getAttribute('data-school'), title: active?.querySelector('h2')?.textContent?.trim(), mascotLoaded: !!image && image.complete && image.naturalWidth > 0, mascotOpacity: image ? getComputedStyle(active.querySelector('.touch-school-mascot')).opacity : '0' };
      });
      if (!settled.mascotLoaded) result.failures.push({ check: `${school} mascota decodificada`, value: settled });
      result.schoolResults.push({ immediate, settled });
      await page.screenshot({ path: `${outputDir}/priority-${school.toLowerCase()}-390.png` });
    }
    if (result.portalRequestedBeforeSchoolWalkthrough) result.failures.push({ check: 'portal no bloquea las escuelas', value: true });
  } catch (error) {
    result.diagnostics = await page.evaluate(() => ({
      now: performance.now(),
      startup: document.documentElement.dataset.simapcStartup,
      logosReady: document.documentElement.dataset.simapcLogosReady,
      welcomeRecorded: window.__priorityWelcomeRecorded,
      shell: document.getElementById('simapc-startup') ? getComputedStyle(document.getElementById('simapc-startup')).display : 'missing',
      logos: [...document.querySelectorAll('#simapc-startup-logos img')].map(image => ({ complete: image.complete, width: image.naturalWidth })),
    })).catch(() => null);
    result.failures.push({ check: 'flujo de carga', value: error.message });
    await page.screenshot({ path: `${outputDir}/priority-loading-error.png` }).catch(() => {});
  } finally {
    fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ welcomeMs: result.welcomeMs, reactReadyMs: result.reactReadyMs, schools: result.schoolResults.length, failures: result.failures, resultPath }, null, 2));
    await context.close();
    await browser.close();
  }
  process.exitCode = result.failures.length ? 1 : 0;
})().catch(error => { console.error(error); process.exitCode = 1; });
