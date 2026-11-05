# Builds the HiEnd Asia 2026 site for GitHub Pages:
#   index.html            English (also the landing page: it forwards visitors to their own language)
#   <lang>/index.html     zh-Hans, zh-Hant, id, ms, fil, th, vi, each with its text baked into the HTML
#   privacy.html          privacy notice and cookie table (English)
#   artifact.html         the English page as a fragment for the Claude artifact preview
# Copy lives in i18n/<lang>.json (English is the source and the fallback for any missing key).
# Run: python build.py   (expects img/, imgs.json, i18n/ and consent.js beside it)
import glob, html, json, os, re
from urllib.parse import quote, urlencode

HERE = os.path.dirname(os.path.abspath(__file__))
ROWS = json.load(open(os.path.join(HERE, 'imgs.json'), encoding='utf-8'))
e = html.escape

LANGS = ['en', 'zh-Hans', 'zh-Hant', 'id', 'ms', 'fil', 'th', 'vi']
LANG_NAMES = {'en': 'English', 'zh-Hans': '简体中文', 'zh-Hant': '繁體中文', 'id': 'Bahasa Indonesia', 'ms': 'Bahasa Melayu',
              'fil': 'Filipino', 'th': 'ไทย', 'vi': 'Tiếng Việt'}
OG_LOCALE = {'en': 'en_SG', 'zh-Hans': 'zh_CN', 'zh-Hant': 'zh_TW', 'id': 'id_ID', 'ms': 'ms_MY', 'fil': 'fil_PH',
             'th': 'th_TH', 'vi': 'vi_VN'}
# Scripts the self-hosted Latin fonts don't cover load from Google Fonts on those pages only, without blocking paint.
LANG_FONTS = {'zh-Hans': 'Noto+Sans+SC:wght@400;700', 'zh-Hant': 'Noto+Sans+TC:wght@400;700', 'th': 'Noto+Sans+Thai:wght@400;700'}
I18N = {l: json.load(open(os.path.join(HERE, 'i18n', l + '.json'), encoding='utf-8')) for l in LANGS}
EN = I18N['en']
CUR = EN  # the language being rendered


def tr(key):
    v = CUR.get(key)
    return v if isinstance(v, str) and v != '' else EN[key]


def img(i):
    """Image file for id i; a WebP version is preferred where one has been made."""
    hits = glob.glob(os.path.join(HERE, 'img', '%03d.*' % i))
    hits.sort(key=lambda p: (not p.endswith('.webp'), p))
    return 'img/' + os.path.basename(hits[0])


# People: (photo id, badge key). Names, roles and bios live in i18n/<lang>.json as p.<id>.name/.role/.bio
KEYNOTES = [(11, 'keynote'), (12, 'keynote'), (13, 'keynote'), (14, 'keynote'), (15, 'keynote')]
ARTISTS = [(31, 'live'), (36, 'live'), (32, 'live'), (33, 'live'), (34, 'live'), (35, 'emcee')]
GUESTS = [(40, 'vip'), (41, 'vip'), (42, 'meet')]

