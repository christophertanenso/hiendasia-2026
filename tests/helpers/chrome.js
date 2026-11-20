// Runs a page in headless Chrome and returns the value of a JavaScript expression once a condition holds.
// Talks to Chrome over its DevTools protocol with Node's built-in WebSocket, so there is nothing to install.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');

function findChrome() {
  const candidates = [process.env.CHROME_BIN, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium', 'google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser'].filter(Boolean);
  for (const c of candidates) {
    if (c.includes('/')) { if (fs.existsSync(c)) return c; continue; }
    try { return execFileSync('which', [c], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (e) { /* try the next */ }
  }
  return null;
}

async function evaluateWhen(chrome, url, { until, value, timeoutMs = 90000 }) {
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'hea-chrome-'));
  const proc = spawn(chrome, ['--headless=new', '--disable-gpu', '--no-sandbox', '--no-first-run', '--no-default-browser-check',
    '--user-data-dir=' + profile, '--window-size=900,1000', '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let ws;
  try {
    const wsUrl = await new Promise((resolve, reject) => {
      let err = '';
      const timer = setTimeout(() => reject(new Error('Chrome did not start: ' + err.slice(0, 300))), 20000);
      proc.stderr.on('data', d => { err += d; const m = err.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(timer); resolve(m[1]); } });
      proc.on('exit', code => { clearTimeout(timer); reject(new Error('Chrome exited early (' + code + '): ' + err.slice(0, 300))); });
    });
    ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = () => reject(new Error('could not connect to Chrome')); });
    let id = 0;
    const waiting = new Map();
    ws.onmessage = ev => {
      const msg = JSON.parse(ev.data);
      if (msg.id && waiting.has(msg.id)) { const { resolve, reject } = waiting.get(msg.id); waiting.delete(msg.id); msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result); }
    };
    const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
      waiting.set(++id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
    const { targetId } = await send('Target.createTarget', { url });
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    const evaluate = async expression => (await send('Runtime.evaluate', { expression, returnByValue: true }, sessionId)).result.value;
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      if (await evaluate(until).catch(() => false)) return await evaluate(value);
      if (Date.now() > deadline) throw new Error('timed out waiting for the page; it shows: ' + await evaluate('document.title + " | " + Object.keys(window.RESULTS || {}).join(",")').catch(() => '?'));
      await new Promise(r => setTimeout(r, 100));
    }
  } finally {
    try { if (ws) ws.close(); } catch (e) { /* closing */ }
    proc.kill();
    await new Promise(r => { if (proc.exitCode !== null) r(); else { proc.on('exit', r); setTimeout(r, 3000); } });
    fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
  }
}

module.exports = { findChrome, evaluateWhen };
