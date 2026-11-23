/**
 * HiEnd Asia 2026 – free ticket registration backend (Google Apps Script, bound to the registration Sheet).
 *
 * What it does:
 *   doPost         receives the form on register.html, adds a row, emails the ticket, returns the ticket to the page
 *   doGet          the unsubscribe link in every email
 *   dailyReport    9am Singapore time: yesterday's sign-ups and the running total, to the addresses on the Recipients tab
 *   sendPending    every 15 minutes: sends any ticket email that could not go out (for example, the daily sending limit)
 *   setup          run once by hand: creates the tabs, headers and timers
 *
 * Setup steps are in apps-script/README.md. Nothing here needs editing except CONFIG.
 */
var CONFIG = {
  SITE: 'https://christophertanenso.github.io/hiendasia-2026/',   // the show site (images and links in the email)
  FROM_NAME: 'HiEnd Asia',
  REPLY_TO: 'michelle@hiendasia.com',                              // replies and data-protection requests go here
  TICKET_PREFIX: 'HEA26-',
  CONSENT_VERSION: 'reg-1',                                        // raise when the consent wording on the form changes
  REPORT_HOUR: 9,                                                  // daily email, hour of day in TIMEZONE
  TIMEZONE: 'Asia/Singapore',
  SHEET_REG: 'Registrations',
  SHEET_RECIPIENTS: 'Recipients',
  SHEET_LOG: 'Check-in log',
  MAX_RESENDS: 5,                                                  // times one ticket can be emailed again
  BLINDBOX_UNTIL: '2026-12-06T00:00:00+08:00'                      // registered before this: the ticket email mentions the blind box
};

// The wording people agreed to, kept with the version so the Sheet shows exactly what each row consented to.
var CONSENT_TEXT = {
  'reg-1': 'By registering, you agree to receive news of HiEnd Asia and NOWASIA by email and WhatsApp. ' +
           'We do not call. We do not sell your details. You may unsubscribe at any time.'
};

var COLS = ['Registered at', 'Ticket', 'Name', 'Email', 'Mobile', 'Attending as', 'Country (phone)', 'Country (IP)',
  'Timezone', 'Language', 'Source', 'Medium', 'Campaign', 'On site', 'Device', 'Consent version', 'Consent wording',
  'Ticket emailed at', 'Resends', 'Unsubscribed at', 'Token', 'Check-ins', 'First check-in', 'Last check-in'];
var C = {};
COLS.forEach(function (name, i) { C[name] = i + 1; });

var INTERESTS = { visitor: 'Visitor', trade: 'Trade', media: 'Media' };
var LANGS = ['en', 'zh-Hans', 'zh-Hant', 'id', 'ms', 'fil', 'th', 'vi'];

// ---------- Web app ----------