# Brand representatives: (name, English role for reference, brand). Displayed roles come from rep.<n>.role
REPS = [
    ('Robert Hegemann', '', 'Acoustic Signature'), ('Dietrich Brakemeier', 'CEO', 'Acoustical Systems'),
    ('Kenneth Lin', 'Co-Founder', 'Alexandria Audio'), ('Henry Kristanto', 'Co-Founder', 'Alexandria Audio'),
    ('Danny Hon', 'Asia Sales Manager', 'Audio Group Denmark'), ('Michael Børresen', 'CTO', 'Audio Group Denmark'),
    ('Mads Klifoth', 'CEO', 'Audiovector'), ('Jacky Fong', 'Asia Sales Manager', 'Audiovector'),
    ('Felix Avalos, Raul Rangel', 'President & CEO', 'Avalos Sound Design · Fono Acustica'),
    ('Jerome Andre', 'International Sales Manager', 'Avantgarde'),
    ('Steve Shade', 'Director of International Sales', 'BAT · MoFi Electronics'),
    ('Helmut Brinkmann', 'Founder', 'Brinkmann'), ('Matthias Lock', 'Co-Owner', 'Brinkmann'),
    ('Xu Nuo', 'General Manager (China)', 'Direct Sound Machine'),
    ('Heng Yi Xiang', 'General Manager (Singapore)', 'Direct Sound Machine'),
    ('Maurizio Aterini', 'Founder & CEO', 'Gold Note'), ('Micha Huber', 'CEO', 'HiFiction AG'),
    ('Hans-Jürgen Kaiser', 'CEO and Managing Director', 'Kaiser Acoustics'),
    ('Rainer Weber', 'Technical Director', 'Kaiser Acoustics'),
    ('Jonathan Carr', 'Chief Engineer', 'Lyra Analog'), ('Stig Bjorge', 'CEO', 'Lyra Analog'),
    ('Bjorn Bengtsson', 'Products Specialist', 'Nordost'), ('Lennart Asbjørn', 'CEO', 'Peak Consult'),
    ('Wilfried Ehrenholz', 'Product Development', 'Peak Consult'),
    ('Mark Thomsen', 'International Sales & Marketing', 'SB Acoustics & SB Audience'),
    ('Melly Wulandari', 'Project Manager', 'Sinar Bajar Electric'), ('Willy S', 'Project Manager', 'Sinar Bajar Electric'),
    ('Ming Yip', 'Founder', 'Sine'), ('James Soh', 'CEO', 'Sound Affairs'), ('Richard Braine', 'Director', 'Supatrac'),
    ('Shinji Tarutani', 'President', 'TAD'), ('Rumen Artaski', 'CEO', 'Thrax Audio'),
    ('Masashi Miyake', 'Founder', 'Vinyl Audio Laboratory'), ('Hans-Ole Vitus', 'Founder', 'Vitus Audio'),
    ('Inès Adler', 'CEO and Founder', 'Voxativ'), ('Stefan Trog', 'Managing Director', 'Westend Audio System'),
    ('Günther Mania', 'Developer', 'Westend Audio System'), ('Aurèle Docquin', 'APAC Sales Director', 'YG Acoustics'),
    ('Demetris Baklavas', 'Founder & Chief Designer', 'Ypsilon Electronic'),
]
assert len(REPS) == 39

# Dealer logos 82-106, brand logos 107-242 (alt text = brand name on the live site)
DEALER_IDX = list(range(82, 107))
BRAND_IDX = [i for i in range(107, 243) if i != 114]  # 114 repeats Analog Playground
NAME_FIX = {'Opera Loudpseakers': 'Opera Loudspeakers', 'Quadspire': 'Quadraspire', 'Tinglon': 'Tiglon',
            'Tw Acoustics': 'TW Acustic', 'Syntec Audio': 'Synastec Audio', 'Peak': 'Peak Audio',
            'audioexotics.com': 'Audio Exotics', 'VPI made in USA': 'VPI', 'Kinki': 'Kinki Studio'}


def logo_name(i):
    n = ROWS[i][0].strip()
    return NAME_FIX.get(n, n)


def t(key, tag='span', cls='', attrs=''):
    """An element in the current language (data-i18n keeps the key visible for whoever edits the copy)."""
    c = ' class="%s"' % cls if cls else ''
    return '<%s%s data-i18n="%s"%s>%s</%s>' % (tag, c, key, attrs, e(tr(key)), tag)


def person_card(i, badge):
    k = 'p.%d.' % i
    return f'''<article class="person">
  <img class="p-photo" src="{img(i)}" alt="{e(tr(k + 'name'))}" loading="lazy" width="640" height="800">
  {t('badge.' + badge, cls='badge')}
  {t(k + 'name', 'h3', 'p-name')}
  {t(k + 'role', cls='p-role')}
  {t(k + 'bio', 'p', 'p-bio')}
</article>'''


def rep_role(k):
    key = 'rep.%d.role' % k
    return t(key, cls='rep-role') if EN[key] else '<span class="rep-role">&nbsp;</span>'


def tiles(idx):
    return '\n'.join(f'<li class="tile"><img src="{img(i)}" alt="{e(logo_name(i))}" loading="lazy" title="{e(logo_name(i))}"></li>'
                     for i in idx)


