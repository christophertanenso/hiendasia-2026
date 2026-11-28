"""Renders the HiEnd Asia 2026 ad images.

    python build_ads.py            # all concepts, all sizes -> images/
    python build_ads.py B-show     # only names containing "B-show"
Needs Pillow and Google Chrome. Source art is copied from the site checkout (SITE) into src/assets.
The generated backgrounds in src/gen come from gen_art.py.

Layout rules the ads follow:
  - one picture, edge to edge, with one subject;
  - one headline of two or three short lines, readable at thumbnail size;
  - the offer ("Free entry", the deadline) in a round seal, because it is the reason to tap;
  - dates and place in a solid band along the bottom;
  - no drawn button: Meta and Google add their own.
"""
import os, shutil, subprocess, sys
from PIL import Image, ImageEnhance, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
# The site checkout: the worktree used on the Windows machine, or the repository this folder sits in.
SITE = os.path.join(HERE, '..', '.worktrees', 'site-updates')
if not os.path.isdir(SITE):
    SITE = os.path.join(HERE, '..')
COLLATERALS = os.path.join(HERE, '..', 'collaterals', 'Hiendasia 2026 - NOWASIA Art Fair collaterals')
SRC = os.path.join(HERE, 'src')
ASSETS = os.path.join(SRC, 'assets')
OUT = os.path.join(HERE, 'images')
CHROME = ('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' if sys.platform == 'darwin'
          else r'C:\Program Files\Google\Chrome\Application\chrome.exe')

SIZES = {            # name: (width, height, layout)
    'square-1080x1080': (1080, 1080, 'stack'),      # 'stack' also covers portrait; the body gets a 'square' class too
    'portrait-1080x1350': (1080, 1350, 'stack'),
    'story-1080x1920': (1080, 1920, 'story'),
    'landscape-1200x628': (1200, 628, 'side'),
}

# The six most searched of the 2026 exhibiting brands (site build.py BRAND_IDX), by Ahrefs monthly searches for
# the brand name, Singapore / worldwide, 28 Nov 2026, most searched first. Six, not twelve, so each logo is
# large enough to recognise on a phone.
#   Audio-Technica 1,200 / 112,000   Accuphase 80 / 8,700   Wilson Audio 50 / 6,200
#   Pass Labs 20 / 2,500             Clearaudio 10 / 2,000  TAD 30 / 1,100
# Next in line: Rogers 1,000, Finite Elemente 1,000, Koetsu 800, SME 450, Cary Audio 600, Graham Audio 500.
BRANDS = [(121, 'Audio-Technica'), (109, 'Accuphase'), (238, 'Wilson Audio'), (198, 'Pass Labs'), (308, 'Clearaudio'), (222, 'TAD')]
BRAND_LOGOS = [i for i, _ in BRANDS]
# Every logo on the site's 2026 brand wall (build.py BRAND_IDX, DEALER_IDX and the three added last), for one ad each.
# Brands get "Hear <name>"; the five dealers and distributors get "Visit <name>".
ALL_BRANDS = [
    (109, 'Accuphase'), (110, 'Acoustic Signature'), (300, 'AMR'), (310, 'Aries Cerat'), (107, 'Artesania Audio'), (117, 'Audio Desk'),
    (121, 'Audio-Technica'), (134, 'Cary Audio'), (308, 'Clearaudio'), (139, 'Diapason'), (147, 'Ensemble'), (151, 'Finite Elemente'),
    (159, 'Graham Audio'), (305, 'Graham Engineering'), (163, 'Ikeda Sound Labs'), (315, 'JYC Audio'), (304, 'Koetsu'), (176, 'Live Cable'),
    (307, 'Magnum Dynalab'), (314, 'Medien'), (184, 'Metronome'), (188, 'MontAudio'), (198, 'Pass Labs'), (309, 'Purist Audio Design'),
    (207, 'Rogers'), (302, 'Ronnie'), (301, 'San Yuan'), (313, 'Sharkwire'), (213, 'Signal Projects'), (303, 'SME'), (220, 'Sutherland'),
    (222, 'TAD'), (306, 'Vimberg'), (311, 'Westend Audio Systems'), (238, 'Wilson Audio'), (316, 'Zeromax')]