function doPost(e) {
  var out;
  try {
    var d = JSON.parse(e.postData.contents);
    out = d && d.action === 'checkin' ? checkIn_(d) : register_(d);
  } catch (err) {
    console.error(err && err.stack || err);
    out = { ok: false, error: 'server' };
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  var token = String(e && e.parameter && e.parameter.u || '');
  var page = function (title, body) {
    return HtmlService.createHtmlOutput(
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<body style="margin:0;background:#000;color:#ebebeb;font:16px/1.7 Arial,sans-serif">' +
      '<div style="max-width:520px;margin:0 auto;padding:48px 20px">' +
      '<h1 style="font-size:26px;line-height:1.2;color:#f0d9a0;margin:0 0 12px">' + title + '</h1>' + body +
      '<p style="margin-top:32px"><a style="color:#f0d9a0" href="' + CONFIG.SITE + '" target="_top">hiendasia.com</a></p>' +
      '</div></body>').setTitle('HiEnd Asia');
  };
  if (!/^[0-9a-f-]{36}$/.test(token)) return page('HiEnd Asia 2026', '<p>Ticket registration service.</p>');
  var sheet = regSheet_();
  var row = findRow_(sheet, C['Token'], token);
  if (!row) return page('Link not recognised', '<p>This unsubscribe link is not valid. Write to ' + CONFIG.REPLY_TO + ' and we will remove you.</p>');
  if (e.parameter.confirm !== '1') {
    var url = ScriptApp.getService().getUrl() + '?u=' + token + '&confirm=1';
    return page('Unsubscribe', '<p>Stop news of HiEnd Asia and NOWASIA by email and WhatsApp. Your ticket stays valid.</p>' +
      '<p><a href="' + url + '" target="_top" style="display:inline-block;background:#c6a661;color:#000;font-weight:700;' +
      'text-decoration:none;padding:14px 26px;border-radius:50px">Confirm unsubscribe</a></p>');
  }
  var cell = sheet.getRange(row, C['Unsubscribed at']);
  if (!cell.getValue()) cell.setValue(new Date());
  return page('Unsubscribed', '<p>You will receive no further news from us. Your ticket stays valid.</p>');
}

// ---------- Registration ----------

function clean_(v, max) {
  // Trimmed single-line text. A leading = + - @ is dropped so a value can never run as a spreadsheet formula.
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim()
    .replace(/^[=+\-@\s]+/, '').slice(0, max);
}

function register_(d) {
  d = d || {};
  if (clean_(d.website, 50)) return { ok: true, resent: true };   // honeypot: bots fill it, people never see it

  var checked = validateRegistration(d);
  if (!checked.ok) return { ok: false, error: checked.error };
  var name = clean_(checked.value.name, 80);
  if (name.length < 2) return { ok: false, error: 'name' };
  var email = checked.value.email, dial = checked.value.dial, national = checked.value.phone;
  var iso = /^[A-Z]{2}$/.test(d.iso) ? d.iso : '';
  var interest = INTERESTS[checked.value.interest];
  var phone = '+' + dial + national;
  var lang = LANGS.indexOf(d.lang) >= 0 ? d.lang : 'en';

  var sheet = regSheet_();
  var lock = LockService.getScriptLock();
  lock.waitLock(25000);
  var ticket, token, registered = new Date(), existing = false, sameVisitor = true, canSend = true;
  try {
    var row = findRow_(sheet, C['Email'], email);
    if (row) {
      // Already registered: the same ticket goes out again. Nothing new is written.
      existing = true;
      var v = sheet.getRange(row, 1, 1, COLS.length).getValues()[0];
      ticket = v[C['Ticket'] - 1]; token = v[C['Token'] - 1]; registered = v[C['Registered at'] - 1];
      var storedName = String(v[C['Name'] - 1]);
      // Older rows hold the mobile as a number (6591234567): Sheets dropped the +. Compare the digits.
      sameVisitor = storedName.toLowerCase() === name.toLowerCase() && String(v[C['Mobile'] - 1]).replace(/^\+/, '') === phone.slice(1);
      name = storedName; lang = v[C['Language'] - 1] || lang;
      var resends = Number(v[C['Resends'] - 1]) || 0;
      canSend = resends < CONFIG.MAX_RESENDS;
      if (canSend) sheet.getRange(row, C['Resends']).setValue(resends + 1);
    } else {
      ticket = newTicket_(sheet);
      token = Utilities.getUuid();
      var r = [];
      r[C['Registered at'] - 1] = registered;
      r[C['Ticket'] - 1] = ticket;
      r[C['Name'] - 1] = name;
      r[C['Email'] - 1] = email;
      r[C['Mobile'] - 1] = "'" + phone;   // the apostrophe keeps it text; without it Sheets drops the +
      r[C['Attending as'] - 1] = interest;
      r[C['Country (phone)'] - 1] = iso;
      r[C['Country (IP)'] - 1] = /^[A-Z]{2}$/.test(d.ipCountry) ? d.ipCountry : '';
      r[C['Timezone'] - 1] = clean_(d.tz, 40);
      r[C['Language'] - 1] = lang;
      r[C['Source'] - 1] = clean_(d.source, 60);
      r[C['Medium'] - 1] = clean_(d.medium, 60);
      r[C['Campaign'] - 1] = clean_(d.campaign, 60);
      r[C['On site'] - 1] = clean_(d.here, 30);
      r[C['Device'] - 1] = d.device === 'phone' ? 'phone' : d.device === 'desktop' ? 'desktop' : '';
      r[C['Consent version'] - 1] = CONFIG.CONSENT_VERSION;
      r[C['Consent wording'] - 1] = CONSENT_TEXT[CONFIG.CONSENT_VERSION];
      r[C['Ticket emailed at'] - 1] = '';
      r[C['Resends'] - 1] = 0;
      r[C['Unsubscribed at'] - 1] = '';
      r[C['Token'] - 1] = token;
      sheet.appendRow(r);
    }
  } finally {
    lock.releaseLock();
  }

  if (canSend) {
    var sent = sendTicket_({ name: name, email: email, ticket: ticket, token: token, lang: lang, registered: registered });
    if (sent && !existing) markEmailed_(sheet, ticket);
  }
  // A repeat registration only shows the ticket on screen to the person who holds it (same name and mobile).
  if (existing && !sameVisitor) return { ok: true, resent: true };
  return { ok: true, resent: existing, ticket: ticket, name: name };
}

// ---------- Door check-in ----------
// The ticket's QR code opens in.html on the site. On a staff phone (one that has the door PIN) that page posts
// { action: 'checkin', ticket, pin } here. The PIN is a Script property, DOOR_PIN, never in this file: the repo is public.

var DOOR_MAX_FAILS = 10;               // wrong PINs before the door stops accepting any for 15 minutes
var DOOR_REPEAT_MS = 2 * 60 * 1000;    // a second scan of the same ticket within this time is not a new visit

function checkIn_(d) {
  var pin = PropertiesService.getScriptProperties().getProperty('DOOR_PIN');
  if (!pin) return { ok: false, error: 'closed' };
  var cache = CacheService.getScriptCache(), fails = Number(cache.get('door-fails')) || 0;
  if (fails >= DOOR_MAX_FAILS) return { ok: false, error: 'locked' };
  if (String(d.pin == null ? '' : d.pin).trim() !== String(pin).trim()) {
    cache.put('door-fails', String(fails + 1), 900);
    return { ok: false, error: 'pin' };
  }
  var ticket = String(d.ticket == null ? '' : d.ticket).replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z0-9-]{6,20}$/.test(ticket)) return { ok: false, error: 'ticket' };

  var sheet = regSheet_(), lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try {
    var row = findRow_(sheet, C['Ticket'], ticket);
    if (!row) return { ok: false, error: 'ticket' };
    var v = sheet.getRange(row, 1, 1, COLS.length).getValues()[0];
    var now = new Date(), visits = Number(v[C['Check-ins'] - 1]) || 0, last = v[C['Last check-in'] - 1];
    var out = { ok: true, ticket: ticket, name: String(v[C['Name'] - 1]), interest: String(v[C['Attending as'] - 1]),
      visits: visits, repeat: false };
    if (visits && last && now - new Date(last) < DOOR_REPEAT_MS) { out.repeat = true; return out; }
    out.visits = ++visits;
    sheet.getRange(row, C['Check-ins']).setValue(visits);
    if (!v[C['First check-in'] - 1]) sheet.getRange(row, C['First check-in']).setValue(now);
    sheet.getRange(row, C['Last check-in']).setValue(now);
    logSheet_().appendRow([now, ticket, out.name, out.interest, visits]);
    return out;
  } finally {
    lock.releaseLock();
  }
}

function logSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var s = ss.getSheetByName(CONFIG.SHEET_LOG);
  if (!s) {
    s = ss.insertSheet(CONFIG.SHEET_LOG);
    s.appendRow(['Checked in at', 'Ticket', 'Name', 'Attending as', 'Visit']);
  }
  return s;
}

function regSheet_() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_REG);
  if (!s) throw new Error('Run setup() first: no "' + CONFIG.SHEET_REG + '" tab.');
  return s;
}

function findRow_(sheet, col, value) {
  if (sheet.getLastRow() < 2 || value === '') return 0;
  var hit = sheet.getRange(2, col, sheet.getLastRow() - 1, 1).createTextFinder(String(value)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : 0;
}

function newTicket_(sheet) {
  var abc = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';   // no 0/O or 1/I, so a ticket number reads cleanly aloud
  for (var tries = 0; tries < 20; tries++) {
    var id = CONFIG.TICKET_PREFIX;
    for (var i = 0; i < 6; i++) id += abc.charAt(Math.floor(Math.random() * abc.length));
    if (!findRow_(sheet, C['Ticket'], id)) return id;
  }
  throw new Error('Could not make a ticket number');
}

function markEmailed_(sheet, ticket) {
  var row = findRow_(sheet, C['Ticket'], ticket);   // looked up again: someone may have sorted the Sheet meanwhile
  if (row) sheet.getRange(row, C['Ticket emailed at']).setValue(new Date());
}

// ---------- Ticket email ----------

var MAIL = {
  en: {
    subject: 'Your ticket · HiEnd Asia 2026',
    head: function (n) { return n + ', your ticket is confirmed.'; },
    lead: 'Present it at the entrance on any day of the show. It admits one.',
    admit: 'Admit one · Free entry',
    when: '17 – 19 Dec 2026 · 10am – 7pm daily',
    where: 'Level 3, Suntec Singapore Convention & Exhibition Centre',
    site: 'Programme, floorplan and directions',
    bbH: 'Mystery blind box',
    bb: 'A sealed box holding one HiEnd Asia commemorative CD. Three winners are drawn daily at 5pm during the show. Keep this email. Bring it with valid ID to collect a draw ticket at the show.',
    why: 'You are receiving news of HiEnd Asia and NOWASIA by email and WhatsApp because you registered for this ticket. We do not call. We do not sell your details.',
    unsub: 'Unsubscribe', privacy: 'Privacy notice'
  },
  'zh-Hans': {
    subject: '您的门票 · HiEnd Asia 2026',
    head: function (n) { return n + '，您的门票已确认。'; },
    lead: '展会三日内任何一天，请于入口处出示。每张门票限一人。',
    admit: '限一人 · 免费入场',
    when: '2026年12月17 – 19日 · 每日上午10时 – 晚上7时',
    where: '新达城新加坡国际会议与展览中心 三楼',
    site: '活动日程、展位图与路线',
    bbH: '神秘盲盒',
    bb: '密封盒内装有一张 HiEnd Asia 纪念 CD，展会期间每日下午5时抽出三名得主。请保留此电邮，凭此电邮及有效身份证件于展会现场领取抽奖券。',
    why: '您已登记领取门票，因此将通过电邮和 WhatsApp 收到 HiEnd Asia 与 NOWASIA 的资讯。我们不会致电，也不会出售您的资料。',
    unsub: '退订', privacy: '隐私声明'
  },
  'zh-Hant': {
    subject: '您的門票 · HiEnd Asia 2026',
    head: function (n) { return n + '，您的門票已確認。'; },
    lead: '展會三日內任何一天，請於入口處出示。每張門票限一人。',
    admit: '限一人 · 免費入場',
    when: '2026年12月17 – 19日 · 每日上午10時 – 晚上7時',
    where: '新達城新加坡國際會議與展覽中心 三樓',
    site: '活動日程、展位圖與路線',
    bbH: '神秘盲盒',
    bb: '密封盒內裝有一張 HiEnd Asia 紀念 CD，展會期間每日下午5時抽出三名得主。請保留此電郵，憑此電郵及有效身分證件於展會現場領取抽獎券。',
    why: '您已登記領取門票，因此將透過電郵和 WhatsApp 收到 HiEnd Asia 與 NOWASIA 的資訊。我們不會致電，也不會出售您的資料。',
    unsub: '取消訂閱', privacy: '私隱聲明'
  }
};

function esc_(s) {
  return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; });
}