MEDIA = ['HiFi PiG Magazine', 'AudioNet', 'Lee388', 'The AudiophileLance', 'Brother Bok', 'AudioArt', 'Mono & Stereo',
         'Part-Time Audiophile', 'The Listening Chair with Howard Kneller', 'AMPED', 'New Audiophile', 'STHIFI.COM',
         'iAVlife.com', 'PSV PerfectSoundVision', 'PrimeAV', 'The Greater Toronto Area Audiophile Club',
         'Audiophile Club Singapore', 'Enso Consult', 'Stardust Pictures', 'El Hefe Reviews', 'Sights N Sounds',
         '51audio.com']

EVENT = '2026 Singapore Hi-End Asia International Audio Visual Show'
VENUE = 'Level 3, Suntec Singapore Convention & Exhibition Centre, 1 Raffles Boulevard, Singapore 039593'
SITE = 'https://www.hiendasia.com/'  # the organiser's own site (schema.org organizer)
PAGES = 'https://christophertanenso.github.io/hiendasia-2026/'  # the show site
MAPS = 'https://maps.google.com/?q=Suntec+Singapore+Convention+%26+Exhibition+Centre'
# Links people carry away (calendar entries, shares) point at the show site and are UTM-tagged, so GA4
# credits the visits they bring back to the right source.
CAL_LINK = PAGES + '?utm_source=calendar&utm_medium=referral&utm_campaign=save_the_date'
ABOUT = ('Free entry, no tickets needed. 150+ high-end audio brands, listening rooms, keynote talks and live concerts. '
         'Open 10am - 7pm daily. ' + CAL_LINK)
# Google repeats 10am-7pm SGT for three days; Outlook takes one span from the first opening to the last close.
GCAL = 'https://calendar.google.com/calendar/render?' + urlencode({
    'action': 'TEMPLATE', 'text': 'HiEnd Asia 2026', 'dates': '20261217T100000/20261217T190000',
    'ctz': 'Asia/Singapore', 'recur': 'RRULE:FREQ=DAILY;COUNT=3', 'location': VENUE, 'details': EVENT + '\n\n' + ABOUT})


def outlook(host):
    return 'https://%s/calendar/0/action/compose?' % host + urlencode({
        'subject': 'HiEnd Asia 2026', 'startdt': '2026-12-17T10:00:00+08:00', 'enddt': '2026-12-19T19:00:00+08:00',
        'location': VENUE, 'body': EVENT + '\n\n' + ABOUT})


ICON_CAL = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'
            '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>')


def ics_fold(line):
    # RFC 5545: lines longer than 75 octets continue on the next line after a space.
    out, b = [], line.encode('utf-8')
    while len(b) > (75 if not out else 74):
        cut = 75 if not out else 74
        while (b[cut] & 0xC0) == 0x80:
            cut -= 1
        out.append(b[:cut].decode('utf-8')); b = b[cut:]
    out.append(b.decode('utf-8'))
    return '\r\n '.join(out)


def ics_text(v):
    return v.replace('\\', '\\\\').replace(';', '\\;').replace(',', '\\,').replace('\n', '\\n')


# .ics for Apple Calendar and anything else (works where Google is blocked, e.g. mainland China).
# 10am-7pm SGT (UTC+8) on 17, 18 and 19 Dec, with a reminder the day before.
ICS = '\r\n'.join(ics_fold(l) for l in [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//HiEnd Asia//HiEnd Asia 2026//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT', 'UID:hiendasia-2026@christophertanenso.github.io', 'DTSTAMP:20261104T000000Z',
    'DTSTART:20261217T020000Z', 'DTEND:20261217T110000Z', 'RRULE:FREQ=DAILY;COUNT=3',
    'SUMMARY:HiEnd Asia 2026', 'LOCATION:' + ics_text(VENUE), 'DESCRIPTION:' + ics_text(EVENT + '\n\n' + ABOUT),
    'URL:' + CAL_LINK,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:HiEnd Asia 2026 is tomorrow', 'TRIGGER:-P1D', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR']) + '\r\n'
ICS_FILE = 'hiendasia-2026.ics'
with open(os.path.join(HERE, ICS_FILE), 'w', encoding='utf-8', newline='') as f:
    f.write(ICS)

