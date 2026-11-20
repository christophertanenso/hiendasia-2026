// The register page in a real browser, talking to the real backend code (tests/helpers/server.js).
// Needs Chrome or Chromium. Set CHROME_BIN to point at it; without one these tests are skipped, loudly.
const { describe, it, before } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { start } = require('./helpers/server');
const { findChrome, evaluateWhen } = require('./helpers/chrome');

const en = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'en.json'), 'utf8'));
const th = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'i18n', 'th.json'), 'utf8'));
const LANGS = ['en', 'zh-Hans', 'zh-Hant', 'id', 'ms', 'fil', 'th', 'vi'];
const TICKET = /^HEA26-[2-9A-HJ-NP-Z]{6}$/;

const chrome = findChrome();
if (!chrome && process.env.CI) throw new Error('Chrome not found on CI: the browser tests must not be skipped there');

let R = null;
const skip = chrome ? false : 'Chrome not found (set CHROME_BIN)';

describe('register page in the browser', { skip }, () => {
  before(async () => {
    const server = await start();
    try {
      const json = await evaluateWhen(chrome, `http://127.0.0.1:${server.port}/__t/harness.html`,
        { until: 'document.title === "DONE"', value: 'document.getElementById("out").textContent' });
      R = JSON.parse(json);
    } finally {
      await server.close();
    }
  });
  const scenario = (name, fn) => it(name, () => fn(R));
  const ok = (r, n) => { assert.ok(r[n], 'scenario missing: ' + n); assert.equal(r[n].crashed, undefined, r[n].crashed); return r[n]; };

  describe('validation', () => {
    scenario('an empty form names the first missing field', r => assert.equal(ok(r, 'emptySubmit').err, en['reg.err.name']));
    scenario('an empty form marks the name field invalid', r => assert.equal(ok(r, 'emptySubmit').invalid, 'f-name'));
    scenario('an empty form moves focus to the name field', r => assert.equal(ok(r, 'emptySubmit').focus, 'f-name'));
    scenario('an empty form sends nothing to the backend', r => assert.equal(ok(r, 'emptySubmit').posts, 0));
    scenario('a bad email is reported on the email field', r => {
      assert.equal(ok(r, 'badEmail').err, en['reg.err.email']); assert.equal(r.badEmail.invalid, 'f-email');
    });
    scenario('a Singapore landline is reported on the phone field', r => {
      assert.equal(ok(r, 'landline').err, en['reg.err.phone']); assert.equal(r.landline.invalid, 'f-phone');
    });
    scenario('a missing attendance type is reported', r => assert.equal(ok(r, 'noInterest').err, en['reg.err.interest']));
    scenario('a missing attendance type moves focus to the first choice', r => assert.equal(ok(r, 'noInterest').focus, 'i-visitor'));
    scenario('the error clears as soon as the visitor types', r => {
      assert.notEqual(ok(r, 'errorClears').before.err, ''); assert.equal(r.errorClears.after.err, ''); assert.equal(r.errorClears.after.invalid, null);
    });
  });

  describe('a successful registration', () => {
    scenario('shows the ticket in place of the form', r => {
      const v = ok(r, 'success').view; assert.equal(v.ticketShown, true); assert.equal(v.formShown, false); assert.equal(v.cardShown, true);
    });
    scenario('shows the name on the ticket', r => assert.equal(ok(r, 'success').view.name, 'Tan Wei Ming'));
    scenario('shows the ticket number the backend issued', r => {
      assert.match(ok(r, 'success').view.ticket, TICKET); assert.equal(r.success.view.ticket, r.success.state.rows[0].Ticket);
    });
    scenario('draws a QR code', r => assert.ok(ok(r, 'success').view.qrCells > 150));
    scenario('says a copy was emailed', r => assert.equal(ok(r, 'success').view.lead, en['reg.done.lead']));
    scenario('moves focus to the ticket heading for screen readers', r => assert.equal(ok(r, 'success').headingFocused, true));
    scenario('writes one row to the Sheet', r => assert.equal(ok(r, 'success').state.rows.length, 1));
    scenario('sends one ticket email to the visitor', r => assert.deepEqual(ok(r, 'success').state.mails.map(m => m.to), ['weiming@example.com']));
    scenario('stores the mobile number in international format', r => assert.equal(ok(r, 'success').state.rows[0].Mobile, '+6591234567'));
    scenario('stores the attendance type', r => assert.equal(ok(r, 'success').state.rows[0]['Attending as'], 'Trade'));
    scenario('stores the page language', r => assert.equal(ok(r, 'success').state.rows[0].Language, 'en'));
    scenario('stores the time zone', r => assert.ok(ok(r, 'success').state.rows[0].Timezone.length > 2));
    scenario('stores phone or desktop', r => assert.match(ok(r, 'success').state.rows[0].Device, /^(phone|desktop)$/));
    scenario('sends only the agreed fields', r => assert.deepEqual(Object.keys(ok(r, 'success').post).sort(),
      ['campaign', 'device', 'dial', 'email', 'here', 'interest', 'ipCountry', 'iso', 'lang', 'medium', 'name', 'phone', 'source', 'tz', 'website']));
    scenario('keeps the ticket on the device', r => assert.equal(JSON.parse(ok(r, 'success').view.stored).ticket, r.success.view.ticket));
    scenario('reports a sign_up conversion with the attendance type', r => {
      const e = ok(r, 'success').view.events.filter(x => x.name === 'sign_up');
      assert.equal(e.length, 1); assert.equal(e[0].params.method, 'trade');
    });
    scenario('restores the button after sending', r => { assert.equal(ok(r, 'success').view.busy, null); assert.equal(r.success.view.button, en['reg.submit']); });
    scenario('treats a typed name as text, never as markup', r => {
      assert.equal(ok(r, 'nameIsNotMarkup').injected, false); assert.equal(r.nameIsNotMarkup.name, 'Tan <b id="x">Wei</b>');
    });
    scenario('accepts a number typed with +65', r => assert.equal(ok(r, 'typedWithCountryCode').state.rows[0].Mobile, '+6591234567'));
    scenario('a triple click registers once', r => { assert.equal(ok(r, 'doubleClick').state.posts, 1); assert.equal(r.doubleClick.state.rows.length, 1); });
  });

  describe('where the visitor came from', () => {
    scenario('records campaign tags on the link', r => {
      const row = ok(r, 'arrivalTags').state.rows[0]; assert.deepEqual([row.Source, row.Medium, row.Campaign], ['facebook', 'paid', 'dec-launch']);
    });
    scenario('records the QR sign for a registration at the door', r => assert.equal(ok(r, 'arrivalTags').state.rows[0]['On site'], 'entrance'));
    scenario('a registration at the door is not counted as an ad conversion', r => {
      const names = ok(r, 'arrivalTags').view.events.map(e => e.name);
      assert.ok(names.includes('onsite_action') && !names.includes('sign_up'));
    });
    scenario('records tags saved earlier by the show page', r => {
      const row = ok(r, 'arrivalFromShowPage').state.rows[0]; assert.deepEqual([row.Source, row.Medium, row.Campaign], ['whatsapp', 'social', 'share']);
    });
    scenario('the show page saves campaign tags for later', r => {
      assert.deepEqual(JSON.parse(ok(r, 'showPageKeepsTags').saved), { source: 'google', medium: 'cpc', campaign: 'brand' });
    });
    scenario('does not look up the country until the visitor starts the form', r => assert.deepEqual(ok(r, 'countryLookup').atLoad, []));
    scenario('looks up the country once, and only from country.is', r => assert.deepEqual(ok(r, 'countryLookup').afterTyping, ['api.country.is']));
    scenario('stores the IP country', r => assert.equal(ok(r, 'countryLookup').state.rows[0]['Country (IP)'], 'MY'));
    scenario('contacts no other outside service', r => {
      for (const n of Object.keys(r)) for (const h of (r[n].view && r[n].view.external) || r[n].external || []) assert.equal(h, 'api.country.is', n);
    });
  });

  describe('registering twice', () => {
    scenario('the same person sees their ticket again', r => {
      const v = ok(r, 'duplicateSamePerson').view; assert.equal(v.cardShown, true); assert.equal(v.ticket, r.duplicateSamePerson.state.rows[0].Ticket);
    });
    scenario('the same person is told it was sent again', r => assert.equal(ok(r, 'duplicateSamePerson').view.lead, en['reg.resent.lead']));
    scenario('no second row is written', r => assert.equal(ok(r, 'duplicateSamePerson').state.rows.length, 1));
    scenario('a resend is not counted as a new sign-up', r => assert.deepEqual(ok(r, 'duplicateSamePerson').view.events.filter(e => /sign_up|onsite/.test(e.name)), []));
    scenario('someone else using that email sees no ticket', r => {
      const v = ok(r, 'duplicateOtherPerson').view; assert.equal(v.ticketShown, true); assert.equal(v.cardShown, false); assert.equal(v.ticket, '');
    });
    scenario('someone else is told the email is already registered', r => {
      assert.equal(ok(r, 'duplicateOtherPerson').view.heading, en['reg.resent.h']); assert.equal(r.duplicateOtherPerson.view.lead, en['reg.resent.lead']);
    });
    scenario('nothing is kept on the device when no ticket is shown', r => assert.equal(ok(r, 'duplicateOtherPerson').view.stored, null));
  });

  describe('when things go wrong', () => {
    scenario('a backend failure shows a plain retry message', r => assert.equal(ok(r, 'backendDown').err, en['reg.err.server']));
    scenario('a backend failure keeps the form and what was typed', r => { assert.equal(ok(r, 'backendDown').formShown, true); assert.equal(r.backendDown.ticketShown, false); });
    scenario('a backend failure re-enables the button', r => { assert.equal(ok(r, 'backendDown').busy, null); assert.equal(r.backendDown.button, en['reg.submit']); });
    scenario('with no backend connected the live page says registration is not open', r => assert.equal(ok(r, 'notConnectedLive').err, en['reg.err.closed']));
    scenario('with no backend connected a developer machine gets a sample ticket', r => assert.equal(ok(r, 'notConnectedLocal').ticket, 'HEA26-SAMPLE'));
    scenario('a bot that fills the hidden field writes no row', r => assert.equal(ok(r, 'honeypot').state.rows.length, 0));
    scenario('a bot that fills the hidden field gets no ticket', r => assert.equal(ok(r, 'honeypot').view.cardShown, false));
  });

  describe('coming back to the page', () => {
    scenario('a ticket kept on the device is shown straight away', r => {
      const v = ok(r, 'storedTicket').shown; assert.equal(v.ticketShown, true); assert.equal(v.ticket, 'HEA26-7K3M9Q'); assert.equal(v.name, 'Tan Wei Ming');
    });
    scenario('it is shown without contacting the backend', r => assert.equal(ok(r, 'storedTicket').shown.posts, 0));
    scenario('it does not claim an email was just sent', r => assert.equal(ok(r, 'storedTicket').shown.lead, en['reg.stored.lead']));
    scenario('"Register another visitor" brings the form back', r => { assert.equal(ok(r, 'storedTicket').after.formShown, true); assert.equal(r.storedTicket.after.ticketShown, false); });
    scenario('"Register another visitor" forgets the kept ticket', r => assert.equal(ok(r, 'storedTicket').after.stored, null));
    scenario('a tampered kept ticket is ignored', r => assert.equal(ok(r, 'corruptStoredTicket').tampered.formShown, true));
    scenario('unreadable kept data is ignored', r => assert.equal(ok(r, 'corruptStoredTicket').garbage.formShown, true));
  });

  describe('languages and countries', () => {
    scenario('the Thai page is in Thai', r => { assert.equal(ok(r, 'thaiPage').lang, 'th'); assert.equal(r.thaiPage.button, th['reg.submit']); });
    scenario('the Thai page reports errors in Thai', r => assert.equal(ok(r, 'thaiPage').err, th['reg.err.name']));
    scenario('the Thai page lists countries in Thai', r => assert.match(ok(r, 'thaiPage').firstCountry, /สิงคโปร์ \+65/));
    scenario('the Thai page shows the ticket in Thai', r => assert.equal(ok(r, 'thaiPage').doneHeading, th['reg.done.h']));
    scenario('a Thai registration is stored as Thai', r => assert.equal(ok(r, 'thaiPage').state.rows[0].Language, 'th'));
    scenario('the language menu opens the same page in that language', r => { assert.equal(ok(r, 'languageMenu').path, '/__e/vi/register.html'); assert.equal(r.languageMenu.lang, 'vi'); });
    scenario('the language menu keeps the campaign tags', r => assert.equal(ok(r, 'languageMenu').search, '?utm_source=facebook'));
    scenario('the language menu remembers the choice', r => assert.equal(ok(r, 'languageMenu').saved, 'vi'));
    scenario('a returning visitor is sent to their language, tags intact', r => {
      assert.equal(ok(r, 'savedLanguageForwards').path, '/__e/zh-Hans/register.html'); assert.equal(r.savedLanguageForwards.search, '?here=entrance');
    });
    scenario('choosing Malaysia shows +60', r => assert.equal(ok(r, 'foreignNumber').label, 'MY +60'));
    scenario('a Malaysian number is stored in international format', r => assert.equal(ok(r, 'foreignNumber').state.rows[0].Mobile, '+60123456789'));
    scenario('a Malaysian number records Malaysia as the phone country', r => assert.equal(ok(r, 'foreignNumber').state.rows[0]['Country (phone)'], 'MY'));
  });

  describe('on a phone', () => {
    for (const l of LANGS) {
      scenario(`${l}: the form fits a 320px screen without sideways scrolling`, r => assert.ok(ok(r, 'narrowPhone')[l].form <= 0, 'overflow ' + r.narrowPhone[l].form));
      scenario(`${l}: the ticket fits a 320px screen without sideways scrolling`, r => {
        assert.equal(ok(r, 'narrowPhone')[l].ticketShown, true); assert.ok(r.narrowPhone[l].ticket <= 0, 'overflow ' + r.narrowPhone[l].ticket);
      });
    }
    scenario('fields and buttons are at least 48px tall', r => {
      const t = ok(r, 'tapTargets'); for (const k of ['f-name', 'f-email', 'f-phone', 'submitBtn', 'interest']) assert.ok(t[k] >= 48, k + ' ' + t[k]);
    });
    scenario('inputs use 16px text so iPhones do not zoom', r => assert.equal(ok(r, 'tapTargets').inputFont, '16px'));
  });
});
