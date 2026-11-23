// A local stand-in for the live site and its backend, for the browser tests.
//   /…                 the repo as GitHub Pages serves it
//   /__e/…             the same files, with the register form pointed at /__api   (backend connected)
//   /__none/…          the same files, with the register form pointed nowhere     (backend not connected)
//   /__api             the real apps-script/Code.gs, running against a pretend Sheet and mailbox
//   /__state           what the pretend Sheet and mailbox now hold
//   /__reset, /__fail  start clean; make the backend unreachable
// The form's endpoint is always overwritten, whatever build.py has in REGISTER_ENDPOINT, so a test can never
// post a made-up registration to the real Sheet.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { loadBackend } = require('./gas-mock');

const ROOT = path.join(__dirname, '..', '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.css': 'text/css', '.ics': 'text/calendar' };

function start() {
  // The door PIN the browser tests use; the live one is a Script property, never in the repo.
  const fresh = () => { const b = loadBackend(); b.state.props.DOOR_PIN = '482916'; return b; };
  let backend = fresh(), posts = 0, fail = false;
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://x');
    const send = (code, body, type = 'application/json') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(body); };
    if (url.pathname === '/__reset') { backend = fresh(); posts = 0; fail = false; return send(200, '{}'); }
    if (url.pathname === '/__fail') { fail = true; return send(200, '{}'); }
    if (url.pathname === '/__state') {
      const rows = []; for (let i = 1; i <= backend.count(); i++) rows.push(backend.row(i));
      return send(200, JSON.stringify({ posts, rows, mails: backend.state.mails.map(m => ({ to: m.to, subject: m.subject })) }));
    }
    if (url.pathname === '/__api') {
      let body = '';
      req.on('data', c => { body += c; });
      req.on('end', () => {
        posts++;
        if (fail) return send(500, 'Service unavailable', 'text/plain');
        send(200, JSON.stringify({ ...backend.post(body), __contentType: req.headers['content-type'] }));
      });
      return;
    }
    if (url.pathname === '/__t/harness.html') return send(200, fs.readFileSync(path.join(__dirname, '..', 'browser', 'harness.html')), TYPES['.html']);
    let p = decodeURIComponent(url.pathname), endpoint = null;
    if (p.startsWith('/__e/')) { p = p.slice(4); endpoint = '/__api'; }
    else if (p.startsWith('/__none/')) { p = p.slice(7); endpoint = ''; }
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) return send(404, 'not found', 'text/plain');
    let data = fs.readFileSync(file);
    if (path.basename(file) === 'register.html' || path.basename(file) === 'in.html') {
      const html = data.toString('utf8');
      if (!/var ENDPOINT = '[^']*';/.test(html)) return send(500, path.basename(file) + ' has no ENDPOINT line to override', 'text/plain');
      const swapped = html.replace(/var ENDPOINT = '[^']*';/, `var ENDPOINT = '${endpoint === null ? '/__blocked' : endpoint}';`);
      data = Buffer.from(swapped);
    }
    send(200, data, TYPES[path.extname(file)] || 'application/octet-stream');
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve({ port: server.address().port, close: () => new Promise(r => server.close(r)) })));
}

module.exports = { start };
if (require.main === module) start().then(s => console.log(`http://127.0.0.1:${s.port}/__t/harness.html`));
