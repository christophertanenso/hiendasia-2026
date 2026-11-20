// The generated site: every language has its register page, the copy is complete, and the pages agree with the
// backend on consent wording, validation rules and the QR code.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { loadBackend } = require('./helpers/gas-mock');

const ROOT = path.join(__dirname, '..');
const LANGS = ['en', 'zh-Hans', 'zh-Hant', 'id', 'ms', 'fil', 'th', 'vi'];
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');
const dir = l => (l === 'en' ? '' : l + '/');
const i18n = Object.fromEntries(LANGS.map(l => [l, JSON.parse(read(`i18n/${l}.json`))]));
const code = read('apps-script/Code.gs');
const block = (src, tag) => { const m = src.match(new RegExp(`// <${tag}>\\n([\\s\\S]*?)// </${tag}>`)); return m ? m[1].trim() : null; };
const text = html => html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ');
const GENERATED = [...LANGS.flatMap(l => [dir(l) + 'index.html', dir(l) + 'register.html']), 'privacy.html', 'artifact.html', 'hiendasia-2026.ics'];
const hashAll = () => GENERATED.map(f => crypto.createHash('sha1').update(fs.readFileSync(path.join(ROOT, f))).digest('hex')).join();

describe('build', () => {
  it('leaves the committed pages unchanged when run (they are up to date with their sources)', () => {
    const before = hashAll();
    execFileSync('python3', ['build.py'], { cwd: ROOT, stdio: 'pipe' });
    assert.equal(hashAll(), before, 'generated pages were stale: build.py has now refreshed them, review and commit');
  });
  it('points the form at a Google Apps Script web app, or nowhere yet', () => {
    const m = read('build.py').match(/^REGISTER_ENDPOINT = '([^']*)'/m);
    assert.ok(m, 'REGISTER_ENDPOINT not found');
    assert.match(m[1], /^$|^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/);
  });
});

describe('translations', () => {
  const regKeys = Object.keys(i18n.en).filter(k => k.startsWith('reg.'));
  it('has registration copy in English', () => { assert.ok(regKeys.length >= 35); });
  for (const l of LANGS) {
    it(`${l}: has every registration string`, () => {
      const missing = regKeys.filter(k => typeof i18n[l][k] !== 'string' || i18n[l][k].trim() === '');
      assert.deepEqual(missing, []);
    });
    it(`${l}: consent names both HiEnd Asia and NOWASIA`, () => {
      assert.ok(i18n[l]['reg.consent'].includes('HiEnd Asia') && i18n[l]['reg.consent'].includes('NOWASIA'));
    });
    it(`${l}: consent names WhatsApp`, () => { assert.ok(i18n[l]['reg.consent'].includes('WhatsApp')); });
  }
  for (const l of LANGS.filter(x => x !== 'en')) {
    it(`${l}: registration copy is translated, not left in English`, () => {
      const same = ['reg.h', 'reg.lead', 'reg.submit', 'reg.consent', 'reg.err.name', 'reg.done.h'].filter(k => i18n[l][k] === i18n.en[k]);
      assert.deepEqual(same, []);
    });
  }
  it('has no placeholder left in any string', () => {
    const bad = LANGS.flatMap(l => Object.entries(i18n[l]).filter(([, v]) => /\{\{|\}\}|TODO|TBD/.test(v)).map(([k]) => l + ':' + k));
    assert.deepEqual(bad, []);
  });
});

describe('the old walk-in promise is gone', () => {
  const OLD = ['No tickets needed', 'no tickets needed', 'Walk in any day', '无需门票', '無需門票', 'Tanpa tiket', 'tanpa tiket', 'Tiada tiket',
    'tiada tiket', 'Hindi kailangan ng tiket', 'hindi kailangan ng tiket', 'walang tiket', 'ไม่ต้องใช้บัตร', 'Không cần vé', 'không cần vé', 'needs no registration'];
  for (const f of [...GENERATED, 'build.py', 'README.md', ...LANGS.map(l => `i18n/${l}.json`)]) {
    it(f, () => { assert.deepEqual(OLD.filter(p => read(f).includes(p)), []); });
  }
});

describe('show pages', () => {
  for (const l of LANGS) {
    const html = read(dir(l) + 'index.html');
    it(`${l}: header, hero and mobile bar link to the register page`, () => {
      assert.match(html, /class="[^"]*head-cta[^"]*" href="register\.html"/, 'header');
      assert.match(html, /<p class="free">[\s\S]*?<div class="btns">\s*<a class="btn btn-primary" href="register\.html"/, 'hero');
      assert.match(html, /<div class="mbar" id="mbar">\s*<a [^>]*href="register\.html"/, 'mobile bar');
    });
    it(`${l}: says a ticket is required`, () => { assert.ok(text(html).includes(i18n[l]['free.hero'])); });
    it(`${l}: its register link resolves to a page that exists`, () => { assert.ok(fs.existsSync(path.join(ROOT, dir(l), 'register.html'))); });
  }
});

