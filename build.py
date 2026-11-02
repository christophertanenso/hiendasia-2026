# Builds index.html (GitHub Pages) and artifact.html for the HiEnd Asia 2026 page.
# English copy lives in i18n/en.json; other languages in i18n/<lang>.json load in the browser.
# Run: python build.py   (expects img/, imgs.json and i18n/ beside it)
import glob, html, json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROWS = json.load(open(os.path.join(HERE, 'imgs.json'), encoding='utf-8'))
e = html.escape


def img(i):
    hits = glob.glob(os.path.join(HERE, 'img', '%03d.*' % i))
    return 'img/' + os.path.basename(hits[0])


EN = json.load(open(os.path.join(HERE, 'i18n', 'en.json'), encoding='utf-8'))

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
    """An element translated in the browser; the English is baked in for no-JS visitors and search engines."""
    c = ' class="%s"' % cls if cls else ''
    return '<%s%s data-i18n="%s"%s>%s</%s>' % (tag, c, key, attrs, e(EN[key]), tag)


def person_card(i, badge):
    k = 'p.%d.' % i
    return f'''<article class="person">
  <img class="p-photo" src="{img(i)}" alt="{e(EN[k + 'name'])}" data-i18n-attr="alt:{k}name" loading="lazy" width="640" height="800">
  {t('badge.' + badge, cls='badge')}
  {t(k + 'name', 'h3', 'p-name')}
  {t(k + 'role', cls='p-role')}
  {t(k + 'bio', 'p', 'p-bio')}
</article>'''


def rep_role(k):
    key = 'rep.%d.role' % k
    return t(key, cls='rep-role') if EN[key] else '<span class="rep-role">&nbsp;</span>'


keynote_html = '\n'.join(person_card(i, b) for i, b in KEYNOTES)
artist_html = '\n'.join(person_card(i, b) for i, b in ARTISTS)
guest_html = '\n'.join(person_card(i, b) for i, b in GUESTS)
rep_html = '\n'.join(f'''<li class="rep">
  <img src="{img(43 + k)}" alt="{e(n)}" loading="lazy" width="400" height="500">
  <span class="rep-name">{e(n)}</span>
  {rep_role(k)}
  <span class="rep-brand">{e(b)}</span>
</li>''' for k, (n, r, b) in enumerate(REPS))

DATES = '''      <div class="dates" aria-label="%s" data-i18n-attr="aria-label:dates.aria">
        %s%s
        %s%s
        %s%s
      </div>''' % (e(EN['dates.aria']), t('d.thu'), t('time'), t('d.fri'), t('time'), t('d.sat'), t('time'))


def tiles(idx):
    return '\n'.join(f'<li class="tile"><img src="{img(i)}" alt="{e(logo_name(i))}" loading="lazy" title="{e(logo_name(i))}"></li>'
                     for i in idx)


brand_names = sorted({logo_name(i) for i in BRAND_IDX}, key=str.lower)

MEDIA = ['HiFi PiG Magazine', 'AudioNet', 'Lee388', 'The AudiophileLance', 'Brother Bok', 'AudioArt', 'Mono & Stereo',
         'Part-Time Audiophile', 'The Listening Chair with Howard Kneller', 'AMPED', 'New Audiophile', 'STHIFI.COM',
         'iAVlife.com', 'PSV PerfectSoundVision', 'PrimeAV', 'The Greater Toronto Area Audiophile Club',
         'Audiophile Club Singapore', 'Enso Consult', 'Stardust Pictures', 'El Hefe Reviews', 'Sights N Sounds',
         '51audio.com']

from urllib.parse import quote, urlencode

EVENT = '2026 Singapore Hi-End Asia International Audio Visual Show'
VENUE = 'Level 3, Suntec Singapore Convention & Exhibition Centre, 1 Raffles Boulevard, Singapore 039593'
SITE = 'https://www.hiendasia.com/'
ABOUT = ('Free entry, no tickets needed. 150+ high-end audio brands, listening rooms, keynote talks and live concerts. '
         'Open 10am - 7pm daily. ' + SITE)
# Google repeats 10am-7pm SGT for three days; Outlook takes one span from the first opening to the last close.
GCAL = 'https://calendar.google.com/calendar/render?' + urlencode({
    'action': 'TEMPLATE', 'text': 'HiEnd Asia 2026', 'dates': '20261217T100000/20261217T190000',
    'ctz': 'Asia/Singapore', 'recur': 'RRULE:FREQ=DAILY;COUNT=3', 'location': VENUE, 'details': EVENT + '\n\n' + ABOUT})


def outlook(host):
    return 'https://%s/calendar/0/action/compose?' % host + urlencode({
        'subject': 'HiEnd Asia 2026', 'startdt': '2026-12-17T10:00:00+08:00', 'enddt': '2026-12-19T19:00:00+08:00',
        'location': VENUE, 'body': EVENT + '\n\n' + ABOUT})


WA = 'https://wa.me/?text=' + quote(
    'HiEnd Asia 2026, the Singapore Hi-End Asia International Audio Visual Show\n'
    '17-19 Dec 2026, 10am-7pm daily\nLevel 3, Suntec Singapore Convention & Exhibition Centre\n'
    'Free entry, no tickets needed.\n' + SITE)

