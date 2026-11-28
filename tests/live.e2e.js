// End-to-end check of the LIVE ticket form: the published register.html in headless Chrome, posting to the
// deployed Apps Script. It writes a real row to the registrations Sheet and sends a real ticket email, so it is
// not part of `npm test`. Run it by hand after each deployment:
//
//   LIVE_EMAIL=you@example.com npm run test:live
//
// LIVE_URL overrides the page (default: the published site). Afterwards confirm by hand that the ticket email
// arrived and that the Sheet has one row for the address, then delete that row.
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const { findChrome, evaluateWhen } = require('./helpers/chrome');

const URL_ = process.env.LIVE_URL || 'https://www.hiendasia.com/register.html';
const EMAIL = process.env.LIVE_EMAIL;
const NAME = 'E2E Test';
const TICKET = /^HEA26-[2-9A-HJ-NP-Z]{6}$/;
const chrome = findChrome();
if (!chrome) throw new Error('Chrome not found (set CHROME_BIN)');
if (!EMAIL) throw new Error('Set LIVE_EMAIL to an inbox you can read');

// Fills the form once, submits, and waits until the page shows a ticket or an error. Each call is a fresh
// Chrome profile, so the page has no saved ticket: a repeat sign-up looks like a new device.
function register() {
  const fill = `(function () {
    if (!window.__sent && document.getElementById('f-name')) {
      window.__sent = true;
      var $ = function (id) { return document.getElementById(id); };
      $('f-name').value = ${JSON.stringify(NAME)};
      $('f-email').value = ${JSON.stringify(EMAIL)};
      var d = $('f-dial'); if (d.querySelector('option[value="SG"]')) { d.value = 'SG'; d.dispatchEvent(new Event('change')); }
      $('f-phone').value = '91234567';
      $('i-visitor').checked = true;
      $('submitBtn').click();
      return false;
    }
    return !$done() ? false : true;
    function $done() { return !document.getElementById('ticketView').hidden || document.getElementById('err').textContent !== ''; }
  })()`;
  const read = `JSON.stringify({ shown: !document.getElementById('ticketView').hidden,
    card: !document.getElementById('ticketCard').hidden, ticket: document.getElementById('tNo').textContent,
    name: document.getElementById('tName').textContent, heading: document.getElementById('doneH').textContent,
    err: document.getElementById('err').textContent })`;
  return evaluateWhen(chrome, URL_, { until: fill, value: read, timeoutMs: 60000 }).then(JSON.parse);
}

describe('live ticket registration', () => {
  let first, again;
  before(async () => { first = await register(); again = await register(); });

  it('a new sign-up shows a ticket, not an error', () => { assert.equal(first.err, ''); assert.equal(first.shown, true); assert.equal(first.card, true); });
  it('the ticket number has the show format', () => assert.match(first.ticket, TICKET));
  it('the ticket was issued by the deployed backend, not the page\'s offline sample', () => assert.notEqual(first.ticket, 'HEA26-SAMPLE'));
  it('the ticket carries the name typed in', () => assert.equal(first.name, NAME));
  // Same name, email and mobile on another device: the backend recognises the holder and shows the same ticket.
  it('the same person again gets the same ticket, not a second one', () => {
    assert.equal(again.err, ''); assert.equal(again.card, true); assert.equal(again.ticket, first.ticket);
  });
  it('prints the ticket for the manual inbox and Sheet check', () => console.log('LIVE TICKET', first.ticket, 'for', EMAIL));
});