describe('register pages', () => {
  const consentEn = loadBackend().gs.CONSENT_TEXT[loadBackend().gs.CONFIG.CONSENT_VERSION];
  it('English consent on the page is word for word what the backend records', () => {
    assert.equal(i18n.en['reg.consent'], consentEn);
    assert.ok(text(read('register.html')).includes(consentEn));
  });
  for (const l of LANGS) {
    const html = read(dir(l) + 'register.html');
    const t = text(html);
    it(`${l}: is marked as that language`, () => { assert.match(html, new RegExp(`<html lang="${l}">`)); });
    it(`${l}: has no unfilled template token`, () => { assert.ok(!html.includes('{{')); });
    it(`${l}: shows the consent statement`, () => { assert.ok(t.includes(i18n[l]['reg.consent'])); });
    it(`${l}: consent sits after the submit button, inside the form`, () => {
      const form = html.slice(html.indexOf('<form'), html.indexOf('</form>'));
      assert.ok(form.indexOf('id="submitBtn"') > 0 && form.indexOf('class="consent"') > form.indexOf('id="submitBtn"'));
    });
    it(`${l}: links the consent to the registration section of the privacy notice`, () => {
      assert.ok(html.includes(`href="${l === 'en' ? '' : '../'}privacy.html#registration"`));
    });
    it(`${l}: asks for name, email and mobile, all required`, () => {
      for (const id of ['f-name', 'f-email', 'f-phone']) assert.match(html, new RegExp(`<input[^>]*id="${id}"[^>]*required`));
    });
    it(`${l}: offers exactly visitor, trade and media`, () => {
      assert.deepEqual([...html.matchAll(/name="interest"[^>]*value="(\w+)"/g)].map(m => m[1]), ['visitor', 'trade', 'media']);
    });
    it(`${l}: preselects no attendance type`, () => {
      assert.ok(!/<input[^>]*name="interest"[^>]*\schecked/.test(html.slice(html.indexOf('<form'), html.indexOf('</form>'))));
    });
    it(`${l}: asks for nothing beyond the agreed fields`, () => {
      const names = [...html.slice(html.indexOf('<form'), html.indexOf('</form>')).matchAll(/<(?:input|select|textarea)[^>]*\sname="([\w-]+)"/g)].map(m => m[1]);
      assert.deepEqual([...new Set(names)].sort(), ['email', 'interest', 'name', 'phone', 'website']);
    });
    it(`${l}: has a label for every field`, () => {
      for (const id of ['f-name', 'f-email', 'f-phone', 'i-visitor', 'i-trade', 'i-media']) assert.ok(html.includes(`for="${id}"`), id);
    });
    it(`${l}: helps the browser autofill`, () => {
      assert.match(html, /id="f-name"[^>]*autocomplete="name"/);
      assert.match(html, /id="f-email"[^>]*autocomplete="email"/);
      assert.match(html, /id="f-phone"[^>]*autocomplete="tel-national"/);
    });
    it(`${l}: uses 16px inputs so iPhones do not zoom in`, () => { assert.match(html, /\.in \{[^}]*font: 16px/); });
    it(`${l}: shows the logo and this year's poster`, () => {
      const p = l === 'en' ? '' : '../';
      assert.ok(html.includes(`src="${p}img/logo.svg"`) && html.includes(`src="${p}img/000-1242.webp"`));
    });
    it(`${l}: every local image it references exists`, () => {
      const files = [...html.matchAll(/(?:src|href)="((?:\.\.\/)?(?:img|fonts)\/[^"]+)"/g)].map(m => m[1]);
      assert.deepEqual(files.filter(f => !fs.existsSync(path.join(ROOT, dir(l), f))), []);
    });
    it(`${l}: lists all eight languages in its menu`, () => {
      assert.equal((html.match(/<option value="[\w-]+" lang=/g) || []).length, 8);
    });
    it(`${l}: carries the same validation rules as the backend`, () => {
      assert.ok(block(code, 'validate') && html.includes(block(code, 'validate')));
    });
    it(`${l}: carries the same QR code generator as the backend`, () => {
      assert.ok(block(code, 'qr') && html.includes(block(code, 'qr')));
    });
    it(`${l}: loads no analytics script before consent`, () => {
      assert.ok(!/<script[^>]+src=/.test(html));
      assert.match(html, /analytics_storage: 'denied'/);
    });
    it(`${l}: keeps the bot trap out of sight and out of the tab order`, () => {
      assert.match(html, /<div class="trap" aria-hidden="true">/);
      assert.match(html, /id="f-website"[^>]*tabindex="-1"/);
    });
    it(`${l}: has alternate links to the other languages`, () => {
      assert.equal((html.match(/<link rel="alternate" hreflang=/g) || []).length, 9);
    });
  }
});

describe('privacy notice', () => {
  const html = read('privacy.html'), t = text(html);
  it('has the section the form links to', () => { assert.ok(html.includes('id="registration"')); });
  const says = (name, re) => it(name, () => assert.match(t, re));
  says('lists the four things asked for', /full name , email address , mobile number .* visitor, trade or media/);
  says('says news is sent by email and WhatsApp', /news of HiEnd Asia and NOWASIA, by email and by WhatsApp/);
  says('promises no telephone calls', /We do not telephone you/);
  says('promises not to sell details', /We do not sell your details/);
  says('explains how to unsubscribe', /unsubscribe link/);
  says('gives a 30-day deadline for opt-outs', /within 30 days/);
  says('names who holds the data', /Google Sheets .* Enso Consult/);
  says('discloses the IP country lookup', /country\.is/);
  says('states the retention period', /review the list every two years/);
  says('names the data protection contact', /michelle@hiendasia\.com/);
  says('lists the ticket kept on the device', /hea-ticket/);
});

describe('entrance sign', () => {
  it('exists with its QR code', () => {
    assert.ok(fs.existsSync(path.join(ROOT, 'signage/register.html')) && fs.existsSync(path.join(ROOT, 'signage/qr/register.svg')));
  });
});
