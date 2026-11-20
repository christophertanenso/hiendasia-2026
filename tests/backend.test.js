// The registration backend (apps-script/Code.gs): what happens to a submission after the form sends it.
const { describe, it, beforeEach, afterEach, mock } = require('node:test');
const assert = require('node:assert/strict');
const { loadBackend, VISITOR } = require('./helpers/gas-mock');

const TICKET = /^HEA26-[2-9A-HJ-NP-Z]{6}$/;
let b;
beforeEach(() => { b = loadBackend(); });

describe('setup', () => {
  it('creates the Registrations tab with its header row', () => {
    assert.equal(b.reg.rows[0][0], 'Registered at');
    assert.equal(b.reg.rows[0].length, 21);
  });
  it('lists the Sheet owner as the first daily-email recipient', () => {
    assert.equal(b.recipients.rows[1][0], 'owner@example.com');
  });
  it('schedules the daily report for 9am Singapore time', () => {
    const t = b.state.triggers.find(x => x.fn === 'dailyReport');
    assert.equal(t.hour, 9);
    assert.equal(t.tz, 'Asia/Singapore');
  });
  it('schedules the pending-email sweep every 15 minutes', () => {
    assert.equal(b.state.triggers.find(x => x.fn === 'sendPending').minutes, 15);
  });
  it('keeps existing registrations when run a second time', () => {
    b.post(VISITOR);
    b.gs.setup();
    assert.equal(b.count(), 1);
  });
  it('keeps the recipients list when run a second time', () => {
    b.recipients.rows[1][0] = 'someone@example.com';
    b.gs.setup();
    assert.equal(b.recipients.rows[1][0], 'someone@example.com');
  });
});

describe('a new registration', () => {
  it('returns a ticket number in the HEA26 format', () => {
    assert.match(b.post(VISITOR).ticket, TICKET);
  });
  it('returns the name for the on-screen ticket', () => {
    assert.equal(b.post(VISITOR).name, 'Tan Wei Ming');
  });
  it('is not marked as a resend', () => {
    assert.equal(b.post(VISITOR).resent, false);
  });
  it('adds exactly one row', () => {
    b.post(VISITOR);
    assert.equal(b.count(), 1);
  });
  it('stores the email in lower case', () => {
    b.post({ ...VISITOR, email: '  WeiMing@Example.COM ' });
    assert.equal(b.row(1).Email, 'weiming@example.com');
  });
  it('stores the mobile number in international format', () => {
    b.post(VISITOR);
    assert.equal(b.row(1).Mobile, '+6591234567');
  });
  it('stores the name with tidy spacing', () => {
    b.post({ ...VISITOR, name: '  Tan   Wei  Ming ' });
    assert.equal(b.row(1).Name, 'Tan Wei Ming');
  });
  it('stores how the visitor is attending', () => {
    b.post({ ...VISITOR, interest: 'media' });
    assert.equal(b.row(1)['Attending as'], 'Media');
  });
  it('stores the country of the phone code', () => {
    b.post({ ...VISITOR, iso: 'MY', dial: '60', phone: '123456789' });
    assert.equal(b.row(1)['Country (phone)'], 'MY');
  });
  it('stores the country found from the IP address', () => {
    b.post({ ...VISITOR, ipCountry: 'ID' });
    assert.equal(b.row(1)['Country (IP)'], 'ID');
  });
  it('ignores an IP country that is not a two-letter code', () => {
    b.post({ ...VISITOR, ipCountry: '<script>' });
    assert.equal(b.row(1)['Country (IP)'], '');
  });
  it('stores the page language', () => {
    b.post({ ...VISITOR, lang: 'th' });
    assert.equal(b.row(1).Language, 'th');
  });
  it('falls back to English for an unknown language', () => {
    b.post({ ...VISITOR, lang: 'xx' });
    assert.equal(b.row(1).Language, 'en');
  });
  it('stores the campaign that brought the visitor', () => {
    b.post({ ...VISITOR, source: 'facebook', medium: 'paid', campaign: 'dec-launch' });
    const r = b.row(1);
    assert.deepEqual([r.Source, r.Medium, r.Campaign], ['facebook', 'paid', 'dec-launch']);
  });
  it('stores the QR sign for an on-site registration', () => {
    b.post({ ...VISITOR, here: 'entrance' });
    assert.equal(b.row(1)['On site'], 'entrance');
  });
  it('stores the consent version', () => {
    b.post(VISITOR);
    assert.equal(b.row(1)['Consent version'], 'reg-1');
  });
  it('stores the consent wording the visitor agreed to', () => {
    b.post(VISITOR);
    assert.match(b.row(1)['Consent wording'], /HiEnd Asia and NOWASIA by email and WhatsApp/);
  });
  it('records when it was registered', () => {
    b.post(VISITOR);
    assert.ok(b.row(1)['Registered at'] instanceof Date);
  });
  it('gives each registration its own unsubscribe token', () => {
    b.post(VISITOR);
    b.post({ ...VISITOR, email: 'other@example.com' });
    assert.notEqual(b.row(1).Token, b.row(2).Token);
  });
  it('gives each registration its own ticket number', () => {
    const a = b.post(VISITOR).ticket;
    const c = b.post({ ...VISITOR, email: 'other@example.com' }).ticket;
    assert.notEqual(a, c);
  });
  it('accepts a Singapore number typed with its country code', () => {
    b.post({ ...VISITOR, phone: '+65 9123 4567' });
    assert.equal(b.row(1).Mobile, '+6591234567');
  });
  it('accepts a foreign number written with a leading zero', () => {
    b.post({ ...VISITOR, iso: 'MY', dial: '60', phone: '012-345 6789' });
    assert.equal(b.row(1).Mobile, '+60123456789');
  });
});