DEALERS = [(312, 'Analog Playground'), (85, 'AudioLine'), (101, 'High End Research'), (92, 'MU6'), (237, 'Welchen Music')]
LOGO_BG = {}   # logo file -> tile colour, for logos drawn on black; filled in by assets()
BAR = 'Tap to get your free ticket'      # the band is the call to action
WHEN = '17 – 19 Dec · Suntec Singapore'   # date and place, on its own line above the band
FREE = ('Register now', 'Free', 'Ticket')
# The audience is mostly 45 and older: few words, large type. Each ad has one headline and one short line.
# bg: one file, or one per layout. pos: object-position, one or per layout. badge: (small, big, small).
CONCEPTS = {
    'A-luckydraw': dict(
        bg={'stack': 'gen/jackpot_4x5.png', 'story': 'gen/jackpot_4x5.png', 'side': 'gen/jackpot_16x9.png'},
        pos={'stack': '50% 30%', 'story': '50% 50%', 'side': '50% 50%'}, loud=True,
        kicker='Lucky Draw &amp; Mystery Blind Box', head='3 Winners<br><em>Every Day!</em>', hs=14,
        sub='Register free by 5 December to be in the draw.',
        badge=('Register by', '5 Dec', 'It’s free'), bar=BAR),
    'B-show': dict(
        tiles=['show-crowd.jpg', 'show-speakers.jpg', 'show-turntable.jpg', 'show-vinyl.jpg'], kind='photos', tag='HiEnd Asia 2025',
        kicker='Packed in 2025 · Back 17 Dec', head='Singapore’s<br><em>Hi-Fi Show</em><br>Is Back', hs=11,
        sub='Claim your free ticket today.',
        badge=FREE, bar=BAR),
    'C-keynotes': dict(
        people=[('mak.jpg', 'Richard H. Mak', 'Mono &amp; Stereo'), ('hsu.jpg', 'Daniel Hsu', 'PaPa Dan AV Lab')],
        kicker='Keynote talks · All 3 days', head='11 Sessions.<br><em>2 Experts.</em>', hs=11,
        sub='Free to attend. Register for your ticket.',
        badge=FREE, bar=BAR),
    # Billy Ho of EB Duet, from the site's guest list: he plays solo guitar at the show. EB Duet is the better
    # known name, so it leads the headline; the wording does not say the duo itself is playing.
    'H-billyho': dict(
        bg='billyho.jpg', pos={'stack': '50% 22%', 'story': '50% 22%', 'side': '50% 22%'}, top=True,
        kicker='Live at the show · Solo guitar', head='<em>EB Duet’s</em><br>Billy Ho Live', hs=11.5,
        sub='See him free. Get your ticket now.',
        badge=FREE, bar=BAR),
    # From the image catalogue (photos 007 and 136, NOWASIA Art Fair, August 2026). 007 is cleared for ads as it
    # stands; 136 shows recognisable guests and performers, whose consent is needed before it runs as a paid ad.
    'I-art': dict(
        bg='art-aisle.jpg', pos={'stack': '40% 45%', 'story': '40% 45%', 'side': '30% 45%'}, top=True,
        kicker='With NOWASIA · Level 3', head='Hi-Fi and<br><em>Art Galleries</em>', hs=10,
        sub='Two worlds, one free ticket.',
        badge=FREE, bar=BAR),
    'J-live': dict(
        bg='live-session.jpg', pos={'stack': '45% 100%', 'story': '45% 100%', 'side': '40% 100%'}, top=True, fade='short',
        kicker='As seen at NOWASIA · Aug 2026', head='Listening Rooms<br><em>Come Alive</em>', hs=9,
        sub='Hi-fi, live music and art. Get your free ticket.',
        badge=FREE, bar=BAR),
    'D-free': dict(
        bg='listening.jpg', pos={'stack': '50% 60%', 'story': '50% 60%', 'side': '100% 62%'}, top=True,
        kicker='Audio × Art · Level 3', head='3 Days of<br><em>Listening Rooms</em>', hs=9.2,
        sub='One free ticket, any day you like.',
        badge=FREE, bar=BAR),
    'E-showdays': dict(
        bg='suntec.jpg', pos={'stack': '50% 45%', 'story': '50% 45%', 'side': '80% 45%'}, top=True,
        kicker='Hi-End Asia 2026', head='Open Now<br><em>at Suntec</em>', hs=13,
        sub='Walk in today. Entry is free.',
        badge=('Open', 'Now', 'Free entry'), bar='10am – 7pm · Level 3, Suntec', when=''),
    'F-brands': dict(
        tiles=[f'logo-{i}.jpg' for i in BRAND_LOGOS], kind='wall',
        kicker='Exhibiting in 2026', head='The Big Names<br><em>Are Coming</em>', hs=10.8,
        sub='Hear them free. Get your ticket now.',
        badge=FREE, bar=BAR),
    'G-albums': dict(
        tiles=['album-2025-lp.jpg', 'album-2025-cd.jpg', 'album-2024-cd.jpg', 'album-2023-cd.jpg'], kind='albums',
        kicker='CDs &amp; Vinyl · 2023 to 2025', head='The HiEnd Asia<br><em>Albums</em>', hs=10.8,
        sub='On sale at the show. Entry is free with a ticket.',
        badge=FREE, bar=BAR),
}

# Carousel cards (1080 x 1080 only). The end card closes both carousels.
END_CARD = dict(
    bg='suntec.jpg', pos='50% 45%', top=True,
    kicker='17 – 19 Dec · Suntec Singapore', head='Get Your<br><em>Free Ticket</em>', hs=12.5,
    sub='Tap to register. It takes a minute.', badge=FREE, bar=BAR, when='')


