// Do the tests still bite? Breaks the code in one specific way at a time, runs the suite, and expects it to fail.
// A change that survives means a behaviour is no longer protected by any test.
//   node tests/mutation.js            every mutation (a few minutes)
//   node tests/mutation.js honeypot   only mutations whose name contains "honeypot"
// Files are changed in place and always restored, including on Ctrl-C.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..');
const GS = 'apps-script/Code.gs', PAGE = 'register.tpl.html', SHOW = 'page.tpl.html', BUILD = 'build.py';
const MUTATIONS = [
  ['door accepts any PIN', GS, "if (String(d.pin == null ? '' : d.pin).trim() !== String(pin).trim()) {", 'if (false) {'],
  ['door counts a double scan', GS, 'if (visits && last && now - new Date(last) < DOOR_REPEAT_MS) { out.repeat = true; return out; }', ''],
  ['door never locks after wrong PINs', GS, "if (fails >= DOOR_MAX_FAILS) return { ok: false, error: 'locked' };", ''],
  ['door QR holds only the ticket number', GS, "return site + 'in.html?t=' + encodeURIComponent(ticket);", 'return ticket;'],
  ['door page checks in without a PIN', 'in.tpl.html', 'if (getPin()) checkIn(); else visitor();', 'checkIn();'],
  ['bot trap ignored', GS, "if (clean_(d.website, 50)) return { ok: true, resent: true };", ''],
  ['Singapore landlines accepted', GS, "/^[89]\\d{7}$/.test(n)", "/^\\d{8}$/.test(n)"],
  ['email kept in mixed case', GS, "String(d.email == null ? '' : d.email).trim().toLowerCase();", "String(d.email == null ? '' : d.email).trim();"],
  ['name check dropped', GS, "if (name.length < 2) return { ok: false, error: 'name' };\n\n", '\n'],
  ['unknown attendance type accepted', GS, "if (interest !== 'visitor' && interest !== 'trade' && interest !== 'media') return { ok: false, error: 'interest' };", ''],
  ['country code not stripped', GS, "if (valid(rest)) digits = rest;", ''],
  ['ticket shown to anyone who knows the email', GS, "if (existing && !sameVisitor) return { ok: true, resent: true };", ''],
  ['duplicate email makes a second row', GS, "var row = findRow_(sheet, C['Email'], email);", 'var row = 0;'],
  ['resend limit raised', GS, 'MAX_RESENDS: 5', 'MAX_RESENDS: 50'],
  ['formula signs kept', GS, ".replace(/^[=+\\-@\\s]+/, '')", ''],
  ['name not escaped in the email', GS, "font-weight:bold;padding:8px 0 4px\">' + esc_(p.name)", "font-weight:bold;padding:8px 0 4px\">' + (p.name)"],
  ['unsubscribe without confirmation', GS, "if (e.parameter.confirm !== '1') {", 'if (false) {'],
  ['sending limit ignored', GS, "if (MailApp.getRemainingDailyQuota() < 1) return false;", ''],
  ['row marked emailed when it was not', GS, "if (sent && !existing) markEmailed_(sheet, ticket);", 'if (!existing) markEmailed_(sheet, ticket);'],
  ['daily report counts today instead of yesterday', GS, "var yesterday = day(new Date().getTime() - 24 * 60 * 60 * 1000);", 'var yesterday = day(new Date().getTime());'],
  ['daily report accepts any recipient text', GS, ".filter(function (a) { return /^[^@\\s,]+@[^@\\s,]+\\.[^@\\s,]+$/.test(a); });", ';'],
  ['Chinese tickets sent in English', GS, "var t = MAIL[p.lang] || MAIL.en;\n    MailApp", "var t = MAIL.en;\n    MailApp"],
  ['consent wording changed in the backend only', GS, 'We do not call. We do not sell your details. You may', 'We may call. You may'],
  ['QR mask wrong', GS, "function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; }", "function (x, y) { return (x + y) % 2 === 1; }, function (x, y) { return y % 2 === 1; }"],
  ['QR format bits wrong', GS, '^ 0x5412;', '^ 0x5411;'],
  ['QR error correction wrong', GS, 'function mul(a, b) { var z = 0; for (var k = 7;', 'function mul(a, b) { var z = 1; for (var k = 7;'],
  ['PNG checksum wrong', GS, '0xEDB88320', '0xEDB88321'],
  ['ticket heading not focused', PAGE, "if (!opts.stored) { window.scrollTo(0, 0); $('doneH').focus(); }", ''],
  ['double submit allowed', PAGE, "if (btn.getAttribute('aria-busy') === 'true') return;", ''],
  ['ticket not kept on the device', PAGE, 'if (t.ticket) store(t);', ''],
  ['name written as markup', PAGE, "$('tName').textContent = t.name;", "$('tName').innerHTML = t.name;"],
  ['tampered stored ticket trusted', PAGE, "/^HEA26-[0-9A-Z]{6}$/.test(saved.ticket)", 'true'],
  ['country looked up on page load', PAGE, "form.addEventListener('focusin', askCountry);", 'askCountry();'],
  ['resend counted as a sign-up', PAGE, "if (!res.resent) window.trackIntent(", 'window.trackIntent('],
  ['door registration counted as an ad conversion', PAGE, "if (action === 'sign_up') { name = 'onsite_action'; params.action = action; }", ''],
  ['language menu drops campaign tags', PAGE, "location.href = window.HEA_REG_URL(this.value) + location.search;", 'location.href = window.HEA_REG_URL(this.value);'],
  ['error not cleared on typing', PAGE, "form.addEventListener('input', clearErr);", ''],
  ['form overflows a small phone', PAGE, '.seg { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));', '.seg { display: grid; grid-template-columns: repeat(3, 200px);'],
  ['inputs shrink below 16px', PAGE, 'color: var(--body); font: 16px/1.4 var(--font-body); }', 'color: var(--body); font: 14px/1.4 var(--font-body); }'],
  ['attendance type preselected', PAGE, '<input type="radio" name="interest" id="i-visitor" value="visitor">', '<input type="radio" name="interest" id="i-visitor" value="visitor" checked>'],
  ['extra field added to the form', PAGE, '<fieldset class="field">', '<input name="company" type="text"><fieldset class="field">'],
  ['consent moved out of the form', PAGE, '<p class="consent">', '<p class="fineprint">'],
  ['show page stops saving campaign tags', SHOW, "ss.setItem('hea-utm',", "ss.setItem('hea-utm-old',"],
  ['show page loses its register button', BUILD, `<a class="btn btn-primary" href="register.html">{ICON_TICKET}{t('reg.cta')}</a>`, ''],
  ['privacy notice drops the no-calls promise', BUILD, 'We do not telephone you. ', ''],
  ['privacy notice drops the IP lookup disclosure', BUILD, 'country.is, a lookup service', 'a lookup service'],
  ['Thai button left in English', 'i18n/th.json', '"reg.submit": "รับบัตร"', '"reg.submit": "Get my ticket"'],
  ['Vietnamese consent drops NOWASIA', 'i18n/vi.json', 'HiEnd Asia và NOWASIA qua email', 'HiEnd Asia qua email'],
];