function ticketHtml_(p) {
  var t = MAIL[p.lang] || MAIL.en;
  var langPath = p.lang === 'zh-Hans' || p.lang === 'zh-Hant' ? p.lang + '/' : '';
  var site = CONFIG.SITE + langPath + '?utm_source=ticket&utm_medium=email&utm_campaign=registration';
  var unsub = ScriptApp.getService().getUrl() + '?u=' + p.token;
  var font = 'font-family:Arial,Helvetica,sans-serif;';
  return '<div style="background:#000000;margin:0;padding:0">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#000000"><tr><td align="center" style="padding:24px 12px">' +
    '<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#000000">' +
    '<tr><td><img src="' + CONFIG.SITE + 'img/og-2026.jpg" width="560" alt="HiEnd Asia 2026 · 2026 Singapore Hi-End Asia International Audio Visual Show" ' +
      'style="display:block;width:100%;height:auto;border:0;border-radius:12px"></td></tr>' +
    '<tr><td style="padding:28px 8px 8px;' + font + 'color:#f0d9a0;font-size:24px;line-height:1.25;font-weight:bold">' + esc_(t.head(p.name)) + '</td></tr>' +
    '<tr><td style="padding:0 8px 20px;' + font + 'color:#d2c8b4;font-size:15px;line-height:1.6">' + esc_(t.lead) + '</td></tr>' +
    '<tr><td style="padding:0 8px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="background:#201d17;border:1px solid #c6a661;border-radius:12px"><tr><td align="center" style="padding:22px 16px">' +
      '<div style="' + font + 'color:#c6a661;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold">' + esc_(t.admit) + '</div>' +
      '<div style="' + font + 'color:#f0d9a0;font-size:24px;line-height:1.3;font-weight:bold;padding:8px 0 4px">' + esc_(p.name) + '</div>' +
      '<div style="font-family:Menlo,Consolas,monospace;color:#c6a661;font-size:15px;letter-spacing:2px">' + esc_(p.ticket) + '</div>' +
      '<div style="padding:16px 0"><img src="cid:qr" width="180" height="180" alt="' + esc_(p.ticket) + '" style="display:block;margin:0 auto;border:8px solid #ffffff;border-radius:8px;background:#ffffff"></div>' +
      '<div style="border-top:1px dashed #4f4632;padding-top:14px;' + font + 'color:#d2c8b4;font-size:14px;line-height:1.6">' +
        esc_(t.when) + '<br>' + esc_(t.where) + '</div>' +
    '</td></tr></table></td></tr>' +
    (blindBox_(p) ? '<tr><td style="padding:24px 8px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" ' +
      'style="border:1px solid #4f4632;border-radius:12px"><tr><td style="padding:18px 20px;' + font + 'color:#d2c8b4;font-size:14px;line-height:1.6">' +
      '<div style="color:#c6a661;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;padding-bottom:6px">' + esc_(t.bbH) + '</div>' +
      esc_(t.bb) + '</td></tr></table></td></tr>' : '') +
    '<tr><td align="center" style="padding:24px 8px"><a href="' + site + '" style="display:inline-block;border:1px solid #c6a661;border-radius:50px;' +
      'padding:13px 26px;' + font + 'color:#f0d9a0;font-size:13px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none">' + esc_(t.site) + '</a></td></tr>' +
    '<tr><td style="padding:16px 8px 0;border-top:1px solid #4f4632;' + font + 'color:#a89f8c;font-size:12px;line-height:1.6">' + esc_(t.why) +
      ' <a href="' + unsub + '" style="color:#f0d9a0">' + esc_(t.unsub) + '</a> · <a href="' + CONFIG.SITE + 'privacy.html" style="color:#f0d9a0">' + esc_(t.privacy) + '</a>' +
      '<br>HiEnd Asia + Pte. Ltd · 1093 Lower Delta Road #02-09, Singapore 169204</td></tr>' +
    '</table></td></tr></table></div>';
}

/** True when this visitor registered in time for the blind box draw. */
function blindBox_(p) {
  return !!p.registered && new Date(p.registered) < new Date(CONFIG.BLINDBOX_UNTIL);
}

function sendTicket_(p) {
  try {
    if (MailApp.getRemainingDailyQuota() < 1) return false;   // sendPending picks it up when the limit resets
    var t = MAIL[p.lang] || MAIL.en;
    MailApp.sendEmail({
      to: p.email,
      subject: t.subject,
      name: CONFIG.FROM_NAME,
      replyTo: CONFIG.REPLY_TO,
      body: t.head(p.name) + '\n' + t.lead + '\n\n' + p.name + '\n' + p.ticket + '\n' + t.when + '\n' + t.where + '\n\n' +
        (blindBox_(p) ? t.bbH + '\n' + t.bb + '\n\n' : '') + t.why + '\n' + t.unsub + ': ' + ScriptApp.getService().getUrl() + '?u=' + p.token,
      htmlBody: ticketHtml_(p),
      inlineImages: { qr: qrPng_(checkinUrl(CONFIG.SITE, p.ticket)) }
    });
    return true;
  } catch (err) {
    console.error('Ticket email failed for ' + p.ticket + ': ' + err);
    return false;
  }
}