def brand_card(i, name, verb='Hear', kicker='Exhibiting in 2026'):
    # The name stays on one line, so long names step the headline down.
    return dict(tiles=[f'logo-{i}.jpg'], kind='one', kicker=kicker, head=f'{verb}<br><em>{name}</em>',
                hs=round(min(11.5, 135 / len(name)), 1), sub='', badge=FREE, bar=BAR)


SWIPE = 'Swipe to see what’s on  ›'
CAROUSELS = {
    # The whole show in seven cards: what it is, who is coming, what to do there, why register now.
    'carousel-show': [('show', dict(CONCEPTS['B-show'], bar=SWIPE)), ('brands', CONCEPTS['F-brands']), ('listening-rooms', CONCEPTS['D-free']),
                      ('keynotes', CONCEPTS['C-keynotes']), ('billy-ho', CONCEPTS['H-billyho']), ('albums', CONCEPTS['G-albums']), ('lucky-draw', CONCEPTS['A-luckydraw']),
                      ('register', END_CARD)],
    # One brand per card, most searched first.
    'carousel-brands': [(name.lower().replace(' ', '-'), dict(brand_card(i, name), **({'bar': 'Swipe for more brands  ›'} if k == 0 else {})))
                        for k, (i, name) in enumerate(BRANDS)] + [('register', END_CARD)],
}