ICON_WX = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9 4C5.1 4 2 6.6 2 9.8c0 1.8 1 3.4 2.6 4.5L4 16.5l2.5-1.3c.8.2 1.6.4 2.5.4h.4a5 5 0 0 1-.2-1.4C9.2 11 12.2 8.6 16 8.6h.3C15.6 5.9 12.6 4 9 4Zm-2.4 3.2a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Zm4.8 0a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z"/>'
           '<path d="M22 14.2c0-2.7-2.7-4.8-6-4.8s-6 2.1-6 4.8 2.7 4.8 6 4.8c.7 0 1.4-.1 2-.3l2 1.1-.5-1.8c1.5-.9 2.5-2.3 2.5-3.8Zm-8-.9a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Zm4 0a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Z"/></svg>')
ICON_WA = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>')

# Hero poster: responsive WebP made from img/000.jpg (see README). The JPEG stays for search/structured data.
POSTER = 'img/000-1242.webp'
POSTER_SRCSET = 'img/000-640.webp 640w, img/000-760.webp 760w, img/000-960.webp 960w, img/000-1242.webp 1242w'
POSTER_SIZES = '(max-width: 960px) calc(100vw - 32px), min(920px, 60vw)'
OG_IMAGE = 'img/og-2026.jpg'  # 1200x630 landscape for WhatsApp, Facebook, LinkedIn, X

CONSENT_JS = open(os.path.join(HERE, 'consent.js'), encoding='utf-8').read().strip()
TPL = open(os.path.join(HERE, 'page.tpl.html'), encoding='utf-8').read()


def lang_path(lang):
    return '' if lang == 'en' else lang + '/'


def rebase(doc, base):
    """Pages in a language folder reach shared files one level up."""
    if not base:
        return doc
    doc = re.sub(r'(?<=["\'(,\s])((?:img|video|fonts|floormap)/)', base + r'\1', doc)
    return doc.replace('href="%s"' % ICS_FILE, 'href="%s%s"' % (base, ICS_FILE)).replace('href="privacy.html"', 'href="%sprivacy.html"' % base)


def consent_cfg(base):
    k = lambda s: tr('consent.' + s)
    cfg = {'privacy': base + 'privacy.html', 't': {
        'title': k('title'), 'text': k('text'), 'accept': k('accept'), 'reject': k('reject'), 'settings': k('settings'),
        'save': k('save'), 'necessary': k('necessary'), 'necessaryD': k('necessary.d'), 'analytics': k('analytics'),
        'analyticsD': k('analytics.d'), 'marketing': k('marketing'), 'marketingD': k('marketing.d'), 'policy': k('policy')}}
    return json.dumps(cfg, ensure_ascii=False).replace('</', '<\\/')


def lang_font(lang):
    if lang not in LANG_FONTS:
        return ''
    href = 'https://fonts.googleapis.com/css2?family=%s&display=swap' % LANG_FONTS[lang]
    # media="print" + onload: the font CSS never blocks the first paint, and a blocked Google (mainland China)
    # just leaves the system CJK/Thai fonts in place.
    return ('<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
            f'<link rel="stylesheet" href="{href}" media="print" onload="this.media=\'all\'">\n'
            f'<noscript><link rel="stylesheet" href="{href}"></noscript>')


