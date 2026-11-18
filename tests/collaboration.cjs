const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const { chromium } = require('playwright');

const frontend = 'http://127.0.0.1:4175';
const backend = 'http://127.0.0.1:3002';
const children = [];
function start(args, env) {
  const child = spawn(process.execPath, args, { env: { ...process.env, ...env }, stdio: ['inherit', 'inherit', 'inherit', 'ipc'] });
  children.push(child);
  return child;
}
async function waitForServer(url, child) {
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null) throw new Error(`Server exited for ${url}`);
    try { if ((await fetch(url)).ok) return; } catch {}
    await delay(100);
  }
  throw new Error(`Server did not start at ${url}`);
}

const object = (page, kind = 'physical') => page.locator(`.${kind}-panel [data-object-id="central_seating_01"]`);
const position = (page, kind) => object(page, kind).evaluate(el => [el.style.left, el.style.top]);
const profile = page => page.locator('.atmosphere-profile h3, .atmosphere-description, meter').allTextContents();
const paths = page => page.locator('[data-route-id]').evaluateAll(routes => routes.map(route => route.getAttribute('d')));
const presence = (page, count) => page.getByRole('status').filter({ hasText: `${count} online` }).waitFor();
const activity = (page, text) => page.locator('.park-activity').getByText(text, { exact: false }).waitFor();

async function grab(page) {
  await object(page).focus();
  const point = await object(page).evaluate(element => {
    const img = element.querySelector('img');
    const rect = element.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const scale = Math.min(rect.width / canvas.width, rect.height / canvas.height);
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        if (data[(y * canvas.width + x) * 4 + 3] > 200) return {
          x: rect.x + (rect.width - canvas.width * scale) / 2 + (x + .5) * scale,
          y: rect.y + (rect.height - canvas.height * scale) / 2 + (y + .5) * scale,
        };
      }
    }
    throw new Error('No opaque seating pixel');
  });
  await page.mouse.move(point.x, point.y, { steps: 4 });
  await page.mouse.down();
  return point;
}

(async () => {
  let browser;
  try {
    // Close the latest Engine.IO connection from the test process, independently
    // of whether the browser is using polling or WebSocket.
    const api = start(['--input-type=module', '--eval', `
      import { io } from './server/index.js';
      process.on('message', () => [...io.sockets.sockets.values()].at(-1)?.conn.close());
    `], { PORT: '3002', CLIENT_ORIGINS: frontend });
    const site = start(['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4175', '--strictPort'], { VITE_SOCKET_URL: backend });
    await Promise.all([waitForServer(`${backend}/health`, api), waitForServer(frontend, site)]);
    const rejected = await fetch(`${backend}/socket.io/?EIO=4&transport=polling`, {
      headers: { Origin: 'https://unlisted.example' },
    });
    assert.equal(rejected.status, 403);

    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const errors = [];
    async function open(width) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      page.setDefaultTimeout(8000);
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(frontend);
      await page.evaluate(() => Promise.all([...document.images].map(img => img.decode())));
      return page;
    }
    const first = await open(1600);
    const second = await open(1200);
    await Promise.all([presence(first, 2), presence(second, 2)]);
    const initial = await position(second);
    const initialPaths = await paths(second);

    const point = await grab(first);
    await second.locator('.is-remotely-held[data-object-id="central_seating_01"]').waitFor();
    await second.locator('.remote-cursor').getByText('Visitor 1').waitFor();
    await first.mouse.move(point.x + 30, point.y + 24, { steps: 7 });
    await second.waitForFunction(start => document.querySelector('.physical-panel [data-object-id="central_seating_01"]').style.left !== start, initial[0]);
    const moved = await position(first);
    await second.waitForFunction(expected => {
      const element = document.querySelector('.physical-panel [data-object-id="central_seating_01"]');
      return element.style.left === expected[0] && element.style.top === expected[1];
    }, moved);
    assert.deepEqual(await position(second, 'ambience'), moved);
    assert.notDeepEqual(await paths(second), initialPaths);

    const blocked = await grab(second);
    await second.mouse.move(blocked.x + 30, blocked.y + 10);
    await second.mouse.up();
    await second.getByRole('button', { name: 'Evening', exact: true }).click();
    await first.locator('button[aria-label="Evening"][aria-pressed="true"]').waitFor();
    assert.deepEqual(await position(second), moved);
    assert.deepEqual(await profile(second), await profile(first));
    await second.getByRole('checkbox', { name: 'Traffic Noise' }).click();
    await Promise.all([first, second].map(page =>
      page.locator('input[aria-label="Traffic Noise"]:not(:checked)').waitFor()));
    assert.deepEqual(await profile(second), await profile(first));

    // Closing the editor mid-drag keeps its last accepted position and frees the object.
    await first.close();
    await presence(second, 1);
    await second.locator('.is-remotely-held').waitFor({ state: 'detached' });
    await second.locator('.remote-cursor').waitFor({ state: 'detached' });
    await activity(second, 'Visitor 1 moved a seating group');
    const third = await open(390);
    await presence(third, 2);
    assert.deepEqual(await position(third), await position(second));
    assert.deepEqual(await profile(third), await profile(second));
    await activity(third, 'changed the time to evening');

    api.send('disconnect latest visitor');
    await third.getByRole('status').filter({ hasText: 'Visitor 4 (you)' }).waitFor();
    assert.deepEqual(await position(third), await position(second));
    assert.deepEqual(await profile(third), await profile(second));

    await object(second).focus();
    const beforeKeys = await position(second);
    await second.keyboard.press('ArrowRight');
    await second.keyboard.press('ArrowRight');
    await third.waitForFunction(expected =>
      Math.abs(parseFloat(document.querySelector('.physical-panel [data-object-id="central_seating_01"]').style.left) - expected) < 0.0002,
    parseFloat(beforeKeys[0]) + 600 / 1658, { timeout: 4000 }).catch(async error => {
      throw new Error(`Keyboard positions started at ${beforeKeys}, then second was ${await position(second)} and third was ${await position(third)}`, { cause: error });
    });
    await third.getByRole('button', { name: 'Reset Arrangement' }).click();
    await second.locator('button[aria-label="Afternoon"][aria-pressed="true"]').waitFor();
    assert.deepEqual(await position(second), initial);
    assert.deepEqual(await paths(second), initialPaths);
    assert.equal(await second.getByRole('checkbox', { name: 'Traffic Noise' }).isChecked(), true);
    assert.deepEqual(errors, []);
    console.log('PASS live collaboration, drag ownership, presence, cursors, shared atmosphere, late join, reconnect, reset, and origin filtering');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await browser?.close();
    for (const child of children) child.kill();
  }
})();