const filter = process.argv[2];
const originals = new Map();
const restore = () => { for (const [f, src] of originals) fs.writeFileSync(path.join(ROOT, f), src); originals.clear(); };
const build = () => spawnSync('python3', ['build.py'], { cwd: ROOT, stdio: 'pipe' });
process.on('SIGINT', () => { restore(); build(); process.exit(130); });

let survived = [], stale = [], killed = 0;
try {
  for (const [name, file, find, replace] of MUTATIONS) {
    if (filter && !name.includes(filter)) continue;
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    if (!src.includes(find)) { stale.push(name); console.log('STALE     ' + name + '  (the code it targets has changed: update tests/mutation.js)'); continue; }
    originals.set(file, src);
    fs.writeFileSync(path.join(ROOT, file), src.replace(find, () => replace));
    const b = build();
    const run = b.status === 0 ? spawnSync('node', ['--test', 'tests/backend.test.js', 'tests/validate.test.js', 'tests/qr.test.js', 'tests/build.test.js', 'tests/browser.test.js'],
      { cwd: ROOT, encoding: 'utf8' }) : { status: 1, stdout: '# fail build' };
    restore();
    const fails = (run.stdout.match(/^# fail (\d+)/m) || [0, '?'])[1];
    if (run.status === 0) { survived.push(name); console.log('SURVIVED  ' + name); } else { killed++; console.log('caught    ' + name + '  (' + (b.status === 0 ? fails + ' failing' : 'build refused') + ')'); }
  }
} finally {
  restore();
  build();
}
console.log(`\n${killed} caught, ${survived.length} survived, ${stale.length} stale`);
process.exit(survived.length || stale.length ? 1 : 0);