describe('rejected submissions', () => {
  const rejects = (name, patch, error) => it(name, () => {
    assert.deepEqual(b.post({ ...VISITOR, ...patch }), { ok: false, error });
    assert.equal(b.count(), 0);
    assert.equal(b.state.mails.length, 0);
  });
  rejects('a missing name', { name: '' }, 'name');
  rejects('a one-letter name', { name: 'x' }, 'name');
  rejects('a missing email', { email: '' }, 'email');
  rejects('an email without a domain', { email: 'weiming@' }, 'email');
  rejects('an email with a space', { email: 'wei ming@example.com' }, 'email');
  rejects('a missing mobile number', { phone: '' }, 'phone');
  rejects('a Singapore landline', { phone: '61234567' }, 'phone');
  rejects('a Singapore number that is too short', { phone: '9123456' }, 'phone');
  rejects('a missing country code', { dial: '' }, 'phone');
  rejects('a missing attendance type', { interest: '' }, 'interest');
  rejects('an unknown attendance type', { interest: 'vip' }, 'interest');
  it('answers a server error when the body is not JSON', () => {
    assert.deepEqual(b.post('{not json'), { ok: false, error: 'server' });
  });
  it('writes nothing when the hidden bot field is filled', () => {
    b.post({ ...VISITOR, website: 'http://spam.example' });
    assert.equal(b.count(), 0);
  });
  it('sends no email when the hidden bot field is filled', () => {
    b.post({ ...VISITOR, website: 'http://spam.example' });
    assert.equal(b.state.mails.length, 0);
  });
  it('gives a bot no ticket', () => {
    assert.equal(b.post({ ...VISITOR, website: 'x' }).ticket, undefined);
  });
});

describe('spreadsheet safety', () => {
  it('strips a leading formula sign from the name', () => {
    b.post({ ...VISITOR, name: '=HYPERLINK("http://x","y")' });
    assert.doesNotMatch(b.row(1).Name, /^[=+\-@]/);
  });
  it('strips a leading formula sign from campaign tags', () => {
    b.post({ ...VISITOR, source: '+cmd', campaign: '@SUM(A1)' });
    assert.doesNotMatch(b.row(1).Source + b.row(1).Campaign, /^[=+\-@]|\|[=+\-@]/);
    assert.equal(b.row(1).Source, 'cmd');
  });
  it('cuts an over-long name to 80 characters', () => {
    b.post({ ...VISITOR, name: 'A'.repeat(300) });
    assert.equal(b.row(1).Name.length, 80);
  });
  it('removes line breaks from the name', () => {
    b.post({ ...VISITOR, name: 'Tan\nWei\tMing' });
    assert.equal(b.row(1).Name, 'Tan Wei Ming');
  });
});