/** Timer, every 15 minutes: tickets registered while email could not be sent. */
function sendPending() {
  var sheet = regSheet_(), last = sheet.getLastRow();
  if (last < 2) return;
  var rows = sheet.getRange(2, 1, last - 1, COLS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    var v = rows[i];
    if (v[C['Ticket emailed at'] - 1] || !v[C['Ticket'] - 1] || !v[C['Email'] - 1]) continue;
    if (new Date() - new Date(v[C['Registered at'] - 1]) < 2 * 60 * 1000) continue;   // doPost may still be sending it
    if (MailApp.getRemainingDailyQuota() < 1) return;
    var ok = sendTicket_({ name: v[C['Name'] - 1], email: v[C['Email'] - 1], ticket: v[C['Ticket'] - 1],
      token: v[C['Token'] - 1], lang: v[C['Language'] - 1], registered: v[C['Registered at'] - 1] });
    if (ok) markEmailed_(sheet, v[C['Ticket'] - 1]);
  }
}

// ---------- Daily count email ----------

function recipients_() {
  var s = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_RECIPIENTS);
  if (!s || s.getLastRow() < 2) return [];
  return s.getRange(2, 1, s.getLastRow() - 1, 1).getValues()
    .map(function (r) { return String(r[0]).trim(); })
    .filter(function (a) { return /^[^@\s,]+@[^@\s,]+\.[^@\s,]+$/.test(a); });
}

/** Timer, daily at CONFIG.REPORT_HOUR: counts only, no visitor details. */
function dailyReport() {
  var to = recipients_();
  if (!to.length) return;
  var sheet = regSheet_(), last = sheet.getLastRow();
  var rows = last < 2 ? [] : sheet.getRange(2, 1, last - 1, COLS.length).getValues();
  var day = function (d) { return Utilities.formatDate(new Date(d), CONFIG.TIMEZONE, 'yyyy-MM-dd'); };
  var yesterday = day(new Date().getTime() - 24 * 60 * 60 * 1000);
  var total = 0, yCount = 0, unsub = 0, pending = 0, by = { Visitor: 0, Trade: 0, Media: 0 };
  rows.forEach(function (v) {
    if (!v[C['Ticket'] - 1]) return;
    total++;
    if (v[C['Registered at'] - 1] && day(v[C['Registered at'] - 1]) === yesterday) yCount++;
    if (by[v[C['Attending as'] - 1]] !== undefined) by[v[C['Attending as'] - 1]]++;
    if (v[C['Unsubscribed at'] - 1]) unsub++;
    if (!v[C['Ticket emailed at'] - 1]) pending++;
  });
  var label = Utilities.formatDate(new Date(new Date().getTime() - 24 * 60 * 60 * 1000), CONFIG.TIMEZONE, 'd MMM yyyy');
  var url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  var n = function (x) { return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ','); };
  var cell = function (k, v) {
    return '<td style="padding:14px 18px;background:#f4f1ea;border-radius:8px"><div style="font-size:12px;color:#6b6455">' + k +
      '</div><div style="font-size:28px;font-weight:bold;color:#1a1814">' + v + '</div></td>';
  };
  MailApp.sendEmail({
    to: to.join(','),
    name: CONFIG.FROM_NAME,
    subject: 'HiEnd Asia registrations · ' + label + ' · ' + n(yCount) + ' new, ' + n(total) + ' total',
    body: 'New on ' + label + ': ' + yCount + '\nTotal: ' + total + '\nVisitor ' + by.Visitor + ' · Trade ' + by.Trade +
      ' · Media ' + by.Media + '\nUnsubscribed: ' + unsub + '\nTicket emails waiting: ' + pending + '\n' + url,
    htmlBody: '<div style="font-family:Arial,Helvetica,sans-serif;color:#1a1814;max-width:520px">' +
      '<p style="font-size:15px;margin:0 0 14px">HiEnd Asia 2026 ticket registrations.</p>' +
      '<table role="presentation" cellpadding="0" cellspacing="8" style="margin:0 -8px"><tr>' +
      cell('New on ' + label, n(yCount)) + cell('Total', n(total)) + '</tr></table>' +
      '<p style="font-size:14px;color:#3d382e;line-height:1.7;margin:14px 0">Visitor ' + n(by.Visitor) + ' · Trade ' + n(by.Trade) + ' · Media ' + n(by.Media) +
      '<br>Unsubscribed: ' + n(unsub) + (pending ? '<br>Ticket emails waiting to send: ' + n(pending) : '') + '</p>' +
      '<p style="font-size:14px"><a href="' + url + '">Open the registration sheet</a></p>' +
      '<p style="font-size:12px;color:#6b6455">Recipients are listed on the "' + CONFIG.SHEET_RECIPIENTS + '" tab of the sheet.</p></div>'
  });
}

// ---------- One-time setup ----------