CSS = """
@font-face { font-family: Arimo; font-weight: 400 700; src: url(assets/arimo-latin.woff2) format('woff2'); }
@font-face { font-family: 'Open Sans'; font-weight: 300 800; src: url(assets/opensans-latin.woff2) format('woff2'); }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: 100%; height: 100%; overflow: hidden; background: #000; }
body { --u: calc(min(100vw, 100vh) / 100); --pad: calc(var(--u) * 6); --barh: calc(var(--u) * 9); --k: 1;
       color: #fff; font-family: 'Open Sans', sans-serif; position: relative; }

.bg { position: absolute; inset: 0; overflow: hidden; }
.bg img { width: 100%; height: 100%; object-fit: cover; display: block; }
/* Darkens the top for the logos and the bottom for the type; the middle of the picture stays untouched. */
.bg::after { content: ''; position: absolute; inset: 0; background:
    linear-gradient(to bottom, rgba(0,0,0,.78) 0, rgba(0,0,0,0) 20%),
    linear-gradient(to top, #000 0, rgba(0,0,0,.94) 26%, rgba(0,0,0,.6) 44%, rgba(0,0,0,0) 62%); }
/* Real photographs keep to the top of the frame so the subject is not buried under the type. */
body.top .bg { bottom: 37%; }
body.top .bg::after { background:
    linear-gradient(to bottom, rgba(0,0,0,.94) 0, rgba(0,0,0,.62) 14%, rgba(0,0,0,0) 32%),
    linear-gradient(to top, #000 0, rgba(0,0,0,.55) 18%, rgba(0,0,0,0) 40%); }
body.square.top .bg { bottom: 42%; }
/* For a photo whose subject sits at its bottom edge: the photo stops above the type, with a shorter fade. */
body.top.short .bg { bottom: 47%; }
body.square.top.short .bg { bottom: 50%; }
body.story.top.short .bg { height: 68vw; }
body.top.short .bg::after { background:
    linear-gradient(to bottom, rgba(0,0,0,.94) 0, rgba(0,0,0,.62) 14%, rgba(0,0,0,0) 32%),
    linear-gradient(to top, #000 0, rgba(0,0,0,.35) 7%, rgba(0,0,0,0) 16%); }

.logos { position: absolute; z-index: 3; top: calc(var(--u) * 4.5); left: var(--pad); display: flex; align-items: center; gap: calc(var(--u) * 2.2); }
.logos img.hea { height: calc(var(--u) * 6.6); width: auto; }
.logos i { width: 1px; height: calc(var(--u) * 5.4); background: #c6a661; opacity: .8; }
.logos img.now { height: calc(var(--u) * 5.2); width: auto; }

/* The offer: a round seal, tilted so it breaks the grid and is read straight after the headline. */
.badge { position: absolute; z-index: 4; top: calc(var(--u) * 3.5); right: calc(var(--u) * 4); width: calc(var(--u) * 27); height: calc(var(--u) * 27);
         border-radius: 50%; background: radial-gradient(circle at 32% 26%, #fff3c9 0, #f0d289 30%, #c6a052 72%, #a8833a 100%); color: #111;
         display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; transform: rotate(9deg);
         box-shadow: 0 calc(var(--u) * .8) calc(var(--u) * 3) rgba(0,0,0,.6), inset 0 0 0 calc(var(--u) * .45) rgba(255,255,255,.35); }
.badge::before { content: ''; position: absolute; inset: calc(var(--u) * 1.1); border-radius: 50%; border: calc(var(--u) * .22) dashed rgba(0,0,0,.45); }
.badge small { font: 700 calc(var(--u) * 3)/1.15 Arimo, sans-serif; letter-spacing: .1em; text-transform: uppercase; }
.badge b { font: 700 calc(var(--u) * 9)/.98 Arimo, sans-serif; letter-spacing: -.01em; text-transform: uppercase; white-space: nowrap; }
.badge b.long { font-size: calc(var(--u) * 7.4); }

.copy { position: absolute; z-index: 2; left: var(--pad); right: var(--pad); bottom: calc(var(--barh) + var(--u) * 4.2);
        display: flex; flex-direction: column; gap: calc(var(--u) * 2); }
.kicker { font: 700 calc(var(--u) * 3.5 * var(--k))/1.25 Arimo, sans-serif; letter-spacing: .1em; text-transform: uppercase; color: #e9c877; }
h1 { font: 700 calc(var(--u) * var(--hs) * var(--k))/.98 Arimo, sans-serif; text-transform: uppercase; letter-spacing: -.012em; color: #fff;
     text-shadow: 0 calc(var(--u) * .3) calc(var(--u) * 2.4) rgba(0,0,0,.75); }
h1 em { font-style: normal; color: #f3cf7a; white-space: nowrap; }
.sub { font: 600 calc(var(--u) * 4.5 * var(--k))/1.3 'Open Sans', sans-serif; color: #f4f1ea; max-width: 26em; text-wrap: balance;
       text-shadow: 0 0 calc(var(--u) * 1.6) rgba(0,0,0,.9); }

.when { font: 700 calc(var(--u) * 3.3 * var(--k))/1.2 Arimo, sans-serif; letter-spacing: .08em; text-transform: uppercase; color: #e9c877;
        text-shadow: 0 0 calc(var(--u) * 1.6) rgba(0,0,0,.9); }

/* A solid band: the call to action stays readable on any picture and at thumbnail size. */
.bar { position: absolute; z-index: 3; left: 0; right: 0; bottom: 0; height: var(--barh); background: linear-gradient(to right, #b8924a, #f0d289 50%, #b8924a);
       color: #0b0b0b; display: flex; align-items: center; justify-content: center; padding: 0 calc(var(--u) * 3);
       font: 700 calc(var(--u) * 4)/1 Arimo, sans-serif; letter-spacing: .08em; text-transform: uppercase; white-space: pre; }

/* Tile panels: real show photos, brand logos, album covers. The page becomes a column, so the tiles take
   whatever height the type leaves and nothing overlaps. The seal sits in the top band beside the logos. */
body.panel-ad { display: flex; flex-direction: column; padding-top: calc(var(--u) * 24); }
.panel { position: relative; z-index: 1; flex: 1 1 0; min-height: 0; margin: 0 var(--pad); display: grid; gap: calc(var(--u) * 1.2); }
.panel > div { position: relative; overflow: hidden; border-radius: calc(var(--u) * 1); background: #fff; min-height: 0; min-width: 0; }
.panel img { position: absolute; inset: 0; width: 100%; height: 100%; display: block; object-fit: cover; }
.panel.photos { grid-template-columns: repeat(3, 1fr); grid-template-rows: 1.9fr 1fr; }
.panel.photos > div:first-child { grid-column: span 3; }
.panel .tag { position: absolute; left: calc(var(--u) * 1.4); bottom: calc(var(--u) * 1.4); padding: calc(var(--u) * .7) calc(var(--u) * 1.4); border-radius: calc(var(--u) * .6);
              background: rgba(0,0,0,.72); color: #f3cf7a; font: 700 calc(var(--u) * 2.8)/1 Arimo, sans-serif; letter-spacing: .1em; text-transform: uppercase; }
.panel.photos > div { background: #111; }
.panel.wall { grid-template-columns: repeat(2, 1fr); grid-template-rows: repeat(3, 1fr); gap: calc(var(--u) * 1.4); }
.panel.wall img, .panel.one img { object-fit: contain; padding: 7% 12%; }
.panel.one img { padding: 9% 20%; }
.panel.one { grid-template-columns: 1fr; }
.panel.albums { grid-template-columns: 2.05fr 1fr; grid-template-rows: repeat(3, 1fr); }
.panel.albums > div { background: #1c1c1e; }
.panel.albums > div:first-child { grid-row: span 3; }
body.panel-ad.panel-ad .copy { position: relative; left: auto; right: auto; bottom: auto; flex: none; padding: calc(var(--u) * 3.4) var(--pad) calc(var(--barh) + var(--u) * 4.2); }
body.panel-ad .badge { top: calc(var(--u) * 1.4); right: calc(var(--u) * 5); width: calc(var(--u) * 21); height: calc(var(--u) * 21); }
body.panel-ad .badge b { font-size: calc(var(--u) * 7); }
body.panel-ad .badge small { font-size: calc(var(--u) * 2.5); }
body.square .panel.wall { grid-template-columns: repeat(3, 1fr); grid-template-rows: repeat(2, 1fr); }
body.square.panel-ad .sub { display: none; }
body.square .panel.photos { grid-template-rows: 1fr; }
body.square .panel.photos > div:not(:first-child) { display: none; }
body.square.panel-ad { padding-top: calc(var(--u) * 22); }
body.story.panel-ad { padding-top: calc(14vh + var(--u) * 24); --k: .94; }
body.story.panel-ad .badge { top: calc(14vh + var(--u) * 1); }
body.story.panel-ad.panel-ad .copy { padding-bottom: calc(20vh + var(--barh) + var(--u) * 4); }
body.side.panel-ad { display: block; padding: 0; }
body.side .panel { position: absolute; margin: 0; inset: calc(var(--u) * 6) calc(var(--u) * 6) calc(var(--barh) + var(--u) * 5) 47%; }
body.side.panel-ad.panel-ad .copy { position: absolute; padding: 0; left: var(--pad); right: 55%; bottom: calc(var(--barh) + var(--u) * 5.5); }
body.side.panel-ad .sub { font-size: calc(var(--u) * 4.4); }
body.side.panel-ad .kicker { font-size: calc(var(--u) * 3.5); }
/* No room for the seal beside the tiles in landscape, so the offer moves into the band. */
body.side.panel-ad .badge { display: none; }
body.side.panel-ad { --k: 1; }
body.side .panel.albums img { object-fit: contain; }

/* Speaker cards. */
.people { position: absolute; z-index: 1; left: var(--pad); right: var(--pad); top: calc(var(--u) * 24); height: calc(var(--u) * 43);
          display: grid; grid-template-columns: 1fr 1fr; gap: calc(var(--u) * 1.6); }
.person { position: relative; overflow: hidden; border-radius: calc(var(--u) * 1.6); border: calc(var(--u) * .25) solid #c6a661; background: #111; }
.person img { width: 100%; height: 100%; object-fit: cover; object-position: 50% 16%; display: block; }
.person .cap { position: absolute; left: 0; right: 0; bottom: 0; padding: calc(var(--u) * 7) calc(var(--u) * 2.4) calc(var(--u) * 2.2); background: linear-gradient(to top, rgba(0,0,0,.95) 30%, rgba(0,0,0,0)); }
.person b { display: block; font: 700 calc(var(--u) * 4.7)/1.1 Arimo, sans-serif; color: #fff; }
.person span { font: 700 calc(var(--u) * 2.9)/1.25 Arimo, sans-serif; letter-spacing: .05em; text-transform: uppercase; color: #e9c877; }
body.people-ad .badge { top: calc(var(--u) * 1.4); right: calc(var(--u) * 5); width: calc(var(--u) * 21); height: calc(var(--u) * 21); }
body.people-ad .badge b { font-size: calc(var(--u) * 7); }
body.people-ad .badge small { font-size: calc(var(--u) * 2.5); }
body.square.people-ad .people { top: calc(var(--u) * 22); height: calc(var(--u) * 32); }
body.square.people-ad .person img { object-position: 50% 12%; }
body.square.people-ad .sub { display: none; }

/* Square: less height, so the type steps down a little. */
body.square { --k: .92; }

/* Stories and Reels: nothing in the top 14% or bottom 20%, where the app draws its own controls. */
body.story { --k: 1.06; }
body.story .bg { inset: 9vh 0 auto 0; height: 125vw; }
body.story .bg::after { background:
    linear-gradient(to bottom, #000 0, rgba(0,0,0,.6) 12%, rgba(0,0,0,0) 26%),
    linear-gradient(to top, #000 0, rgba(0,0,0,.92) 22%, rgba(0,0,0,.5) 40%, rgba(0,0,0,0) 58%); }
body.story.top .bg { height: 96vw; bottom: auto; }
body.story .logos { top: calc(14vh + var(--u) * 1); }
body.story .badge { top: calc(14vh + var(--u) * 9); }
body.story .bar { bottom: 20vh; left: var(--pad); right: var(--pad); border-radius: calc(var(--u) * 1.2); }
body.story .copy { bottom: calc(20vh + var(--barh) + var(--u) * 4); }
body.story.people-ad .people { top: calc(14vh + var(--u) * 24); height: calc(var(--u) * 27); }
body.story.people-ad .badge { top: calc(14vh + var(--u) * 1); }

/* Landscape: type on the left, the picture's subject on the right. */
body.side { --k: 1.16; --barh: calc(var(--u) * 12); --pad: calc(var(--u) * 7); }
body.side .bg::after { background:
    linear-gradient(to right, #000 0, rgba(0,0,0,.9) 34%, rgba(0,0,0,.35) 56%, rgba(0,0,0,0) 72%),
    linear-gradient(to top, rgba(0,0,0,.7) 0, rgba(0,0,0,0) 30%); }
body.side.top .bg { bottom: 0; left: 40%; }
body.side.top .bg::after { background: linear-gradient(to right, #000 0, rgba(0,0,0,.45) 22%, rgba(0,0,0,0) 45%), linear-gradient(to top, rgba(0,0,0,.6) 0, rgba(0,0,0,0) 30%); }
body.side .logos { top: calc(var(--u) * 6); }
body.side .logos img.hea { height: calc(var(--u) * 9); }
body.side .logos img.now { height: calc(var(--u) * 7); }
body.side .logos i { height: calc(var(--u) * 7.4); }
body.side .copy { right: 44%; bottom: calc(var(--barh) + var(--u) * 5.5); gap: calc(var(--u) * 2.6); }
body.side .kicker { font-size: calc(var(--u) * 3.9); }
body.side .sub { font-size: calc(var(--u) * 4.8); }
body.side .bar { font-size: calc(var(--u) * 5); }
body.side .badge { top: calc(var(--u) * 5); right: calc(var(--u) * 5); width: calc(var(--u) * 33); height: calc(var(--u) * 33); }
body.side .badge b { font-size: calc(var(--u) * 11); }
body.side .badge b.long { font-size: calc(var(--u) * 9); }
body.side .badge small { font-size: calc(var(--u) * 2.9); }
body.side.people-ad .people { left: 54%; right: var(--pad); top: calc(var(--u) * 6); height: auto; bottom: calc(var(--barh) + var(--u) * 5.5); }
body.side.people-ad .copy { right: 48%; }
body.side.people-ad .badge { display: none; }
body.side.people-ad .person b { font-size: calc(var(--u) * 5.2); }
body.side.people-ad .person span { font-size: calc(var(--u) * 3.2); }

/* Lucky draw: louder than the rest. A red starburst for the deadline, a gold-foil headline with a glow, a red band. */
body.loud .bg::after { background:
    linear-gradient(to bottom, rgba(0,0,0,.7) 0, rgba(0,0,0,0) 18%),
    linear-gradient(to top, #000 0, rgba(0,0,0,.9) 24%, rgba(0,0,0,.45) 42%, rgba(0,0,0,0) 58%); }
body.loud .badge { width: calc(var(--u) * 34); height: calc(var(--u) * 34); top: calc(var(--u) * 1.5); right: calc(var(--u) * 1.5); border-radius: 0; box-shadow: none;
    background: radial-gradient(circle at 40% 35%, #ff5a4d 0, #e01f26 45%, #a80f18 100%); color: #fff; transform: rotate(10deg);
    filter: drop-shadow(0 calc(var(--u) * .8) calc(var(--u) * 2) rgba(0,0,0,.7));
    clip-path: polygon(50% 0%, 59% 11%, 71% 4%, 75% 17%, 89% 15%, 87% 29%, 100% 34%, 91% 45%, 100% 57%, 87% 62%, 91% 76%, 77% 76%, 74% 90%, 61% 85%, 52% 100%, 43% 87%, 30% 94%, 26% 80%, 12% 82%, 14% 68%, 0% 62%, 9% 51%, 0% 39%, 13% 34%, 10% 20%, 24% 20%, 28% 6%, 41% 12%); }
body.loud .badge::before { display: none; }
body.loud .badge small { font-size: calc(var(--u) * 2.9); color: #ffe9a8; }
body.loud .badge b, body.loud .badge b.long { font-size: calc(var(--u) * 8.6); }
body.loud h1 { color: #fff; text-shadow: 0 0 calc(var(--u) * 3) rgba(255,190,60,.55), 0 calc(var(--u) * .5) calc(var(--u) * 1.2) rgba(0,0,0,.9); }
body.loud h1 em { background: linear-gradient(to bottom, #fff6c8 0, #ffd65c 38%, #f0a81e 62%, #ffe28a 100%); -webkit-background-clip: text; background-clip: text;
    color: transparent; filter: drop-shadow(0 calc(var(--u) * .5) calc(var(--u) * 1) rgba(0,0,0,.85)); text-shadow: none; }
body.loud .kicker { align-self: flex-start; background: #f3cf7a; color: #111; padding: calc(var(--u) * 1) calc(var(--u) * 2); border-radius: calc(var(--u) * .8); letter-spacing: .06em; }
body.loud .bar { background: linear-gradient(to right, #c8151d, #ef2b2f 50%, #c8151d); color: #fff; }
body.loud.side .badge { width: calc(var(--u) * 40); height: calc(var(--u) * 40); top: calc(var(--u) * 2); right: calc(var(--u) * 3); }
body.loud.side .badge b, body.loud.side .badge b.long { font-size: calc(var(--u) * 10.5); }
body.loud.side .badge small { font-size: calc(var(--u) * 3.5); }
body.loud.story .badge { top: calc(14vh + var(--u) * 7); }
"""