def render(lang, base, auto, page_url):
    """The page body (template filled) for one language."""
    global CUR
    CUR = I18N[lang]
    wa_link = page_url + '?utm_source=whatsapp&utm_medium=social&utm_campaign=share'
    wa = 'https://wa.me/?text=' + quote(tr('wa.text') + '\n' + wa_link)
    cal_menu = f'''<div class="cal-menu">
            <a href="{e(GCAL)}" target="_blank" rel="noopener">{t('cal.google')}{t('cal.google.note', 'small')}</a>
            <a href="{e(outlook('outlook.live.com'))}" target="_blank" rel="noopener">{t('cal.outlook')}{t('cal.outlook.note', 'small')}</a>
            <a href="{e(outlook('outlook.office.com'))}" target="_blank" rel="noopener">{t('cal.work')}{t('cal.work.note', 'small')}</a>
            <a href="{ICS_FILE}">{t('cal.ics')}{t('cal.ics.note', 'small')}</a>
          </div>'''
    actions = f'''      <div class="btns">
        <details class="cal">
          <summary class="btn btn-primary">{ICON_CAL}{t('cal.add')}<span class="chev" aria-hidden="true">▾</span></summary>
          {cal_menu}
        </details>
        <a class="btn btn-outline" href="{e(wa)}" target="_blank" rel="noopener" data-wa>{ICON_WA}{t('share.wa')}</a>
        <details class="cal wx">
          <summary class="btn btn-outline">{ICON_WX}{t('share.wx')}</summary>
          <div class="cal-menu wx-menu">
            <img src="img/wechat-qr.svg" width="168" height="168" alt="{e(tr('share.wx.qr'))}">
            {t('share.wx.scan', 'p')}
            <button class="btn btn-outline btn-sm" type="button" data-copy data-copied="{e(tr('share.wx.copied'))}">{t('share.wx.copy')}</button>
          </div>
        </details>
      </div>'''
    mbar = f'''<div class="mbar" id="mbar">
  <details class="cal">
    <summary class="btn btn-primary btn-sm">{ICON_CAL}{t('nav.save')}</summary>
    {cal_menu}
  </details>
  <a class="btn btn-outline btn-sm" href="{MAPS}" target="_blank" rel="noopener">{t('visit.directions')}</a>
</div>'''
    dates = '''      <div class="dates" aria-label="%s">
        %s%s
        %s%s
        %s%s
      </div>''' % (e(tr('dates.aria')), t('d.thu'), t('time'), t('d.fri'), t('time'), t('d.sat'), t('time'))
    options = '\n'.join('        <option value="%s" lang="%s"%s>%s</option>' % (l, l, ' selected' if l == lang else '', LANG_NAMES[l])
                        for l in LANGS)
    rep_html = '\n'.join(f'''<li class="rep">
  <img src="{img(43 + k)}" alt="{e(n)}" loading="lazy" width="400" height="500">
  <span class="rep-name">{e(n)}</span>
  {rep_role(k)}
  <span class="rep-brand">{e(b)}</span>
</li>''' for k, (n, r, b) in enumerate(REPS))
    rep = {
        '{{ACTIONS}}': actions, '{{DATES}}': dates, '{{MBAR}}': mbar, '{{LANG_OPTIONS}}': options,
        '{{GCAL}}': e(GCAL), '{{WA}}': e(wa),
        '{{KEYNOTES}}': '\n'.join(person_card(i, b) for i, b in KEYNOTES),
        '{{ARTISTS}}': '\n'.join(person_card(i, b) for i, b in ARTISTS),
        '{{GUESTS}}': '\n'.join(person_card(i, b) for i, b in GUESTS),
        '{{REPS}}': rep_html, '{{DEALERS}}': tiles(DEALER_IDX), '{{BRANDS}}': tiles(BRAND_IDX),
        '{{MEDIA}}': '\n'.join('<li>%s</li>' % e(m) for m in MEDIA),
        '{{POSTER}}': POSTER, '{{POSTER_SRCSET}}': POSTER_SRCSET, '{{POSTER_SIZES}}': POSTER_SIZES,
        '{{FLOOR}}': img(7), '{{SUNTEC_IN}}': img(8), '{{SUNTEC_NIGHT}}': img(9),
        '{{PAGE_LANG}}': lang, '{{BASE}}': base, '{{AUTO_LANG}}': 'true' if auto else 'false',
        '{{PAGE_URL}}': page_url, '{{LANG_FONT}}': lang_font(lang),
        '{{CONSENT_CFG}}': consent_cfg(base), '{{CONSENT_JS}}': CONSENT_JS,
    }
    out = TPL
    for k, v in rep.items():
        out = out.replace(k, v)
    # The remaining {{key}} tokens are strings from i18n/<lang>.json
    out = re.sub(r'\{\{([a-z][\w.]*)\}\}', lambda m: e(tr(m.group(1))), out)
    assert '{{' not in out, re.findall(r'\{\{[^}]*\}\}', out)[:5]
    return rebase(out, base)