/** Run once from the Apps Script editor. Safe to run again: it never clears data. */
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetTimeZone(CONFIG.TIMEZONE);
  var reg = ss.getSheetByName(CONFIG.SHEET_REG) || ss.insertSheet(CONFIG.SHEET_REG, 0);
  reg.getRange(1, 1, 1, COLS.length).setValues([COLS]).setFontWeight('bold');
  reg.setFrozenRows(1);
  reg.getRange(2, 2, reg.getMaxRows() - 1, COLS.length - 1).setNumberFormat('@');   // text, so +65… and ticket numbers stay as typed
  reg.getRange(2, C['Registered at'], reg.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  [C['Ticket emailed at'], C['Unsubscribed at']].forEach(function (c) {
    reg.getRange(2, c, reg.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  });
  reg.getRange(2, C['Resends'], reg.getMaxRows() - 1, 1).setNumberFormat('0');
  reg.hideColumns(C['Token']);
  reg.getRange(2, C['Check-ins'], reg.getMaxRows() - 1, 1).setNumberFormat('0');
  [C['First check-in'], C['Last check-in']].forEach(function (c) {
    reg.getRange(2, c, reg.getMaxRows() - 1, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  });
  logSheet_();

  var rec = ss.getSheetByName(CONFIG.SHEET_RECIPIENTS) || ss.insertSheet(CONFIG.SHEET_RECIPIENTS);
  if (!rec.getRange(1, 1).getValue()) {
    rec.getRange(1, 1, 1, 2).setValues([['Daily count email goes to', 'Note']]).setFontWeight('bold');
    rec.getRange(2, 1, 1, 2).setValues([[Session.getEffectiveUser().getEmail(), 'One address per row. Add or remove rows at any time.']]);
    rec.setFrozenRows(1);
    rec.setColumnWidth(1, 280); rec.setColumnWidth(2, 380);
  }

  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'dailyReport' || t.getHandlerFunction() === 'sendPending') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('dailyReport').timeBased().everyDays(1).atHour(CONFIG.REPORT_HOUR).inTimezone(CONFIG.TIMEZONE).create();
  ScriptApp.newTrigger('sendPending').timeBased().everyMinutes(15).create();
}

/** Run by hand to see the ticket email: sends a sample to your own address. */
function sendSampleTicket() {
  var me = Session.getEffectiveUser().getEmail();
  sendTicket_({ name: 'Tan Wei Ming', email: me, ticket: CONFIG.TICKET_PREFIX + '7K3M9Q', token: '00000000-0000-0000-0000-000000000000', lang: 'en', registered: new Date() });
}

// ---------- Shared with the web page ----------
// build.py copies the two marked blocks below into register.html, so the form and this script apply the same rules
// and draw the same QR code. Keep them free of Apps Script calls and of anything a browser does not have.

// <validate>
/* The rules for a registration. Returns { ok: true, value: { name, email, dial, phone, interest } } with the tidied
   values (phone is the national number, digits only), or { ok: false, error } naming the first field that fails:
   'name', 'email', 'phone' or 'interest'. */
function validateRegistration(d) {
  d = d || {};
  var name = String(d.name == null ? '' : d.name).replace(/\s+/g, ' ').trim();
  if (name.length < 2) return { ok: false, error: 'name' };

  var email = String(d.email == null ? '' : d.email).trim().toLowerCase();
  if (email.length > 120 || !/^[a-z0-9][a-z0-9._%+-]*@[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(email)) return { ok: false, error: 'email' };

  var dial = String(d.dial == null ? '' : d.dial).replace(/\D/g, '').slice(0, 4);
  var typed = String(d.phone == null ? '' : d.phone).trim();
  var digits = typed.replace(/\D/g, '');
  // Singapore mobiles are 8 digits starting 8 or 9 (WhatsApp needs a mobile); elsewhere only the length is checked.
  function valid(n) { return dial === '65' ? /^[89]\d{7}$/.test(n) : n.length >= 6 && n.length <= 14; }
  function national(n) { return n.replace(/^0+/, ''); }
  // A number typed in full ("+65 9123 4567", "0065…", or "6591234567" where that cannot be a local number) loses its country code.
  var international = /^(\+|00)/.test(typed);
  if (/^00/.test(typed)) digits = digits.replace(/^00/, '');
  if (dial && digits.indexOf(dial) === 0 && (international || !valid(national(digits)))) {
    var rest = national(digits.slice(dial.length));
    if (valid(rest)) digits = rest;
  }
  digits = national(digits);
  if (!dial || !valid(digits)) return { ok: false, error: 'phone' };

  var interest = String(d.interest == null ? '' : d.interest);
  if (interest !== 'visitor' && interest !== 'trade' && interest !== 'media') return { ok: false, error: 'interest' };

  return { ok: true, value: { name: name, email: email, dial: dial, phone: digits, interest: interest } };
}
// </validate>


// <qr>
/* What the ticket's QR code holds: the site's door page for that ticket. A phone camera opens it; on a staff
   phone the page checks the visitor in (in.html, apps-script checkIn_). */
function checkinUrl(site, ticket) {
  return site + 'in.html?t=' + encodeURIComponent(ticket);
}

/* QR code, versions 1 to 6 (21 x 21 up to 41 x 41), error correction M, byte mode, the smallest version that fits:
   up to 106 characters. A ticket number fits version 1; the check-in link needs version 5.
   Returns N rows of N numbers, 1 = dark. */
function qrMatrix(text) {
  // Level M, per version: [blocks, data codewords per block, error-correction codewords per block]
  var SPEC = [null, [1, 16, 10], [1, 28, 16], [1, 44, 26], [2, 32, 18], [2, 43, 24], [4, 27, 16]];
  var i, j, x, y, b, V = 1, bytes = [];
  for (i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 255);
  while (V <= 6 && SPEC[V][0] * SPEC[V][1] - 2 < bytes.length) V++;
  if (V > 6) throw new Error('QR text too long');
  var N = 17 + 4 * V, NB = SPEC[V][0], DATA = SPEC[V][1], EC = SPEC[V][2], TOTAL = NB * DATA;

  // Bit stream: mode 0100, 8-bit length, data, terminator, padding
  var bits = [];
  function put(v, n) { for (var k = n - 1; k >= 0; k--) bits.push((v >>> k) & 1); }
  put(4, 4); put(bytes.length, 8);
  for (i = 0; i < bytes.length; i++) put(bytes[i], 8);
  put(0, Math.min(4, TOTAL * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  for (i = 0; bits.length < TOTAL * 8; i++) put(i % 2 ? 0x11 : 0xEC, 8);
  var cw = [];
  for (i = 0; i < TOTAL; i++) { var v = 0; for (j = 0; j < 8; j++) v = (v << 1) | bits[i * 8 + j]; cw.push(v); }

  // Reed-Solomon over GF(256), polynomial 0x11D, one code word per block
  function mul(a, c) { var z = 0; for (var k = 7; k >= 0; k--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((c >>> k) & 1) * a; } return z; }
  var gen = [], root = 1;
  for (i = 0; i < EC - 1; i++) gen.push(0);
  gen.push(1);
  for (i = 0; i < EC; i++) {
    for (j = 0; j < EC; j++) { gen[j] = mul(gen[j], root); if (j + 1 < EC) gen[j] ^= gen[j + 1]; }
    root = mul(root, 2);
  }
  function ecOf(data) {
    var rem = [];
    for (var k = 0; k < EC; k++) rem.push(0);
    for (k = 0; k < data.length; k++) {
      var f = data[k] ^ rem.shift(); rem.push(0);
      for (var q = 0; q < EC; q++) rem[q] ^= mul(gen[q], f);
    }
    return rem;
  }
  // Blocks are interleaved: the first codeword of every block, then the second, and so on; then the same for EC.
  var blocks = [], ecs = [], all = [];
  for (b = 0; b < NB; b++) { blocks.push(cw.slice(b * DATA, (b + 1) * DATA)); ecs.push(ecOf(blocks[b])); }
  for (i = 0; i < DATA; i++) for (b = 0; b < NB; b++) all.push(blocks[b][i]);
  for (i = 0; i < EC; i++) for (b = 0; b < NB; b++) all.push(ecs[b][i]);

  // Function patterns
  var m = [], fn = [];
  for (y = 0; y < N; y++) { m.push([]); fn.push([]); for (x = 0; x < N; x++) { m[y].push(0); fn[y].push(0); } }
  function set(xx, yy, dark) { m[yy][xx] = dark ? 1 : 0; fn[yy][xx] = 1; }
  function finder(cx, cy) {
    for (var dy = -4; dy <= 4; dy++) for (var dx = -4; dx <= 4; dx++) {
      var d = Math.max(Math.abs(dx), Math.abs(dy)), xx = cx + dx, yy = cy + dy;
      if (xx >= 0 && xx < N && yy >= 0 && yy < N) set(xx, yy, d !== 2 && d !== 4);
    }
  }
  for (i = 0; i < N; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  finder(3, 3); finder(N - 4, 3); finder(3, N - 4);
  if (V > 1) {   // versions 2 to 6 have one alignment pattern, centred 7 modules in from the bottom-right corner
    for (var ay = -2; ay <= 2; ay++) for (var ax = -2; ax <= 2; ax++) set(N - 7 + ax, N - 7 + ay, Math.max(Math.abs(ax), Math.abs(ay)) !== 1);
  }
  function format(mask) {
    var data = mask, r = data;   // error correction M has format bits 00
    for (var k = 0; k < 10; k++) r = (r << 1) ^ ((r >>> 9) * 0x537);
    var fb = ((data << 10) | r) ^ 0x5412;
    function bit(k) { return (fb >>> k) & 1; }
    for (k = 0; k <= 5; k++) set(8, k, bit(k));
    set(8, 7, bit(6)); set(8, 8, bit(7)); set(7, 8, bit(8));
    for (k = 9; k < 15; k++) set(14 - k, 8, bit(k));
    for (k = 0; k < 8; k++) set(N - 1 - k, 8, bit(k));
    for (k = 8; k < 15; k++) set(8, N - 15 + k, bit(k));
    set(8, N - 8, 1);
  }
  format(0);   // reserves the format cells before the data is laid out

  // Data, in the zigzag from the bottom-right corner
  var n = 0;
  for (var right = N - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (var vert = 0; vert < N; vert++) {
      for (j = 0; j < 2; j++) {
        x = right - j;
        y = ((right + 1) & 2) === 0 ? N - 1 - vert : vert;
        if (!fn[y][x] && n < all.length * 8) { m[y][x] = (all[n >>> 3] >>> (7 - (n & 7))) & 1; n++; }
      }
    }
  }

  var MASKS = [
    function (x, y) { return (x + y) % 2 === 0; }, function (x, y) { return y % 2 === 0; },
    function (x, y) { return x % 3 === 0; }, function (x, y) { return (x + y) % 3 === 0; },
    function (x, y) { return (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; },
    function (x, y) { return (x * y) % 2 + (x * y) % 3 === 0; },
    function (x, y) { return ((x * y) % 2 + (x * y) % 3) % 2 === 0; },
    function (x, y) { return ((x + y) % 2 + (x * y) % 3) % 2 === 0; }
  ];
  function applyMask(k) {
    for (var yy = 0; yy < N; yy++) for (var xx = 0; xx < N; xx++) if (!fn[yy][xx] && MASKS[k](xx, yy)) m[yy][xx] ^= 1;
  }
  function penalty() {
    var p = 0, a, b, run, dark = 0, line, k;
    for (a = 0; a < N; a++) {
      for (var dir = 0; dir < 2; dir++) {
        line = [];
        for (b = 0; b < N; b++) line.push(dir ? m[b][a] : m[a][b]);
        run = 1;
        for (b = 1; b <= N; b++) {
          if (b < N && line[b] === line[b - 1]) run++;
          else { if (run >= 5) p += run - 2; run = 1; }
        }
        var s = line.join('');
        for (k = 0; k + 11 <= N; k++) {
          var w = s.substr(k, 11);
          if (w === '10111010000' || w === '00001011101') p += 40;
        }
      }
    }
    for (a = 0; a < N - 1; a++) for (b = 0; b < N - 1; b++) {
      if (m[a][b] === m[a][b + 1] && m[a][b] === m[a + 1][b] && m[a][b] === m[a + 1][b + 1]) p += 3;
    }
    for (a = 0; a < N; a++) for (b = 0; b < N; b++) dark += m[a][b];
    p += Math.floor(Math.abs(dark * 20 - N * N * 10) / (N * N)) * 10;
    return p;
  }
  var best = 0, bestScore = Infinity;
  for (var k = 0; k < 8; k++) {
    applyMask(k); format(k);
    var sc = penalty();
    if (sc < bestScore) { bestScore = sc; best = k; }
    applyMask(k);
  }
  applyMask(best); format(best);
  return m;
}
// </qr>

/** The QR code as a PNG (1 bit per pixel, written by hand: Apps Script has no image library). */
function qrPng_(text) {
  var m = qrMatrix(text), scale = 10, quiet = 4, n = m.length, size = (n + quiet * 2) * scale;
  var rowBytes = Math.ceil(size / 8), raw = [], x, y;
  for (y = 0; y < size; y++) {
    raw.push(0);   // filter: none
    var row = [];
    for (x = 0; x < rowBytes; x++) row.push(255);   // white
    var my = Math.floor(y / scale) - quiet;
    if (my >= 0 && my < n) {
      for (x = 0; x < size; x++) {
        var mx = Math.floor(x / scale) - quiet;
        if (mx >= 0 && mx < n && m[my][mx]) row[x >> 3] &= ~(128 >> (x & 7));
      }
    }
    for (x = 0; x < rowBytes; x++) raw.push(row[x] & 255);
  }
  var crcTable = [];
  for (var c = 0; c < 256; c++) { var k = c; for (var b = 0; b < 8; b++) k = k & 1 ? 0xEDB88320 ^ (k >>> 1) : k >>> 1; crcTable.push(k >>> 0); }
  function crc(arr) { var v = 0xFFFFFFFF; for (var i = 0; i < arr.length; i++) v = crcTable[(v ^ arr[i]) & 255] ^ (v >>> 8); return (v ^ 0xFFFFFFFF) >>> 0; }
  function u32(v) { return [(v >>> 24) & 255, (v >>> 16) & 255, (v >>> 8) & 255, v & 255]; }
  function chunk(type, data) {
    var td = [type.charCodeAt(0), type.charCodeAt(1), type.charCodeAt(2), type.charCodeAt(3)].concat(data);
    return u32(data.length).concat(td, u32(crc(td)));
  }
  // zlib stream of stored (uncompressed) blocks
  var z = [0x78, 0x01], s1 = 1, s2 = 0, i;
  for (i = 0; i < raw.length; i++) { s1 = (s1 + raw[i]) % 65521; s2 = (s2 + s1) % 65521; }
  for (var off = 0; off < raw.length; off += 65535) {
    var part = raw.slice(off, off + 65535), len = part.length;
    z.push(off + 65535 >= raw.length ? 1 : 0, len & 255, len >>> 8, ~len & 255, (~len >>> 8) & 255);
    z = z.concat(part);
  }
  z = z.concat(u32(((s2 << 16) | s1) >>> 0));
  var png = [137, 80, 78, 71, 13, 10, 26, 10]
    .concat(chunk('IHDR', u32(size).concat(u32(size), [1, 0, 0, 0, 0])), chunk('IDAT', z), chunk('IEND', []));
  var signed = png.map(function (v) { return v > 127 ? v - 256 : v; });
  return Utilities.newBlob(signed, 'image/png', 'ticket-qr.png');
}