def pick(v, layout):
    return v[layout] if isinstance(v, dict) else v


def page(c, layout, shape):
    if c.get('people'):
        art = '<div class="people">' + ''.join(
            f'<div class="person"><img src="assets/{f}"><div class="cap"><b>{n}</b><span>{r}</span></div></div>' for f, n, r in c['people']) + '</div>'
    elif c.get('tiles'):
        def tile(k, f):
            bg = LOGO_BG.get(f)
            return (f'<div style="background:{bg};box-shadow:inset 0 0 0 2px #c6a661">' if bg else '<div>') + f'<img src="assets/{f}">' + (f'<span class="tag">{c["tag"]}</span>' if k == 0 and c.get('tag') else '') + '</div>'
        art = f'<div class="panel {c["kind"]}">' + ''.join(tile(k, f) for k, f in enumerate(c['tiles'])) + '</div>'
    else:
        art = f'<div class="bg"><img src="assets/{pick(c["bg"], layout)}" style="object-position:{pick(c["pos"], layout)}"></div>'
    top, big, bottom = c['badge']
    badge = (f'<small>{top}</small>' if top else '') + f'<b class="{"long" if len(big) > 4 else ""}">{big}</b>' + (f'<small>{bottom}</small>' if bottom else '')
    cls = ' '.join(filter(None, [layout, shape, 'people-ad' if c.get('people') else '', 'panel-ad' if c.get('tiles') else '', 'top' if c.get('top') else '', c.get('fade', ''), 'loud' if c.get('loud') else '']))
    return f"""<!doctype html><meta charset="utf-8"><style>{CSS}</style>
<body class="{cls}" style="--hs:{c['hs']}">
{art}
<div class="logos"><img class="hea" src="assets/logo.svg"><i></i><img class="now" src="assets/nowasia-logo.webp"></div>
<div class="badge">{badge}</div>
<div class="copy">
  <p class="kicker">{c['kicker']}</p>
  <h1>{c['head']}</h1>
  {('<p class="sub">' + c['sub'] + '</p>') if c['sub'] else ''}
  {('<p class="when">' + c.get('when', WHEN) + '</p>') if c.get('when', WHEN) else ''}
</div>
<div class="bar">{c['bar']}</div>
</body>"""


