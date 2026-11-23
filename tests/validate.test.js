// validateRegistration(): the one set of rules the form (in the browser) and the backend both apply.
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { loadBackend, VISITOR } = require('./helpers/gas-mock');

const { gs } = loadBackend();
const check = patch => gs.validateRegistration({ ...VISITOR, ...patch });
const good = patch => { const r = check(patch); assert.equal(r.ok, true, JSON.stringify(r)); return r.value; };
const bad = (patch, error) => assert.deepEqual({ ...check(patch) }, { ok: false, error });

describe('name', () => {
  it('accepts a two-letter name', () => { assert.equal(good({ name: 'Li' }).name, 'Li'); });
  it('collapses repeated spaces', () => { assert.equal(good({ name: ' Tan   Wei  Ming ' }).name, 'Tan Wei Ming'); });
  it('accepts Chinese names', () => { assert.equal(good({ name: '陈伟明' }).name, '陈伟明'); });
  it('accepts Thai names', () => { assert.equal(good({ name: 'สมชาย ใจดี' }).name, 'สมชาย ใจดี'); });
  it('accepts names with apostrophes and hyphens', () => { assert.equal(good({ name: "Mary-Ann O'Neil" }).name, "Mary-Ann O'Neil"); });
  it('rejects an empty name', () => bad({ name: '' }, 'name'));
  it('rejects a name of only spaces', () => bad({ name: '    ' }, 'name'));
  it('rejects a one-letter name', () => bad({ name: 'T' }, 'name'));
  it('rejects a missing name', () => bad({ name: undefined }, 'name'));
});

describe('email', () => {
  it('lower-cases the address', () => { assert.equal(good({ email: 'Wei.Ming@Example.COM' }).email, 'wei.ming@example.com'); });
  it('trims surrounding spaces', () => { assert.equal(good({ email: '  a@b.co ' }).email, 'a@b.co'); });
  it('accepts plus addressing', () => { assert.equal(good({ email: 'wei+show@example.com' }).email, 'wei+show@example.com'); });
  it('accepts a subdomain', () => { assert.equal(good({ email: 'wei@mail.example.com.sg' }).email, 'wei@mail.example.com.sg'); });
  it('rejects an address without @', () => bad({ email: 'weiming.example.com' }, 'email'));
  it('rejects an address without a dot in the domain', () => bad({ email: 'wei@localhost' }, 'email'));
  it('rejects an address with a space', () => bad({ email: 'wei ming@example.com' }, 'email'));
  it('rejects two addresses', () => bad({ email: 'a@example.com,b@example.com' }, 'email'));
  it('rejects an address starting with a formula sign', () => bad({ email: '=a@example.com' }, 'email'));
  it('rejects an empty address', () => bad({ email: '' }, 'email'));
});

describe('mobile number', () => {
  it('accepts a Singapore mobile starting with 9', () => { assert.equal(good({ phone: '91234567' }).phone, '91234567'); });
  it('accepts a Singapore mobile starting with 8', () => { assert.equal(good({ phone: '81234567' }).phone, '81234567'); });
  it('ignores spaces and dashes', () => { assert.equal(good({ phone: '9123-4567 ' }).phone, '91234567'); });
  it('accepts a Singapore number typed with +65', () => { assert.equal(good({ phone: '+65 9123 4567' }).phone, '91234567'); });
  it('accepts a Singapore number typed with 65 and no plus', () => { assert.equal(good({ phone: '6591234567' }).phone, '91234567'); });
  it('drops the leading zero of a foreign number', () => { assert.equal(good({ iso: 'MY', dial: '60', phone: '0123456789' }).phone, '123456789'); });
  it('accepts a foreign number typed with its country code', () => { assert.equal(good({ iso: 'MY', dial: '60', phone: '+60 12 345 6789' }).phone, '123456789'); });
  it('keeps a foreign number that merely starts with the same digits as its code', () => {
    assert.equal(good({ iso: 'US', dial: '1', phone: '1234567' }).phone, '1234567');
  });
  it('returns the country code as digits', () => { assert.equal(good({ dial: '+65' }).dial, '65'); });
  it('rejects a Singapore landline', () => bad({ phone: '61234567' }, 'phone'));
  it('rejects a seven-digit Singapore number', () => bad({ phone: '9123456' }, 'phone'));
  it('rejects a nine-digit Singapore number', () => bad({ phone: '912345678' }, 'phone'));
  it('rejects a foreign number under six digits', () => bad({ iso: 'MY', dial: '60', phone: '12345' }, 'phone'));
  it('rejects a number over fourteen digits', () => bad({ iso: 'MY', dial: '60', phone: '123456789012345' }, 'phone'));
  it('rejects letters', () => bad({ phone: 'call me' }, 'phone'));
  it('rejects a missing country code', () => bad({ dial: '' }, 'phone'));
  it('rejects an empty number', () => bad({ phone: '' }, 'phone'));
});

describe('attendance type', () => {
  for (const k of ['visitor', 'trade', 'media']) it('accepts ' + k, () => { assert.equal(good({ interest: k }).interest, k); });
  it('rejects none chosen', () => bad({ interest: '' }, 'interest'));
  it('rejects an unknown type', () => bad({ interest: 'vip' }, 'interest'));
});

describe('order of checks', () => {
  it('reports the name first when everything is wrong', () => bad({ name: '', email: '', phone: '', interest: '' }, 'name'));
  it('reports the email before the phone', () => bad({ email: '', phone: '', interest: '' }, 'email'));
  it('reports the phone before the attendance type', () => bad({ phone: '', interest: '' }, 'phone'));
  it('copes with no input at all', () => assert.deepEqual({ ...gs.validateRegistration() }, { ok: false, error: 'name' }));
});