describe('the ticket email', () => {
  it('is sent to the registered address', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails[0].to, 'weiming@example.com');
  });
  it('carries the ticket number', () => {
    const t = b.post(VISITOR).ticket;
    assert.ok(b.state.mails[0].htmlBody.includes(t));
  });
  it('carries the visitor name', () => {
    b.post(VISITOR);
    assert.ok(b.state.mails[0].htmlBody.includes('Tan Wei Ming'));
  });
  it('attaches the QR code as an inline PNG', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails[0].inlineImages.qr.type, 'image/png');
    assert.ok(b.state.mails[0].htmlBody.includes('cid:qr'));
  });
  it('has an unsubscribe link with the visitor token', () => {
    b.post(VISITOR);
    assert.ok(b.state.mails[0].htmlBody.includes('?u=' + b.row(1).Token));
  });
  it('links to the privacy notice', () => {
    b.post(VISITOR);
    assert.match(b.state.mails[0].htmlBody, /privacy\.html/);
  });
  it('states the no-calls and no-selling promise', () => {
    b.post(VISITOR);
    assert.match(b.state.mails[0].htmlBody, /We do not call\. We do not sell your details\./);
  });
  it('has a plain-text version with the ticket number', () => {
    const t = b.post(VISITOR).ticket;
    assert.ok(b.state.mails[0].body.includes(t));
  });
  it('is sent from the HiEnd Asia name', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails[0].name, 'HiEnd Asia');
  });
  it('is in English for an English registration', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails[0].subject, 'Your ticket · HiEnd Asia 2026');
  });
  it('is in Simplified Chinese for a zh-Hans registration', () => {
    b.post({ ...VISITOR, lang: 'zh-Hans' });
    assert.match(b.state.mails[0].subject, /您的门票/);
  });
  it('is in Traditional Chinese for a zh-Hant registration', () => {
    b.post({ ...VISITOR, lang: 'zh-Hant' });
    assert.match(b.state.mails[0].subject, /您的門票/);
  });
  it('is in English for the other languages', () => {
    b.post({ ...VISITOR, lang: 'th' });
    assert.equal(b.state.mails[0].subject, 'Your ticket · HiEnd Asia 2026');
  });
  it('escapes HTML in the name', () => {
    b.post({ ...VISITOR, name: 'Tan <img src=x onerror=alert(1)>' });
    assert.ok(!b.state.mails[0].htmlBody.includes('<img src=x'));
  });
  it('marks the row as emailed', () => {
    b.post(VISITOR);
    assert.ok(b.row(1)['Ticket emailed at'] instanceof Date);
  });
});

describe('the blind box note in the ticket email', () => {
  const BEFORE = Date.UTC(2026, 10, 30, 15, 59, 0);   // 30 Nov 2026, 11:59pm Singapore time
  const AFTER = Date.UTC(2026, 10, 30, 16, 0, 0);     // 1 Dec 2026, midnight Singapore time
  const at = t => mock.timers.enable({ apis: ['Date'], now: t });
  afterEach(() => { mock.timers.reset(); });
  it('tells an English registrant how to take part, in both versions', () => {
    at(BEFORE); b.post(VISITOR);
    for (const part of [b.state.mails[0].htmlBody, b.state.mails[0].body]) {
      for (const s of ['Mystery blind box', '5pm', 'valid ID']) assert.ok(part.includes(s), s);
    }
  });
  it('is in Simplified Chinese for a zh-Hans registrant', () => {
    at(BEFORE); b.post({ ...VISITOR, lang: 'zh-Hans' });
    assert.ok(b.state.mails[0].htmlBody.includes('神秘盲盒') && b.state.mails[0].htmlBody.includes('抽奖券'));
  });
  it('is in Traditional Chinese for a zh-Hant registrant', () => {
    at(BEFORE); b.post({ ...VISITOR, lang: 'zh-Hant' });
    assert.ok(b.state.mails[0].htmlBody.includes('神秘盲盒') && b.state.mails[0].htmlBody.includes('抽獎券'));
  });
  it('is left out for someone who registers after 30 November', () => {
    at(AFTER); b.post(VISITOR);
    assert.ok(!b.state.mails[0].htmlBody.includes('blind box') && !b.state.mails[0].body.includes('blind box'));
  });
  it('stays in a ticket resent after 30 November to someone who registered in time', () => {
    at(BEFORE); b.post(VISITOR);
    mock.timers.setTime(AFTER + 3600000); b.post(VISITOR);
    assert.ok(b.state.mails[1].htmlBody.includes('Mystery blind box'));
  });
  it('stays in a delayed ticket sent after 30 November for someone who registered in time', () => {
    at(BEFORE); b.state.quota = 0; b.post(VISITOR);
    b.state.quota = 10; mock.timers.setTime(AFTER + 3600000); b.gs.sendPending();
    assert.ok(b.state.mails[0].htmlBody.includes('Mystery blind box'));
  });
});

