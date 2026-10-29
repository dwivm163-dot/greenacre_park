const { spawn } = require('node:child_process');
const { setTimeout: delay } = require('node:timers/promises');
const server = spawn(process.execPath, ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '4174', '--strictPort'], { stdio: ['ignore', 'pipe', 'pipe'] });
let serverOutput = '';
server.stdout.on('data', chunk => { serverOutput += chunk; });
server.stderr.on('data', chunk => { serverOutput += chunk; });
async function run(file) {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file], { stdio: 'inherit', env: { ...process.env, GREENACRE_TEST_URL: 'http://127.0.0.1:4174/' } });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${file} failed (${code})`)));
  });
}
(async () => {
  try {
    let ready = false;
    for (let i = 0; i < 100; i++) {
      if (server.exitCode !== null) throw new Error(serverOutput);
      try { if ((await fetch('http://127.0.0.1:4174/')).ok) { ready = true; break; } } catch {}
      await delay(100);
    }
    if (!ready) throw new Error(`Test server did not start: ${serverOutput}`);
    await run('tests/drag.cjs');
    await run('tests/edges.cjs');
    await run('tests/sensory.cjs');
    await run('tests/layout.cjs');
    await run('tests/touch.cjs');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { server.kill('SIGTERM'); }
})();