def assets():
    os.makedirs(os.path.join(ASSETS, 'gen'), exist_ok=True)
    for a, b in [('fonts/arimo-latin.woff2', 'arimo-latin.woff2'), ('fonts/opensans-latin.woff2', 'opensans-latin.woff2'),
                 ('img/logo.svg', 'logo.svg'), ('img/monogram.svg', 'monogram.svg'), ('img/nowasia-logo.webp', 'nowasia-logo.webp')]:
        shutil.copyfile(os.path.join(SITE, a), os.path.join(ASSETS, b))
    def save(src, dst):
        Image.open(os.path.join(SITE, src)).convert('RGB').save(os.path.join(ASSETS, dst), quality=94)
    save('img/009.jpg', 'suntec.jpg')
    save('img/013.jpg', 'mak.jpg')
    save('img/016.jpg', 'hsu.jpg')
    save('img/017.jpg', 'billyho.jpg')
    # The HiEnd Asia listening room at NOWASIA, cropped to the seated listeners seen from behind and the horn
    # speakers. The crop leaves out the standing man on the right, the only face turned to the camera.
    # The original photo is not in the repository; without it the saved crop in src/photos is used.
    original = os.path.join(COLLATERALS, '015_IMG_8161.JPG')
    if os.path.exists(original):
        room = ImageOps.exif_transpose(Image.open(original)).convert('RGB')
        room = room.crop((850, 560, 2950, 2360)).resize((1680, 1440), Image.LANCZOS)
        ImageEnhance.Color(ImageEnhance.Contrast(room).enhance(1.08)).enhance(1.12).save(os.path.join(ASSETS, 'listening.jpg'), quality=93)
    else:
        shutil.copyfile(os.path.join(SRC, 'photos', 'listening.jpg'), os.path.join(ASSETS, 'listening.jpg'))
    # Brand logos and album photographs from the site; the album crops trim the studio backdrop.
    for i in sorted({i for i, _ in ALL_BRANDS + DEALERS}):
        save(f'img/{i:03d}.jpg', f'logo-{i}.jpg')
        # Each logo is trimmed to its mark so it fills the tile. Tiles are white, except under a logo drawn on black.
        im = Image.open(os.path.join(ASSETS, f'logo-{i}.jpg')).convert('RGB')
        grey = im.convert('L')
        dark = grey.resize((1, 1)).getpixel((0, 0)) < 90
        box = grey.point(lambda v: 255 if (v > 48 if dark else v < 215) else 0).getbbox()
        im.crop(box).save(os.path.join(ASSETS, f'logo-{i}.jpg'), quality=95)
        if dark:
            LOGO_BG[f'logo-{i}.jpg'] = '#000'
    Image.open(os.path.join(SITE, 'img', 'cd-2023.webp')).convert('RGB').crop((50, 30, 615, 465)).save(os.path.join(ASSETS, 'album-2023-cd.jpg'), quality=94)
    for src, dst in [('hea7', 'album-2025-lp.jpg'), ('hea5', 'album-2025-cd.jpg'), ('hea6', 'album-2024-cd.jpg')]:
        Image.open(os.path.join(SITE, 'img', 'cds', src + '-1000.webp')).convert('RGB').crop((140, 30, 860, 720)).save(os.path.join(ASSETS, dst), quality=94)
    # Stills from the 2025 show film: a full room, the equipment, the vinyl stalls. 832px wide, so the big tile is slightly soft.
    # The number is the second of the film (frame n after fps=1).
    for n, dst in [(30, 'show-crowd.jpg'), (4, 'show-speakers.jpg'), (44, 'show-turntable.jpg'), (45, 'show-vinyl.jpg')]:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(SITE, 'video', 'showcase-2025.mp4'),
                        '-vf', r'fps=1,select=eq(n\,%d)' % n, '-frames:v', '1', '-q:v', '1', os.path.join(ASSETS, dst)], check=True)
    # Two more catalogue photos, cropped; the saved crops in src/photos stand in when the originals are absent.
    for src, dst, box, size in [('007_IMG_8142.JPG', 'art-aisle.jpg', (0, 60, 4000, 2600), (2000, 1270)),
                                ('136_IMG_8388.JPG', 'live-session.jpg', (350, 640, 3650, 2666), (2000, 1228))]:
        original = os.path.join(COLLATERALS, src)
        if os.path.exists(original):
            im = ImageOps.exif_transpose(Image.open(original)).convert('RGB').crop(box).resize(size, Image.LANCZOS)
            im = ImageEnhance.Color(ImageEnhance.Contrast(im).enhance(1.06)).enhance(1.1)
            im.save(os.path.join(SRC, 'photos', dst), quality=92)
        shutil.copyfile(os.path.join(SRC, 'photos', dst), os.path.join(ASSETS, dst))
    # Generated backgrounds (gen_art.py), scaled down to what the largest ad needs.
    for f in os.listdir(os.path.join(SRC, 'gen')):
        im = Image.open(os.path.join(SRC, 'gen', f)).convert('RGB')
        im.thumbnail((1600, 1600), Image.LANCZOS)
        im.save(os.path.join(ASSETS, 'gen', f))