describe('registering again with the same email', () => {
  let first;
  beforeEach(() => { first = b.post(VISITOR); });
  it('returns the same ticket to the same person', () => {
    assert.equal(b.post(VISITOR).ticket, first.ticket);
  });
  it('is marked as a resend', () => {
    assert.equal(b.post(VISITOR).resent, true);
  });
  it('adds no second row', () => {
    b.post(VISITOR);
    assert.equal(b.count(), 1);
  });
  it('emails the ticket again', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails.length, 2);
    assert.ok(b.state.mails[1].htmlBody.includes(first.ticket));
  });
  it('treats the email as the same whatever its capitals', () => {
    assert.equal(b.post({ ...VISITOR, email: 'WEIMING@EXAMPLE.COM' }).ticket, first.ticket);
  });
  it('shows no ticket when the name differs', () => {
    const r = b.post({ ...VISITOR, name: 'Someone Else' });
    assert.deepEqual(r, { ok: true, resent: true });
  });
  it('shows no ticket when the mobile number differs', () => {
    const r = b.post({ ...VISITOR, phone: '81112222' });
    assert.deepEqual(r, { ok: true, resent: true });
  });
  it('keeps the original name on the row', () => {
    b.post({ ...VISITOR, name: 'Someone Else' });
    assert.equal(b.row(1).Name, 'Tan Wei Ming');
  });
  it('resends in the language of the original registration', () => {
    b.post({ ...VISITOR, lang: 'zh-Hans' });
    assert.equal(b.state.mails[1].subject, 'Your ticket · HiEnd Asia 2026');
  });
  it('stops emailing after five resends', () => {
    for (let i = 0; i < 9; i++) b.post(VISITOR);
    assert.equal(b.state.mails.length, 6);
  });
  it('still shows the ticket after the resend limit', () => {
    for (let i = 0; i < 9; i++) b.post(VISITOR);
    assert.equal(b.post(VISITOR).ticket, first.ticket);
  });
  it('leaves an unsubscribed visitor unsubscribed', () => {
    b.get({ u: b.row(1).Token, confirm: '1' });
    b.post(VISITOR);
    assert.ok(b.row(1)['Unsubscribed at'] instanceof Date);
  });
});

describe('when the daily sending limit is reached', () => {
  beforeEach(() => { b.state.quota = 0; });
  it('still issues the ticket', () => {
    assert.match(b.post(VISITOR).ticket, TICKET);
  });
  it('sends no email yet', () => {
    b.post(VISITOR);
    assert.equal(b.state.mails.length, 0);
  });
  it('leaves the row marked as not emailed', () => {
    b.post(VISITOR);
    assert.equal(b.row(1)['Ticket emailed at'], '');
  });
  it('sends the waiting ticket on a later sweep', () => {
    const t = b.post(VISITOR).ticket;
    b.reg.rows[1][0] = new Date(Date.now() - 10 * 60 * 1000);
    b.state.quota = 10;
    b.gs.sendPending();
    assert.ok(b.state.mails[0].htmlBody.includes(t));
    assert.ok(b.row(1)['Ticket emailed at'] instanceof Date);
  });
  it('does not sweep a registration made in the last two minutes', () => {
    b.post(VISITOR);
    b.state.quota = 10;
    b.gs.sendPending();
    assert.equal(b.state.mails.length, 0);
  });
  it('does not resend tickets that were already emailed', () => {
    b.state.quota = 10;
    b.post(VISITOR);
    b.reg.rows[1][0] = new Date(Date.now() - 10 * 60 * 1000);
    b.gs.sendPending();
    assert.equal(b.state.mails.length, 1);
  });
});

describe('when the mail service fails', () => {
  it('still issues the ticket', () => {
    b.state.failMail = true;
    assert.match(b.post(VISITOR).ticket, TICKET);
  });
  it('leaves the row for the sweep to retry', () => {
    b.state.failMail = true;
    b.post(VISITOR);
    assert.equal(b.row(1)['Ticket emailed at'], '');
  });
});

