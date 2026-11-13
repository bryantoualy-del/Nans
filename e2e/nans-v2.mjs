import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium, devices, webkit } from 'playwright';

const root = process.cwd();
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp' };
const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    const file = resolve(root, '.' + url.pathname.replace(/\/$/, '/index.html'));
    if (!file.startsWith(root + '/')) throw Error('Outside repository');
    const data = await readFile(file);
    response.setHeader('Content-Type', types[extname(file)] || 'application/octet-stream');
    response.end(data);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const base = 'http://127.0.0.1:' + server.address().port;
const isWebKit = process.env.E2E_BROWSER === 'webkit';
let browser;

try {
  browser = await (isWebKit ? webkit.launch() : chromium.launch({
    executablePath: process.env.E2E_CHROMIUM_PATH,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  }));

  const profiles = [
    ['iPad Air 5', { ...devices['iPad Air landscape'], viewport: { width: 1180, height: 820 } }],
    ['iPhone 15', devices['iPhone 15']]
  ];
  for (const [name, profile] of profiles) {
    const page = await browser.newPage({ ...profile, reducedMotion: 'reduce', deviceScaleFactor: 1 });
    page.setDefaultTimeout(6000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await page.locator('#cc-turnbar-standard').waitFor();

    const state = () => page.evaluate(() => window.__CompanionBridge.read());
    const visible = async selector => assert(await page.locator(selector).isVisible(), selector);
    const noOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth === innerWidth));
    const click = selector => page.locator(selector).click();
    const result = () => page.evaluate(() => {
      document.querySelector('[aria-label="Fermer ce résultat"]')?.click();
      if (typeof collapseRibbon === 'function') collapseRibbon();
    });
    const next = async () => { await result(); await click('.cc-turn-next'); };
    const subtab = key => click('[data-combat-tab=' + key + ']');
    const strike = async (selector = '#attackBtn', hit = true, die = '13') => {
      await result();
      if (die) await page.locator('#manualRoll').fill(die);
      await click(selector);
      await click(hit ? '#hitYes' : '#hitNo');
      await result();
    };
    const rest = async kind => {
      await result();
      await click('.cc-turn-rest:' + (kind === 'short' ? 'nth-last-child(2)' : 'last-child'));
      await click('.companion-rest-go');
      await result();
    };

    await noOverflow();
    await visible('#acText');
    await visible('#quickRageBtn');
    await visible('#chargeAxeBtn');
    await visible('#ancBtn');
    assert.equal(await page.locator('#hornStateBadge').textContent(), '3 / 5 charges');
    assert.equal(await page.locator('#acText input').inputValue(), '18');
    const volto = await page.locator('#voltoSection').boundingBox();
    const rage = await page.locator('#barbarianDrive').boundingBox();
    const vial = await page.locator('.volto-meter').boundingBox();
    if (name.startsWith('iPad')) {
      assert(volto.x + volto.width <= rage.x && Math.abs(volto.y - rage.y) < 3);
      assert(Math.abs(vial.x - rage.x) < 3 && vial.y >= rage.y + rage.height);
    } else {
      assert(rage.y >= volto.y + volto.height && vial.y >= rage.y + rage.height);
    }

    await click('#quickRageBtn');
    assert.equal((await state()).rages, 3);
    await strike('#attackBtn', false);
    assert.equal((await state()).hits, 0);
    await strike();
    assert.equal((await state()).attacksLeft, 0);
    for (let turn = 0; turn < 2; turn++) {
      await next();
      await strike();
      await strike();
    }
    assert.equal((await state()).hits, 5);
    await click('#chargeAxeBtn');
    await result();
    assert.equal((await state()).stored, 'red');
    assert.equal((await state()).mode, 'axe');
    assert.equal(await page.locator('#acText input').inputValue(), '16');
    assert.equal(await page.locator('#modeSwitch').isDisabled(), true);

    await page.reload();
    assert.equal((await state()).storedCount, 5);
    assert.equal((await state()).raging, true);
    await next();
    await strike('#impactBtn');
    assert.equal((await state()).stored, 'none');
    await click('#swordName');
    assert.equal((await state()).mode, 'sword');
    await next();
    await strike('#attackBtn', true, null);
    await click('.charge-reset');
    assert.equal((await state()).hits, 0);
    await rest('short');
    assert.equal((await state()).rages, 3);

    await subtab('horn');
    const powers = [
      ["button[onclick^=\"hornPower('rally'\"]", 1, 'bonus'],
      ["button[onclick^=\"hornPower('crash'\"]", 1, 'action'],
      ['#howlBtn', 2, 'action'],
      ['#ancBtn', 3, 'action']
    ];
    for (const [selector, cost, economy] of powers) {
      await click('.horn-recharge');
      assert.equal((await state()).horn, 5);
      await click(selector);
      await result();
      const after = await state();
      assert.equal(after.horn, 5 - cost);
      assert.equal(after.eco[economy], true);
      if (selector === '#ancBtn') assert.equal(after.ancReady, false);
      await next();
    }
    await click('.horn-temptation button');
    await result();
    await rest('long');
    assert.equal((await state()).horn, 5);
    assert.equal((await state()).ancReady, true);
    assert.equal((await state()).rages, 4);
    assert.equal((await state()).turn, 1);

    await subtab('resources');
    await visible('#ragePips');
    await subtab('defense');
    await visible('#incomingDamage');
    await click('[data-v3-tab=social]');
    await visible('#v3-social');
    await click('[data-v3-tab=notes]');
    await click('[data-v3-note-tab=notes]');
    await click('[data-v3-note-tab=mechanical]');
    assert.equal(await page.locator('#log').count(), 1);
    await visible('#v3-log-slot [data-unified-companion]');
    await click('nav.tabs [data-rpg-group-tab]');
    await visible('#rpgGroupView [data-edit-self]');
    await click('nav.tabs [data-tab=combat]');
    await click('#nans-connect-slot .rpg-connect-launch');
    await visible('.rpg-connect-panel');
    await click('[data-rpg-tab=mode]');
    await visible('[data-free-toggle]');
    await page.locator('[data-free-toggle]').check();
    assert.equal(await page.evaluate(() => window.RPGResolution.free()), true);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('.rpg-connect-panel').isVisible(), false);
    await visible('#nans-connect-slot .rpg-connect-launch');
    const snapshot = await page.evaluate(() => ({
      id: window.CompanionAPI.getCharacter().id,
      connected: window.RPGConnect.getStatus().connected,
      mode: window.__CompanionBridge.custom(window.__CompanionBridge.read()).volto.mode
    }));
    assert.deepEqual(snapshot, { id: 'nans', connected: false, mode: 'sword' });
    await page.evaluate(() => window.RPGTable.accept('table-free', 'recette-locale'));
    assert.equal(await page.evaluate(() => window.RPGConnect.getStatus().sessionMode), 'table-free');
    await next();
    await strike('#attackBtn', false);
    assert(await page.evaluate(() => window.RPGTable.entries().some(row => row.kind === 'miss')));
    await noOverflow();
    assert.deepEqual(errors, []);
    console.log(name + ' · combat, économie, ressources, Cor, sauvegarde et intégration locale OK');
    await page.close();
  }
} finally {
  await browser?.close();
  await new Promise(ok => server.close(ok));
}