def shoot(html_path, png_path, w, h):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
                    '--allow-file-access-from-files', f'--window-size={w},{h}', '--virtual-time-budget=4000',
                    f'--screenshot={png_path}', 'file:///' + html_path.replace('\\', '/')],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=90)
    im = Image.open(png_path)
    assert im.size == (w, h), (png_path, im.size)


def main(only=None):
    assets()
    os.makedirs(OUT, exist_ok=True)
    for name, c in CONCEPTS.items():
        if only and only not in name: continue
        for size, (w, h, layout) in SIZES.items():
            html = os.path.join(SRC, f'{name}_{size}.html')
            open(html, 'w', encoding='utf-8').write(page(c, layout, 'square' if w == h else ''))
            png = os.path.join(OUT, f'hea26_{name}_{size}.png')
            shoot(html, png, w, h)
            # Ad platforms cap image size; JPEG at high quality keeps every file well under it.
            Image.open(png).convert('RGB').save(png[:-4] + '.jpg', quality=92, optimize=True)
            os.remove(png)
            print('ok', os.path.basename(png)[:-4] + '.jpg')
    for folder, cards in CAROUSELS.items():
        if only and only not in folder: continue
        os.makedirs(os.path.join(OUT, folder), exist_ok=True)
        for k, (name, c) in enumerate(cards, 1):
            html = os.path.join(SRC, f'{folder}_{k:02d}.html')
            open(html, 'w', encoding='utf-8').write(page(c, 'stack', 'square'))
            png = os.path.join(OUT, folder, f'{k:02d}_{name}.png')
            shoot(html, png, 1080, 1080)
            Image.open(png).convert('RGB').save(png[:-4] + '.jpg', quality=92, optimize=True)
            os.remove(png)
            print('ok', folder, os.path.basename(png)[:-4] + '.jpg')
    # One ad per brand and dealer, square and portrait, in images/brands/.
    if not only or only in 'brands':
        os.makedirs(os.path.join(OUT, 'brands'), exist_ok=True)
        cards = [(n, brand_card(i, n)) for i, n in ALL_BRANDS] + [(n, brand_card(i, n, 'Visit', 'Dealer at the show')) for i, n in DEALERS]
        for name, c in sorted(cards, key=lambda x: x[0].lower()):
            slug = name.lower().replace(' ', '-')
            for size, w, h in [('square-1080x1080', 1080, 1080), ('portrait-1080x1350', 1080, 1350)]:
                html = os.path.join(SRC, f'brand_{slug}_{size}.html')
                open(html, 'w', encoding='utf-8').write(page(c, 'stack', 'square' if w == h else ''))
                png = os.path.join(OUT, 'brands', f'hea26_brand_{slug}_{size}.png')
                shoot(html, png, w, h)
                Image.open(png).convert('RGB').save(png[:-4] + '.jpg', quality=92, optimize=True)
                os.remove(png)
            print('ok brand', slug)
    # Square logo for Google (Demand Gen and Performance Max ask for one).
    logo = os.path.join(SRC, 'logo.html')
    open(logo, 'w', encoding='utf-8').write('<!doctype html><meta charset="utf-8"><style>html,body{margin:0;height:100%;background:#000;display:grid;place-items:center}img{width:62%}</style><img src="assets/monogram.svg">')
    png = os.path.join(OUT, 'hea26_logo_1200x1200.png')
    shoot(logo, png, 1200, 1200)
    print('ok', os.path.basename(png))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
