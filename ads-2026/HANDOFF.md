# HiEnd Asia 2026 ads: where things stand

Written 28 Nov 2026 so the work can continue on another machine. Show: 17–19 Dec 2026, Level 3, Suntec Singapore. Lucky draw registration closes 5 Dec.

## What is in this folder

| File | What it is |
| --- | --- |
| `images/` | Finished ads: ten concepts (A–J) in four sizes, two carousels, one ad per brand in `images/brands/` |
| `campaign-drafts.md` | Campaign structure, budget split, all Meta and Google ad text. Written by `build_copy.py` |
| `build_ads.py` | Renders every image. Needs Python with Pillow, Google Chrome and ffmpeg |
| `build_copy.py` | Holds the ad text and checks it against platform limits |
| `gen_art.py` | Generates the lucky draw background through OpenRouter. Needs `OPENROUTER_API_KEY` in `env.txt` in the folder above; the key is not in this repository |
| `src/gen/`, `src/photos/` | Inputs the build cannot recreate from the site: the generated background and the listening-room crop |
| `preview-*.jpg` | Contact sheets of the current set |

To rebuild: `python build_copy.py`, then `python build_ads.py` (or `python build_ads.py brands` for one group).

## Decisions made

- Selling points, in order: the exhibition, the brands coming, the HiEnd Asia albums. Lucky draw, keynotes and EB Duet's Billy Ho support them.
- Audience is mostly 45 and older: large type, one headline, one short line.
- Call to action on every registration ad: "Tap to get your free ticket". Meta button: Get Offer.
- Never say what the lucky draw prizes are. Never say "150+" brands.
- Brand wall shows the six most searched exhibiting brands (Ahrefs, 28 Nov 2026): Audio-Technica, Accuphase, Wilson Audio, Pass Labs, Clearaudio, TAD.
- Billy Ho is billed as "EB Duet's Billy Ho"; he plays solo, so the wording does not say the duo performs.
- Meta budget: S$1,000 in total.

## Meta: what exists

Ad account "HiEnd Asia AdAccount" `1747104616175118`. Page "Hi-End Asia Singapore" `122095667624018263`. Instagram `hiendasia.sg` `17841461352412619`. Pixel "HiEnd Asia Website" `9829555510477872`.

Everything below is an unpublished Ads Manager draft. Publishing a draft makes it active, not paused.

| Campaign | Campaign ID | Ad set ID | Lifetime budget | Runs | Draft ads |
| --- | --- | --- | --- | --- | --- |
| HEA26 \| M1 Registrations \| Prospecting | `120251407043460261` | `120251407045050261` | S$540 | 30 Nov – 16 Dec | A, B, F, G, H, Carousel 1 |
| HEA26 \| M2 Video awareness | `120251407043670261` | `120251407045230261` | S$180 | 30 Nov – 14 Dec | 2025 showcase video |
| HEA26 \| M3 Registrations \| Retargeting | `120251407043860261` | `120251407045550261` | S$150 | 1 – 16 Dec | A, C, D, Carousel 2 |
| HEA26 \| M4 Show days \| Reach | `120251407044080261` | `120251407045410261` | S$130 | 16 Dec 6pm – 19 Dec 5pm | E |

The ads use the creatives named "HEA26 v2 | …". The creatives named "HEA26 | …" without "v2" are the earlier versions and are unused, except "HEA26 | E Open now", which M4 still uses.

The ad images Meta imported are hosted at `https://christophertanenso.github.io/hiendasia-2026/ads/v2/`.

## Built but not yet in Meta

Two more ads, added 28 Nov from the image catalogue. Their images are in `images/` and their text is in `campaign-drafts.md`, but they are not hosted on the site and have no creative or draft ad in Meta yet.

- **I · Hi-fi and art** (`hea26_I-art_*`): the NOWASIA fair aisle, catalogue photo 007, which is cleared for ads as it stands.
- **J · Listening rooms come alive** (`hea26_J-live_*`): the HiEnd Asia room at the NOWASIA Art Fair in August 2026, catalogue photo 136. It shows recognisable guests and performers, so their consent is needed before it runs as a paid ad.

Open question: a poster on now-asia.org announces a HiEnd Asia 2026 limited-edition 1:1 MQD disc, 50 copies. If it is real for December it belongs in the albums ad.

## Blocked on the account owner

1. **Verified advertiser for Singapore.** Every draft ad carries "No advertiser information for Singapore Ads". Add a verified advertiser (beneficiary and payer) to each ad set in Ads Manager: https://www.facebook.com/business/help/983527276402621
2. **Custom audience terms.** Accept them at https://www.facebook.com/customaudiences/app/tos/?act=1747104616175118, then create "website visitors 30 days" and "registered 30 days" audiences and attach them to M3 (include the first, exclude the second). Until then M3 is a plain Singapore ad set.
3. **Publish** when ready to spend. M1 and M2 are scheduled from 30 Nov.

## Still to do

- Switch off ad A (lucky draw) in M1 and M3 after 5 December.
- In Ads Manager, turn off reordering of carousel cards by performance on both carousels.
- Decide on Meta's AI disclosure for ad A; its background is AI-generated. Not required for ads shown in Singapore.
- Interest ad sets (hi-fi, art) were not built; only one broad ad set exists per campaign.
- Google campaigns exist only as text in `campaign-drafts.md`; no HiEnd Asia Google Ads account was reachable.
- Site: the albums section still lists only the 2024 and 2025 recordings; the ads say the 2023 CD is on sale too.
- Site: `www.hiendasia.com` (Wix) has no link to the registration page.
- GA4 property "hiendasia.com": mark `sign_up` as a key event. Apps Script: redeploy so the confirmation email no longer mentions prizes.
- Unconfirmed: Richard H. Mak's sessions, approval of the keynote portraits, when Billy Ho plays, a 2025 attendance figure.
- Weak logo files: Clearaudio, Aries Cerat, MU6, Graham Audio, Graham Engineering, Audio Desk, Ensemble.
