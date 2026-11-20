// Loads apps-script/Code.gs into a sandbox with stand-ins for the Google services it calls, so the real backend
// code runs under Node. Each call to loadBackend() gives a fresh, empty Sheet and mailbox.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');

const CODE_PATH = process.env.CODE_GS || path.join(__dirname, '..', '..', 'apps-script', 'Code.gs');

function makeSheet() {
  const rows = [];
  const cell = (r, c) => { const v = (rows[r - 1] || [])[c - 1]; return v === undefined ? '' : v; };
  const sheet = {
    rows,
    getLastRow: () => rows.length,
    getMaxRows: () => 1000,
    appendRow(r) { rows.push(Array.from(r, v => (v === undefined ? '' : v))); },
    getRange(r, c, nr = 1, nc = 1) {
      const range = {
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => cell(r + i, c + j))),
        getValue: () => cell(r, c),
        setValue(v) { while (rows.length < r) rows.push([]); rows[r - 1][c - 1] = v; return range; },
        setValues(vs) {
          vs.forEach((row, i) => { while (rows.length < r + i) rows.push([]); row.forEach((v, j) => { rows[r - 1 + i][c - 1 + j] = v; }); });
          return range;
        },
        setFontWeight: () => range,
        setNumberFormat: () => range,
        createTextFinder(text) {
          return {
            matchEntireCell() { return this; },
            findNext() {
              for (let i = 0; i < nr; i++) if (String(cell(r + i, c)) === String(text)) return { getRow: () => r + i };
              return null;
            },
          };
        },
      };
      return range;
    },
    setFrozenRows() {}, hideColumns() {}, setColumnWidth() {},
  };
  return sheet;
}

function loadBackend(opts = {}) {
  const sheets = {};
  const state = { sheets, mails: [], quota: opts.quota === undefined ? 1500 : opts.quota, triggers: [], errors: [], failMail: false };
  const spreadsheet = {
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => (sheets[n] = makeSheet()),
    setSpreadsheetTimeZone() {},
    getUrl: () => 'https://docs.example/registrations',
  };
  const fmt = (d, tz, f) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: 'short', day: 'numeric' })
      .formatToParts(d).map(x => [x.type, x.value]));
    const num = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(d).map(x => [x.type, x.value]));
    if (f === 'yyyy-MM-dd') return `${num.year}-${num.month}-${num.day}`;
    if (f === 'd MMM yyyy') return `${p.day} ${p.month} ${p.year}`;
    throw new Error('gas-mock: unsupported date format ' + f);
  };
  const sandbox = {
    get Date() { return globalThis.Date; },   // read each time, so a test can freeze the clock
    JSON, Math, console: { error: (...a) => state.errors.push(a.join(' ')), log() {} },
    SpreadsheetApp: { getActiveSpreadsheet: () => spreadsheet },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: {
      getRemainingDailyQuota: () => state.quota,
      sendEmail(m) { if (state.failMail) throw new Error('mail service down'); state.mails.push(m); state.quota--; },
    },
    Utilities: { getUuid: () => crypto.randomUUID(), newBlob: (bytes, type, name) => ({ bytes, type, name }), formatDate: fmt },
    ScriptApp: {
      getService: () => ({ getUrl: () => 'https://script.example/exec' }),
      getProjectTriggers: () => [],
      deleteTrigger() {},
      newTrigger(fn) {
        const t = { fn, hour: null, minutes: null };
        const b = { timeBased: () => b, everyDays: () => b, atHour: h => { t.hour = h; return b; }, inTimezone: z => { t.tz = z; return b; },
          everyMinutes: m => { t.minutes = m; return b; }, create: () => { state.triggers.push(t); } };
        return b;
      },
    },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'owner@example.com' }) },
    ContentService: { MimeType: { JSON: 'application/json' }, createTextOutput: text => ({ text, setMimeType(m) { this.mime = m; return this; } }) },
    HtmlService: { createHtmlOutput: html => ({ html, setTitle(t) { this.title = t; return this; } }) },
  };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(CODE_PATH, 'utf8'), sandbox, { filename: 'Code.gs' });
  const api = {
    state, gs: sandbox,
    post: data => JSON.parse(sandbox.doPost({ postData: { contents: typeof data === 'string' ? data : JSON.stringify(data) } }).text),
    get: params => sandbox.doGet({ parameter: params || {} }).html,
    get reg() { return sheets.Registrations; },
    get recipients() { return sheets.Recipients; },
    // A registration row as an object keyed by the Sheet's column headers.
    row(n) { const h = sheets.Registrations.rows[0]; const r = sheets.Registrations.rows[n]; return Object.fromEntries(h.map((k, i) => [k, r[i]])); },
    count: () => sheets.Registrations.rows.length - 1,
  };
  if (opts.setup !== false) sandbox.setup();
  return api;
}

// A valid submission, as the form sends it.
const VISITOR = Object.freeze({ name: 'Tan Wei Ming', email: 'weiming@example.com', iso: 'SG', dial: '65', phone: '91234567',
  interest: 'visitor', lang: 'en', tz: 'Asia/Singapore', ipCountry: 'SG', source: '', medium: '', campaign: '', here: '', device: 'phone', website: '' });

module.exports = { loadBackend, VISITOR, CODE_PATH };