def document(lang):
    """A complete page for GitHub Pages, with sharing, language and search metadata."""
    base = '' if lang == 'en' else '../'
    url = PAGES + lang_path(lang)
    body = render(lang, base, True, url)
    desc = tr('meta.desc')
    alternates = '\n'.join('<link rel="alternate" hreflang="%s" href="%s%s">' % (l, PAGES, lang_path(l)) for l in LANGS)
    ld = json.dumps({
        '@context': 'https://schema.org', '@type': 'Event', 'name': EVENT, 'inLanguage': lang, 'url': url,
        'startDate': '2026-12-17T10:00:00+08:00', 'endDate': '2026-12-19T19:00:00+08:00',
        'eventStatus': 'https://schema.org/EventScheduled',
        'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
        'location': {'@type': 'Place', 'name': 'Suntec Singapore Convention & Exhibition Centre, Level 3',
                     'address': {'@type': 'PostalAddress', 'streetAddress': '1 Raffles Boulevard',
                                 'postalCode': '039593', 'addressCountry': 'SG'}},
        'image': [PAGES + 'img/000.jpg', PAGES + OG_IMAGE], 'description': desc, 'isAccessibleForFree': True,
        'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'SGD', 'availability': 'https://schema.org/InStock',
                   'url': url},
        'organizer': {'@type': 'Organization', 'name': 'HiEnd Asia + Pte. Ltd', 'url': SITE},
    }, ensure_ascii=False).replace('</', '<\\/')
    head, rest = body.split('<a class="skip"', 1)
    title = tr('meta.title')
    return f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{e(desc)}">