ICON_CAL = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'
            '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>')
ICON_WA = ('<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.3-.9.9-.9 2.2s.9 2.5 1 2.7c.1.2 1.8 2.8 4.4 3.9 1.6.7 2.3.8 3.1.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>')

ACTIONS = f'''      <div class="btns">
        <details class="cal">
          <summary class="btn btn-primary">{ICON_CAL}{t('cal.add')}<span class="chev" aria-hidden="true">▾</span></summary>
          <div class="cal-menu">
            <a href="{e(GCAL)}" target="_blank" rel="noopener">{t('cal.google')}{t('cal.google.note', 'small')}</a>
            <a href="{e(outlook('outlook.live.com'))}" target="_blank" rel="noopener">{t('cal.outlook')}{t('cal.outlook.note', 'small')}</a>
            <a href="{e(outlook('outlook.office.com'))}" target="_blank" rel="noopener">{t('cal.work')}{t('cal.work.note', 'small')}</a>
          </div>
        </details>
        <a class="btn btn-outline" href="{e(WA)}" target="_blank" rel="noopener" data-wa>{ICON_WA}{t('share.wa')}</a>
      </div>'''

tpl = open(os.path.join(HERE, 'page.tpl.html'), encoding='utf-8').read()
out = (tpl.replace('{{ACTIONS}}', ACTIONS).replace('{{DATES}}', DATES)
          .replace('{{GCAL}}', e(GCAL)).replace('{{WA}}', e(WA))
          .replace('{{KEYNOTES}}', keynote_html)
          .replace('{{ARTISTS}}', artist_html)
          .replace('{{GUESTS}}', guest_html)
          .replace('{{REPS}}', rep_html)
          .replace('{{DEALERS}}', tiles(DEALER_IDX))
          .replace('{{BRANDS}}', tiles(BRAND_IDX))
          .replace('{{MEDIA}}', '\n'.join('<li>%s</li>' % e(m) for m in MEDIA))
          .replace('{{POSTER}}', img(0)).replace('{{FLOOR}}', img(7))
          .replace('{{SUNTEC_IN}}', img(8)).replace('{{SUNTEC_NIGHT}}', img(9)))
# The remaining {{key}} tokens are English strings from i18n/en.json
import re
out = re.sub(r'\{\{([a-z][\w.]*)\}\}', lambda m: e(EN[m.group(1)]), out)
assert '{{' not in out, re.findall(r'\{\{[^}]*\}\}', out)[:5]
# artifact.html: the fragment the Claude artifact host wraps in its own skeleton.
open(os.path.join(HERE, 'artifact.html'), 'w', encoding='utf-8').write(out)

# index.html: a complete document for GitHub Pages, with sharing and search metadata.
PAGES = 'https://christophertanenso.github.io/hiendasia-2026/'
DESC = ('17-19 Dec 2026, Level 3, Suntec Singapore. Free entry. 150+ high-end audio brands, '
        'listening rooms, keynote talks and live concerts.')
LD = json.dumps({
    '@context': 'https://schema.org', '@type': 'Event', 'name': EVENT,
    'startDate': '2026-12-17T10:00:00+08:00', 'endDate': '2026-12-19T19:00:00+08:00',
    'eventStatus': 'https://schema.org/EventScheduled',
    'eventAttendanceMode': 'https://schema.org/OfflineEventAttendanceMode',
    'location': {'@type': 'Place', 'name': 'Suntec Singapore Convention & Exhibition Centre, Level 3',
                 'address': {'@type': 'PostalAddress', 'streetAddress': '1 Raffles Boulevard',
                             'postalCode': '039593', 'addressCountry': 'SG'}},
    'image': [PAGES + img(0)], 'description': DESC, 'isAccessibleForFree': True,
    'offers': {'@type': 'Offer', 'price': '0', 'priceCurrency': 'SGD', 'availability': 'https://schema.org/InStock',
               'url': SITE},
    'organizer': {'@type': 'Organization', 'name': 'HiEnd Asia + Pte. Ltd', 'url': SITE},
}, ensure_ascii=False)
head, body = out.split('<header class="site-head">', 1)
doc = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="{e(DESC)}">
<meta property="og:type" content="website">
<meta property="og:title" content="HiEnd Asia 2026 · Free entry">
<meta property="og:description" content="{e(DESC)}">
<meta property="og:url" content="{PAGES}">
<meta property="og:image" content="{PAGES}{img(0)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="{PAGES}">
<script type="application/ld+json">{LD}</script>
{head.strip()}
</head>
<body>
<header class="site-head">{body}
</body>
</html>
'''
open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8').write(doc)

import re
files = {p: p for p in sorted(set(re.findall(r'(?:src|href|poster)="((?:img|video)/[^"]+)"', out)))}
json.dump(files, open(os.path.join(HERE, 'files.json'), 'w'), indent=0)
print('index.html', len(out), 'bytes;', len(files), 'images referenced')
