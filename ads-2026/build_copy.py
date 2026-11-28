"""Writes campaign-drafts.md and checks every line of ad copy against its platform limit.

    python build_copy.py
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
REG = 'https://www.hiendasia.com/register.html'
HOME = 'https://www.hiendasia.com/'


def url(base, source, medium, campaign, content):
    return f'{base}?utm_source={source}&utm_medium={medium}&utm_campaign={campaign}&utm_content={content}'


def check(items, limit, what):
    for s in items:
        assert len(s) <= limit, f'{what} over {limit}: {len(s)} "{s}"'
    return items


# ---------- Meta ----------
# Primary text: the first 125 characters show before "See more". Headline 40, description 30.
META_ADS = [
    dict(key='A-luckydraw', name='A · Lucky draw deadline', runs='Now to 5 Dec, 11:59pm',
         primary='Register for your free HiEnd Asia ticket by 5 December and you are in the daily lucky draw. Three winners every day of the show, 17–19 Dec at Suntec Singapore.',
         headline='Register by 5 Dec for the Lucky Draw', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='B-show', name='B · The show is back', runs='Now to 16 Dec',
         primary='Singapore’s hi-fi show is back. Hear the big names in dedicated listening rooms, with turntables, vinyl and NOWASIA art galleries on the same floor. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         headline='Your Free HiEnd Asia Ticket Is Waiting', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='C-keynotes', name='C · Keynote talks', runs='6 to 16 Dec',
         primary='Eleven keynote sessions over three days. Hear Richard H. Mak of Mono & Stereo and Daniel Hsu of PaPa Dan AV Lab in the listening rooms at HiEnd Asia, 17–19 Dec, Suntec Singapore. Your ticket is free when you register online.',
         headline='Free Ticket: 11 Keynote Sessions', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='D-free', name='D · Free entry', runs='6 to 16 Dec',
         primary='Three days of listening rooms, turntables, speakers and art on Level 3 of Suntec Singapore, 17–19 Dec. One free ticket gets you in on any day. Register online; it takes a minute.',
         headline='One Free Ticket, Any Day You Like', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='E-showdays', name='E · On now', runs='17 to 19 Dec, 9am–5pm',
         primary='HiEnd Asia is open now at Suntec Singapore. Listening rooms, the big names in hi-fi and art galleries on Level 3. Free entry, 10am–7pm, until Saturday 19 Dec.',
         headline='On Now at Suntec. Free Entry', desc='Level 3 · 10am–7pm', cta='Get Directions', base=HOME),
    dict(key='H-billyho', name='H · Billy Ho live', runs='Now to 16 Dec',
         primary='EB Duet at HiEnd Asia: the jazz duo’s guitarist and producer, Billy Ho, plays solo guitar live at the show, including a new song. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         headline='See EB Duet’s Billy Ho. Free Ticket', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='I-art', name='I · Hi-fi and art', runs='Now to 16 Dec',
         primary='HiEnd Asia shares Level 3 of Suntec Singapore with the NOWASIA art galleries: high-end hi-fi in dedicated listening rooms, and contemporary art a few steps away. 17–19 Dec. Your ticket is free when you register online. It takes a minute.',
         headline='Hi-Fi and Art. One Free Ticket', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='J-live', name='J · Listening rooms come alive', runs='Now to 16 Dec',
         primary='Hi-fi is better with people in the room. Three days of listening rooms, live music and art at HiEnd Asia, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         headline='Listening Rooms, Live Music, Free Ticket', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='F-brands', name='F · Brands coming', runs='Now to 16 Dec',
         primary='Audio-Technica, Accuphase, Wilson Audio, Pass Labs, Clearaudio, TAD and many more are coming to HiEnd Asia. Hear them in dedicated listening rooms, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         headline='Hear the Big Names. Get a Free Ticket', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
    dict(key='G-albums', name='G · HiEnd Asia albums', runs='Now to 16 Dec',
         primary='The HiEnd Asia commemorative albums are on sale at the show: the 2023, 2024 and 2025 CDs and the limited-edition 45 rpm double LP. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         headline='HiEnd Asia Commemorative CDs & LP', desc='Tap to get your free ticket', cta='Get Offer', base=REG),
]
for a in META_ADS:
    check([a['headline']], 40, 'Meta headline'); check([a['desc']], 30, 'Meta description')
    assert len(a['primary']) <= 260, (a['key'], len(a['primary']))

# ---------- Google Search (responsive search ad): 15 headlines of 30, 4 descriptions of 90 ----------
RSA_H = check([
    'HiEnd Asia 2026 Singapore', 'Singapore Hi-Fi Show 2026', '17–19 Dec at Suntec', 'Free Entry. Register Now',
    'Get Your Free Ticket', 'The Big Names in Hi-Fi', 'Listening Rooms on Level 3', 'Audio Visual & Art Exhibition',
    'Keynote Talks All 3 Days', 'Daily Lucky Draw at the Show', 'Register by 5 Dec for the Draw', 'Hear the Gear Before You Buy',
    'Vinyl, Turntables, Speakers', 'Official Site. Free Tickets', 'Suntec Convention Centre'], 30, 'RSA headline')
RSA_D = check([
    'Singapore’s hi-fi show returns to Suntec, 17–19 Dec 2026. Entry is free with a ticket.',
    'The big names in hi-fi in dedicated listening rooms, plus NOWASIA art galleries on Level 3',
    'Register once and enter on any of the three days. Your ticket is sent by email.',
    'Keynote talks, live music and a daily lucky draw for registered visitors. 10am–7pm.'], 90, 'RSA description')
SITELINKS = [('Register Free', 'One ticket covers all three days', REG), ('Show Floorplan', 'Find every listening room', HOME + '#floorplan'),
             ('Keynote Speakers', 'Eleven sessions, two experts', HOME + '#speakers'), ('Getting There', 'Level 3, Suntec Singapore', HOME + '#visit')]
for t, d, _ in SITELINKS:
    check([t], 25, 'sitelink text'); check([d], 35, 'sitelink description')
CALLOUTS = check(['Free Entry', '17–19 Dec 2026', '10am–7pm Daily', 'Level 3, Suntec', 'Top Hi-Fi Brands', 'Art Galleries Too'], 25, 'callout')

# ---------- Google Demand Gen: headlines of 40, descriptions of 90, business name of 25 ----------
DG_H = check(['Singapore’s Hi-Fi Show, 17–19 Dec', 'Free Entry to HiEnd Asia 2026', 'The Big Names in Hi-Fi at Suntec',
              'Register by 5 Dec for the Lucky Draw', 'Three Days of Listening Rooms'], 40, 'Demand Gen headline')
DG_D = check(RSA_D + ['Hear turntables, speakers and amplifiers in purpose-built rooms. Free with a ticket.'], 90, 'Demand Gen description')
check(['HiEnd Asia'], 25, 'business name')

KEYWORDS = {
    'Brand (always on)': ['[hiend asia]', '[hi end asia]', '[high end asia]', '[hiendasia]', '"hiend asia 2026"', '"hi end asia 2026"', '"hiend asia singapore"'],
    'The show (always on)': ['"hifi show singapore"', '"singapore hifi show"', '"audio show singapore"', '"singapore audio show 2026"',
                             '"hifi show 2026"', '"hifi exhibition"', '"high end audio show"', '"high end audio singapore"'],
    'What’s on (14 to 19 Dec only)': ['"suntec events"', '"suntec convention centre events"', '"things to do in singapore this weekend"',
                                      '"art exhibition singapore"', '"events in singapore this weekend"'],
}
NEGATIVES = ['jobs', 'career', 'hiring', 'rental', 'repair', 'second hand', 'used', 'cheap', 'wedding', 'car audio', 'exhibitor booth price', 'concert', 'chen lei', '陈雷']


def n(s): return f'{s} ({len(s)})'


L = []
w = L.append
w('# HiEnd Asia 2026: Meta and Google campaign drafts\n')
w('Drafted 28 Nov 2026. Show: 17–19 Dec 2026, Level 3, Suntec Singapore. Lucky draw registration closes 5 Dec.\n')
w('The Meta campaigns exist as unpublished drafts in Ads Manager. G1 and G2 are built in Google Ads and paused; G3 was not built (see below). Total budget: S$1,500, of which S$1,000 is Meta and S$500 is Google.\n')
w('## Budget split\n')
w('| Platform | Campaign | Budget | Runs |\n| --- | --- | --- | --- |')
for row in [('Meta', 'M1 Registrations, prospecting', 'S$540', '30 Nov to 16 Dec'), ('Meta', 'M2 Video awareness', 'S$180', '30 Nov to 14 Dec'),
            ('Meta', 'M3 Retargeting', 'S$150', '1 to 16 Dec'), ('Meta', 'M4 Show days', 'S$130', '16 to 19 Dec'),
            ('Google', 'G1 Search', 'S$140 campaign total', '28 Nov to 19 Dec'), ('Google', 'G2 Demand Gen (YouTube, Discover, Gmail)', 'S$360 campaign total (includes G3’s S$70)', '28 Nov to 16 Dec'),
            ('Google', 'G3 Demand Gen remarketing', 'Not built; S$70 moved to G2', '—')]:
    w('| ' + ' | '.join(row) + ' |')
w('\nThe Meta budgets are lifetime budgets on the ad sets. The Google budgets are campaign totals over the dates shown. Spend about 40% of the total by 5 Dec, while the lucky draw deadline gives people a reason to act.\n')

w('## Images\n')
w('All in `images/`, named `hea26_<concept>_<size>.jpg`. Each concept comes in four sizes.\n')
w('| Size | Use on Meta | Use on Google |\n| --- | --- | --- |')
w('| square 1080×1080 | Feed, Marketplace | Demand Gen square |')
w('| portrait 1080×1350 | Feed (preferred on mobile) | Demand Gen portrait |')
w('| story 1080×1920 | Stories, Reels | Not used |')
w('| landscape 1200×628 | Right column, Audience Network | Demand Gen landscape |')
w('\n`hea26_logo_1200x1200.png` is the square logo Google asks for.\n')
w('Story images keep the top 14% and bottom 20% clear for the app’s own buttons.\n')

w('## Meta\n')
w('Ad account: HiEnd Asia AdAccount. Pixel: HiEnd Asia Website. Optimise M1 and M3 for the `CompleteRegistration` event, not link clicks: last year’s paid social traffic engaged at 13%.\n')
w('### M1 Registrations, prospecting\n')
w('- **Objective:** Leads, conversion location Website, event `CompleteRegistration`.\n- **Location:** Singapore, people living there. **Age:** 25–65+.\n- **Placements:** Advantage+ placements.\n- **Budget:** S$540 at campaign level.\n- **Audience:** one broad ad set, Advantage+ audience on, no interests. M1 is an Advantage+ leads campaign, which has no interest targeting; decided 28 Nov 2026 to keep it broad rather than turn Advantage+ off and split S$540 three ways.\n- **Ads:** A (to 5 Dec), B, F, G, H, I, J and Carousel 1.\n')
w('### M2 Video awareness\n')
w('- **Objective:** Awareness, optimised for ThruPlay.\n- **Creative:** the 1:05 showcase video (`video/showcase-2025.mp4` in the site folder), with ad B’s text.\n- **Audience:** Singapore, 25–65+, broad with Advantage+ audience on.\n- **Why:** people who watch half of it become the M3 audience, and that list does not depend on cookie consent.\n- **Note:** the file is 480p. Use the original export if you have one.\n')
w('### M3 Retargeting\n')
w('- **Objective:** Leads, event `CompleteRegistration`.\n- **Include:** video viewers at 50% or more (30 days), Facebook and Instagram engagers (60 days), website visitors (30 days).\n- **Exclude:** people who fired `CompleteRegistration` (30 days).\n- **Ads:** the three retargeting messages below, one after another. The images are the prospecting ones; only the text changes.\n')
# Retargeting copy. Says "still deciding", never "you visited": Meta rejects ads that imply knowing what someone did.
RETARGET = [
    dict(key='R1', name='R1 · Lucky draw nudge', runs='1 to 5 Dec', images='A',
         primary='Still thinking about HiEnd Asia? Your free ticket takes a minute to claim. Register by 5 Dec and you’re also in the daily lucky draw. 17–19 Dec, Level 3, Suntec Singapore.',
         headline='Register by 5 Dec. Daily Lucky Draw'),
    dict(key='R2', name='R2 · Still deciding', runs='6 to 11 Dec', images='C, D and Carousel 2',
         primary='Still deciding? Come and hear it for yourself: three days of listening rooms, the big names in hi-fi and NOWASIA art on Level 3, Suntec. 17–19 Dec. Your ticket is free and registering takes a minute.',
         headline='Your Free Ticket Is Still Waiting'),
    dict(key='R3', name='R3 · Countdown', runs='12 to 16 Dec', images='B and D',
         primary='One week to go. HiEnd Asia opens 17 Dec on Level 3, Suntec Singapore. Register now and your free ticket is ready at the door. It takes a minute.',
         headline='Opens 17 Dec. Get Your Free Ticket'),
]
for r in RETARGET:
    check([r['headline']], 40, 'retargeting headline')
    assert len(r['primary']) <= 260, (r['key'], len(r['primary']))
for r in RETARGET:
    w(f"#### {r['name']}\n")
    w(f"- **Runs:** {r['runs']}\n- **Images:** {r['images']}\n- **Primary text:** {r['primary']}\n- **Headline:** {n(r['headline'])}\n- **Description:** Tap to get your free ticket\n- **Button:** Get Offer")
    w(f"- **Link:** `{url(REG, 'meta', 'paid_social', 'hea26_retarget_' + r['key'], '{{ad.name}}')}`\n")
w('### M4 Show days\n')
w('- **Objective:** Awareness, optimised for reach, frequency cap of 2 a day.\n- **Location:** Singapore, plus a second ad set for a 5 km radius around Suntec.\n- **Schedule:** 16 Dec 6pm to 19 Dec 5pm.\n- **Ad:** E, linking to the show page with a Get Directions button.\n')
w('### Meta ad copy\n')
for a in META_ADS:
    w(f"#### {a['name']}\n")
    w(f"- **Runs:** {a['runs']}\n- **Images:** `hea26_{a['key']}_*.jpg`\n- **Primary text:** {a['primary']}\n- **Headline:** {n(a['headline'])}\n- **Description:** {n(a['desc'])}\n- **Button:** {a['cta']}")
    w(f"- **Link:** `{url(a['base'], 'meta', 'paid_social', 'hea26_' + a['key'].split('-')[1], '{{ad.name}}')}`\n")
w('`{{ad.name}}` is a Meta URL parameter that fills in the ad’s name, so the registration Sheet shows which ad each ticket came from.\n')

# ---------- Meta carousels ----------
# Each card has its own headline (32 shows without cutting off) and link. One primary text for the whole carousel.
CAROUSELS = [
    dict(key='carousel-show', name='Carousel 1 · The whole show', campaign='hea26_carousel_show',
         primary='Singapore’s hi-fi show is back. The big names in dedicated listening rooms, keynote talks, the HiEnd Asia albums and a daily lucky draw. 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         cards=[('01_show', 'Singapore’s Hi-Fi Show Is Back'), ('02_brands', 'The Big Names Are Coming'),
                ('03_listening-rooms', '3 Days of Listening Rooms'), ('04_keynotes', '11 Sessions, 2 Experts'),
                ('05_billy-ho', 'EB Duet’s Billy Ho, Live'), ('06_albums', 'The HiEnd Asia Albums'),
                ('07_lucky-draw', 'Register by 5 Dec to Win'), ('08_register', 'Get Your Free Ticket')]),
    dict(key='carousel-brands', name='Carousel 2 · Brand by brand', campaign='hea26_carousel_brands',
         primary='The big names in hi-fi are coming to HiEnd Asia. Hear them in dedicated listening rooms, 17–19 Dec, Level 3, Suntec Singapore. Your ticket is free when you register online. It takes a minute.',
         cards=[('01_audio-technica', 'Hear Audio-Technica'), ('02_accuphase', 'Hear Accuphase'), ('03_wilson-audio', 'Hear Wilson Audio'),
                ('04_pass-labs', 'Hear Pass Labs'), ('05_clearaudio', 'Hear Clearaudio'), ('06_tad', 'Hear TAD'),
                ('07_register', 'Get Your Free Ticket')]),
]
for c in CAROUSELS:
    check([h for _, h in c['cards']], 32, 'carousel card headline')
    assert len(c['primary']) <= 260, (c['key'], len(c['primary']))

w('### One ad per brand\n')
w('`images/brands/` has a square and a portrait ad for each of the 36 brands ("Hear <name>") and the 5 dealers ("Visit <name>") on the site’s 2026 brand wall, named `hea26_brand_<name>_<size>.jpg`. Use them in M1 with ad F’s text, or give them to exhibitors to post.\n')
w('### Carousels\n')
w('Two carousel ads for Facebook and Instagram feed, 1080×1080 cards in `images/carousel-show/` and `images/carousel-brands/`. Use them in M1 beside the single images, and in M3 for retargeting. Turn off "automatically show the best performing cards first" so the order is kept: the first card is the hook and the last is the call to register.\n')
for c in CAROUSELS:
    w(f'#### {c["name"]}\n')
    w(f'- **Primary text:** {c["primary"]}')
    w('- **Description on every card:** Tap to get your free ticket')
    w('- **Button:** Get Offer')
    w(f'- **Link on every card:** {url(REG, "meta", "paid_social", c["campaign"], "{{ad.name}}")}\n')
    w('| Card | Image | Headline |\n| --- | --- | --- |')
    for k, (f, h) in enumerate(c['cards'], 1):
        w(f'| {k} | `{c["key"]}/{f}.jpg` | {h} |')
    w('')

w('## Google\n')
w('Account: **HIEND ASIA + PTE. LTD.**, 545-469-1642 (SGD, auto-tagging on). I can read it but not change it, so these are built by hand in Google Ads.\n')
w('What the account showed on 28 Nov 2026:\n')
w('- Four campaigns from 2025, all paused: `ChenLei2025 - Search` (S$905 spent), `HEA_GDN_SE-Asia_B2C` (S$296), `HEA_Search_SG_B2C` (S$283) and `chenlei025 - pmax` (S$6). Leave them paused and build new ones; between them they recorded one conversion.\n- No conversion measures a registration. The enabled ones are `Page view (1)`, `OUTBOUND_CLICK` and an Android installs default. Import the GA4 `sign_up` key event, make it the only primary conversion and set the others to secondary, or Maximise conversions will chase page views.\n- In `HEA_Search_SG_B2C`, `high end audio singapore` brought 605 clicks at S$0.09 with a 28% click-through rate, and the four spellings of the show name brought 424 clicks. `sound speaker` on broad match took S$128 for 597 clicks at an 8% click-through rate: do not reuse it, and use phrase or exact match only.\n')
w('### G1 Search\n')
w('- **Network:** Google Search only, no search partners, no Display.\n- **Location:** Singapore, presence only. **Language:** English.\n- **Bidding:** Maximise clicks with a S$0.60 bid cap to start (clicks cost S$0.09 to S$0.37 in 2025); switch to Maximise conversions once `sign_up` has 15 or more conversions.\n- **Why so small:** "hifi show singapore" gets about 20 searches a month and the site already ranks first or second for it.\n')
for g, ks in KEYWORDS.items():
    w(f'**{g}:** ' + ', '.join(f'`{k}`' for k in ks) + '\n')
w('**Negative keywords:** ' + ', '.join(f'`{k}`' for k in NEGATIVES) + '\n')
w('**Responsive search ad, headlines (30 max):**\n')
for i, h in enumerate(RSA_H, 1): w(f'{i}. {n(h)}')
w('\nPin headline 1 or 2 to position 1. Pause headlines 10 and 11 after 5 Dec.\n')
w('**Descriptions (90 max):**\n')
for i, d in enumerate(RSA_D, 1): w(f'{i}. {n(d)}')
w(f"\n**Final URL:** `{url(REG, 'google', 'cpc', 'hea26_search', '{adgroupid}')}`\n")
w('**Sitelinks:**\n\n| Text | Description | URL |\n| --- | --- | --- |')
for t, d, u in SITELINKS: w(f'| {t} | {d} | `{u}` |')
w('\n**Callouts:** ' + ' · '.join(CALLOUTS) + '\n')
w('### G2 Demand Gen\n')
w('- **Goal:** conversions (`sign_up`). **Location:** Singapore.\n- **Formats:** one video ad (the showcase video, uploaded to the HiEnd Asia YouTube channel) and one image ad per concept.\n- **Images:** landscape, square and portrait of A (to 5 Dec), B, C and D, plus the square logo.\n- **Button:** Sign up. **Business name:** HiEnd Asia.\n')
w('| Ad group | Audience |\n| --- | --- |')
w('| Hi-fi searchers | Custom segment: people who searched for hi-fi show, turntable, vinyl records, bookshelf speakers, amplifier, home theatre system |')
w('| In-market audio | In-market: Home audio, Speakers, Headphones; affinity: Audiophiles, Music lovers |')
w('| Art and culture | Affinity: Art and theatre aficionados; in-market: Event tickets |')
w('\n**Headlines (40 max):**\n')
for i, h in enumerate(DG_H, 1): w(f'{i}. {n(h)}')
w('\n**Descriptions (90 max):**\n')
for i, d in enumerate(DG_D, 1): w(f'{i}. {n(d)}')
w(f"\n**Final URL:** `{url(REG, 'google', 'demand_gen', 'hea26_demandgen', '{creative}')}`\n")
w('### G3 Demand Gen remarketing (not built)\n')
w('Not built on 28 Nov 2026: Google Ads sees 0 eligible people in the GA4 visitor list and rules it too small for Demand Gen. Its S$70 went to G2. The copy below is kept in case the list grows.\n')
w('- **Audience:** GA4 audience "visited, did not register" (page view in the last 30 days, no `sign_up`).\n- **Images:** A to 5 Dec, then C and D to 11 Dec, then B and D to 16 Dec; E on 17–18 Dec with the show page as the link.\n- **Copy:** the same three messages as M3, in the same order. Swap the headlines and descriptions on 6 and 12 Dec.\n- **Note:** this list only fills from visitors who accept cookies, so it will be small. Keep the budget at S$70; if it cannot spend, move what is left to G1.\n')
G3_H = [r['headline'] for r in RETARGET] + ['Claim Your Free Ticket in a Minute']
G3_D = ['Your free HiEnd Asia ticket takes a minute. Register by 5 Dec for the daily lucky draw.',
        'Three days of listening rooms and art at Suntec, 17–19 Dec. Free with a ticket.',
        'HiEnd Asia opens 17 Dec on Level 3, Suntec. Register now; your ticket is free.']
check(G3_H, 40, 'G3 headline')
check(G3_D, 90, 'G3 description')
w('**Headlines (40 max):** 1 is for R1 only (to 5 Dec), 2 for R2, 3 for R3; 4 runs throughout.\n')
for i, h in enumerate(G3_H, 1): w(f'{i}. {n(h)}')
w('\n**Descriptions (90 max):** 1 is for R1 only, 2 for R2, 3 for R3.\n')
for i, d in enumerate(G3_D, 1): w(f'{i}. {n(d)}')
w(f"\n**Final URL:** `{url(REG, 'google', 'demand_gen', 'hea26_remarketing', '{creative}')}`\n")

w('## Changes on fixed dates\n')
w('| Date | Change |\n| --- | --- |')
for d, c in [('5 Dec, 11:59pm', 'Stop every A (lucky draw) ad; pause RSA headlines 10 and 11'), ('6 Dec', 'Start C and D ads; retargeting moves from R1 to R2 (Meta switches itself; swap the G3 text by hand)'), ('12 Dec', 'Retargeting moves from R2 to R3 (Meta switches itself; swap the G3 text by hand)'),
             ('14 Dec', 'Start the "What’s on" search ad group; stop M2'), ('16 Dec, 6pm', 'Start M4 show-days ads'),
             ('17 Dec', 'Stop M1, M3 and G2; registrations still open, but spend moves to walk-ins'), ('19 Dec, 5pm', 'Stop everything')]:
    w(f'| {d} | {c} |')
w('\n## Before launch\n')
for s in ['Mark `sign_up` as a key event in GA4 and import it into Google Ads.',
          'In Google Ads account 545-469-1642, check the link to the GA4 property "hiendasia.com" and make `sign_up` the only primary conversion.',
          'Upload the showcase video to YouTube (needed for G2).',
          'Confirm Richard H. Mak’s sessions; the site still marks his topic as proposed.',
          'Have someone at HiEnd Asia approve the keynote portraits for advertising use.']:
    w(f'- {s}')

open(os.path.join(HERE, 'campaign-drafts.md'), 'w', encoding='utf-8').write('\n'.join(L) + '\n')
print('wrote campaign-drafts.md; all copy within limits')