<meta property="og:type" content="website">
<meta property="og:title" content="{e(title)} · {e(tr('free.label'))}">
<meta property="og:description" content="{e(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{PAGES}{OG_IMAGE}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{OG_LOCALE[lang]}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{url}">
{alternates}
<link rel="alternate" hreflang="x-default" href="{PAGES}">
<link rel="preload" as="image" href="{base}{POSTER}" imagesrcset="{re.sub(r'(^|, )img/', lambda m: m.group(1) + base + 'img/', POSTER_SRCSET)}" imagesizes="{POSTER_SIZES}" fetchpriority="high">
<script type="application/ld+json">{ld}</script>
{head.strip()}
</head>
<body>
<a class="skip"{rest}
</body>
</html>
'''


written = []
for lang in LANGS:
    path = os.path.join(HERE, lang_path(lang), 'index.html')
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, 'w', encoding='utf-8').write(document(lang))
    written.append(os.path.relpath(path, HERE))

# artifact.html: the English fragment the Claude artifact host wraps in its own skeleton (no language forwarding).
artifact = render('en', '', False, PAGES)
open(os.path.join(HERE, 'artifact.html'), 'w', encoding='utf-8').write(artifact)

# ---------- Privacy notice ----------
CUR = EN
PRIVACY_UPDATED = '5 November 2026'
DPO_EMAIL = 'michelle@hiendasia.com'  # data protection contact; replace with a dedicated dpo@ address when one exists
COOKIES = [
    ('hea-lang', 'This site (browser storage)', 'Necessary', 'Remembers the language you picked.', 'Until you clear it'),
    ('hea-consent', 'This site (browser storage)', 'Necessary', 'Remembers your cookie choice and when you made it.', 'Until you clear it'),
    ('hea-checkin-&lt;date&gt;, hea-onsite', 'This site (browser storage)', 'Necessary',
     'Set only when you open the page from a QR sign at the show, so a visit is counted once per day.', 'One day / this tab'),
    ('_ga, _ga_&lt;id&gt;', 'Google Analytics', 'Analytics', 'Counts visits and tells apart returning browsers.', '2 years'),
    ('_gcl_au', 'Google Ads', 'Marketing', 'Links ad clicks to visits to measure our Google ads.', '90 days'),
    ('test_cookie, IDE', 'Google (doubleclick.net)', 'Marketing', 'Checks the browser accepts cookies; ad measurement.', '15 minutes / 13 months'),
    ('_fbp', 'Meta', 'Marketing', 'Identifies the browser for Meta ad measurement and audiences.', '90 days'),
    ('fr', 'Meta (facebook.com)', 'Marketing', 'Ad delivery and measurement for people logged in to Facebook or Instagram.', '90 days'),
]
cookie_rows = '\n'.join('<tr><td><code>%s</code></td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>' % r for r in COOKIES)
PRIVACY = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Privacy notice · HiEnd Asia 2026</title>
<meta name="description" content="How the HiEnd Asia 2026 website uses personal data and cookies, and how to change your choices.">
<link rel="canonical" href="{PAGES}privacy.html">
<link rel="icon" href="img/monogram.svg" type="image/svg+xml">
<script>
window.dataLayer = window.dataLayer || [];
function gtag() {{ dataLayer.push(arguments); }}
gtag('consent', 'default', {{ analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' }});
gtag('js', new Date());
var HEA_TEST = /^(localhost|127\\.0\\.0\\.1|\\[::1\\]|0\\.0\\.0\\.0)$|\\.localhost$|\\.test$/.test(location.hostname) && !/[?&]track=live\\b/.test(location.search);
gtag('config', 'G-NED2Z7D1C5', HEA_TEST ? {{ debug_mode: true }} : {{}});
window.fbq = function () {{}};
window.HEA_CONSENT = {consent_cfg('')};
{CONSENT_JS}
</script>
<style>
@font-face {{ font-family: 'Arimo'; font-weight: 400 700; font-display: swap; src: url(fonts/arimo-latin.woff2) format('woff2'); }}
@font-face {{ font-family: 'Open Sans'; font-weight: 400 700; font-display: swap; src: url(fonts/opensans-latin.woff2) format('woff2'); }}
:root {{ --bg: #000; --heading: #f0d9a0; --body: #ebebeb; --muted: #d2c8b4; --accent: #c6a661; --line: #4f4632; --band: #201d17;
  --font-display: Arimo, Arial, sans-serif; --font-body: "Open Sans", Arial, sans-serif; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--bg); color: var(--body); font: 16px/1.7 var(--font-body); }}
a {{ color: var(--heading); }} a:hover {{ color: var(--accent); }}
:focus-visible {{ outline: 2px solid var(--accent); outline-offset: 2px; }}
.wrap {{ max-width: 820px; margin: 0 auto; padding: 0 max(16px, env(safe-area-inset-left, 0px)) 96px; }}
header {{ border-bottom: 1px solid var(--line); margin-bottom: 40px; }}
header .wrap {{ padding-block: 14px; padding-bottom: 14px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }}
header img {{ height: 40px; width: auto; display: block; }}
h1 {{ font: 700 clamp(30px, 5vw, 44px)/1.1 var(--font-display); color: var(--heading); text-transform: uppercase; margin: 0 0 8px; }}
h2 {{ font: 700 20px/1.3 var(--font-display); color: var(--heading); margin: 40px 0 8px; }}
.meta {{ color: var(--muted); font-size: 14px; margin: 0 0 24px; }}
.rule {{ width: 64px; height: 1px; background: var(--accent); margin: 16px 0 24px; }}
p, li {{ max-width: 70ch; }}
.scroll {{ overflow-x: auto; margin-top: 12px; }}
table {{ border-collapse: collapse; width: 100%; min-width: 640px; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 10px 12px; border-bottom: 1px solid var(--line); }}
th {{ color: var(--heading); font: 700 13px/1.3 var(--font-display); letter-spacing: .06em; text-transform: uppercase; }}
code {{ color: var(--heading); font-size: 13px; }}
.btn {{ display: inline-flex; align-items: center; min-height: 44px; padding: 0 22px; border-radius: 50px; border: 1px solid var(--accent);
  background: var(--accent); color: #000; font: 700 13px/1 var(--font-display); letter-spacing: .08em; text-transform: uppercase; cursor: pointer; }}
.back {{ font-size: 14px; }}
</style>
</head>
<body>
<header><div class="wrap"><a href="./"><img src="img/logo.svg" alt="HiEnd Asia 2026 home" width="155" height="40"></a><a class="back" href="./">← Back to the show page</a></div></header>
<main class="wrap">
<h1>Privacy notice</h1>
<p class="meta">HiEnd Asia 2026 website · Last updated {PRIVACY_UPDATED}</p>
<div class="rule"></div>
<p>This notice explains what personal data the HiEnd Asia 2026 website collects, why, and the choices you have. It is written for the
Personal Data Protection Act 2012 of Singapore (PDPA) and applies to this website only. The show itself is free to enter and needs no registration.</p>

<h2>Who we are</h2>
<p>HiEnd Asia + Pte. Ltd, 1093 Lower Delta Road #02-09, Singapore 169204, organises the 2026 Singapore Hi-End Asia International Audio Visual Show
and runs this website.</p>
<p><strong>Data protection contact:</strong> <a href="mailto:{DPO_EMAIL}">{DPO_EMAIL}</a> · <a href="tel:+6586681927">+65 8668 1927</a>.
Write to us for any question, access or correction request, or complaint about your personal data.</p>

<h2>What we collect</h2>
<ul>
<li><strong>Nothing you type.</strong> The site has no forms, accounts or tickets. If you email, phone or message us, we use what you send only to reply.</li>
<li><strong>Analytics, only if you allow it.</strong> Google Analytics records which pages and sections are viewed, which buttons are used (for example
"Add to calendar", "Get directions", "Share"), the language, device and browser type, approximate location (city level) and how you arrived (for example
a WhatsApp share or an ad).</li>
<li><strong>Marketing, only if you allow it.</strong> The Meta Pixel and Google Ads tags record that you visited and the same actions, so we can measure
our ads on Facebook, Instagram and Google and show HiEnd Asia ads to people who have visited. Meta and Google may link this to your account with them under their own policies.</li>
<li><strong>QR signs at the show.</strong> If you open the site from a sign at the venue, the page notes which sign, so we can count visits on site.</li>
</ul>

<h2>Your choice and consent</h2>
<p>Analytics and marketing tags stay off, and their scripts are not even downloaded, until you choose in the cookie banner. You can accept all, reject all,
or choose each category. You can change or withdraw your choice at any time; withdrawing stops new collection and removes the analytics and marketing
cookies this site set in your browser.</p>
<p><button class="btn" type="button" data-consent-open>Cookie settings</button></p>

<h2>Cookies and browser storage</h2>
<div class="scroll"><table>
<thead><tr><th>Name</th><th>Set by</th><th>Category</th><th>Purpose</th><th>Kept for</th></tr></thead>
<tbody>
{cookie_rows}
</tbody></table></div>
<p>Pages in Chinese and Thai also load fonts from Google Fonts, which receives your IP address to deliver them. No cookies are set by this.</p>

<h2>Who receives it, and where</h2>
<p>Google LLC (Google Analytics, Google Ads, Google Fonts) and Meta Platforms Ireland Ltd (Meta Pixel) process this data for us, and may store it outside
Singapore, including in the United States. We use them under their standard business terms, which include contractual safeguards for transferring personal data
abroad. We do not sell personal data. The site is hosted on GitHub Pages (GitHub, Inc.), which keeps server logs, including IP addresses, for security.</p>
<p>Links to Google Calendar, Outlook, WhatsApp, WeChat and Google Maps take you to those services, and their own privacy policies apply there.</p>

<h2>How long we keep it</h2>
<p>Analytics data is kept for up to 14 months, then deleted. Ad data is kept by Meta and Google for the periods in their policies.
Emails and messages are kept for as long as we need them to answer and to follow up on the show, then deleted.</p>

<h2>Your rights</h2>
<p>You can ask us for access to, or correction of, personal data we hold about you, and withdraw consent at any time, using the contact above.
We will reply within 30 days. If you are not satisfied, you can contact the Personal Data Protection Commission at
<a href="https://www.pdpc.gov.sg/" target="_blank" rel="noopener">pdpc.gov.sg</a>.</p>

<h2>Changes</h2>
<p>If we change this notice, we will update the date above. If a change affects what you agreed to, the cookie banner will ask you again.</p>
</main>
</body>
</html>
'''
open(os.path.join(HERE, 'privacy.html'), 'w', encoding='utf-8').write(PRIVACY)

files = {p: p for p in sorted(set(re.findall(r'(?:src|href|poster)="((?:img|video)/[^"]+)"', artifact))
                              | set(re.findall(r'((?:img|video)/[\w.-]+\.webp)', artifact))
                              | set(re.findall(r'url\((fonts/[^)]+)\)', artifact)) | {ICS_FILE, OG_IMAGE})}
json.dump(files, open(os.path.join(HERE, 'files.json'), 'w'), indent=0)
print('wrote', ', '.join(written), '+ privacy.html, artifact.html;', len(files), 'files referenced')