describe('unsubscribe link', () => {
  let token;
  beforeEach(() => { b.post(VISITOR); token = b.row(1).Token; });
  it('asks for confirmation first', () => {
    assert.match(b.get({ u: token }), /Confirm unsubscribe/);
  });
  it('does not unsubscribe before confirmation', () => {
    b.get({ u: token });
    assert.equal(b.row(1)['Unsubscribed at'], '');
  });
  it('records the unsubscribe once confirmed', () => {
    b.get({ u: token, confirm: '1' });
    assert.ok(b.row(1)['Unsubscribed at'] instanceof Date);
  });
  it('tells the visitor the ticket stays valid', () => {
    assert.match(b.get({ u: token, confirm: '1' }), /ticket stays valid/);
  });
  it('keeps the first unsubscribe date when confirmed twice', () => {
    b.get({ u: token, confirm: '1' });
    const at = b.row(1)['Unsubscribed at'];
    b.get({ u: token, confirm: '1' });
    assert.equal(b.row(1)['Unsubscribed at'], at);
  });
  it('rejects an unknown token', () => {
    assert.match(b.get({ u: '11111111-1111-1111-1111-111111111111', confirm: '1' }), /not valid/);
  });
  it('shows a neutral page without a token', () => {
    assert.match(b.get({}), /Ticket registration service/);
  });
  it('changes nothing for a malformed token', () => {
    b.get({ u: '"><script>', confirm: '1' });
    assert.equal(b.row(1)['Unsubscribed at'], '');
  });
});

describe('daily count email', () => {
  // Frozen at 9am Singapore time on 21 Nov 2026 (01:00 UTC).
  const NOW = Date.UTC(2026, 10, 21, 1, 0, 0);
  const sgt = (d, h) => new Date(Date.UTC(2026, 10, d, h - 8, 0, 0));
  beforeEach(() => { mock.timers.enable({ apis: ['Date'], now: NOW }); });
  afterEach(() => { mock.timers.reset(); });
  const add = (email, when, patch = {}) => { b.post({ ...VISITOR, email, ...patch }); b.reg.rows[b.count()][0] = when; };
  const report = () => { b.state.mails.length = 0; b.gs.dailyReport(); return b.state.mails[0]; };

  it('goes to every address on the Recipients tab', () => {
    b.recipients.rows.push(['second@example.com', '']);
    assert.equal(report().to, 'owner@example.com,second@example.com');
  });
  it('skips rows that are not email addresses', () => {
    b.recipients.rows.push(['not an address', ''], ['', ''], ['third@example.com', '']);
    assert.equal(report().to, 'owner@example.com,third@example.com');
  });
  it('is not sent when there are no recipients', () => {
    b.recipients.rows.length = 1;
    assert.equal(report(), undefined);
  });
  it('counts sign-ups made yesterday in Singapore time', () => {
    add('a@example.com', sgt(20, 0.5));    // 00:30 on the 20th
    add('b@example.com', sgt(20, 23.5));   // 23:30 on the 20th
    add('c@example.com', sgt(19, 23.5));   // the day before
    add('d@example.com', sgt(21, 0.5));    // today
    assert.match(report().body, /New on 20 Nov 2026: 2\n/);
  });
  it('gives the running total', () => {
    add('a@example.com', sgt(18, 12)); add('b@example.com', sgt(20, 12)); add('c@example.com', sgt(21, 8));
    assert.match(report().body, /Total: 3\n/);
  });
  it('breaks the total down by attendance type', () => {
    add('a@example.com', sgt(20, 12)); add('b@example.com', sgt(20, 12), { interest: 'trade' });
    add('c@example.com', sgt(20, 12), { interest: 'media' }); add('d@example.com', sgt(20, 12), { interest: 'media' });
    assert.match(report().body, /Visitor 1 · Trade 1 · Media 2/);
  });
  it('puts the counts in the subject line', () => {
    add('a@example.com', sgt(20, 12)); add('b@example.com', sgt(18, 12));
    assert.equal(report().subject, 'HiEnd Asia registrations · 20 Nov 2026 · 1 new, 2 total');
  });
  it('reports zero on a day with no sign-ups', () => {
    assert.match(report().body, /New on 20 Nov 2026: 0\nTotal: 0\n/);
  });
  it('counts unsubscribes', () => {
    add('a@example.com', sgt(20, 12));
    b.get({ u: b.row(1).Token, confirm: '1' });
    assert.match(report().body, /Unsubscribed: 1\n/);
  });
  it('contains no visitor names, emails or numbers', () => {
    add('a@example.com', sgt(20, 12));
    const m = report();
    const text = m.body + m.htmlBody + m.subject;
    assert.ok(!/Tan Wei Ming|a@example\.com|91234567/.test(text));
  });
  it('links to the Sheet', () => {
    assert.ok(report().htmlBody.includes('https://docs.example/registrations'));
  });
});
