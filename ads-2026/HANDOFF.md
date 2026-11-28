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
| HEA26 \| M1 Registrations \| Prospecting | `120251407043460261` | `120251407045050261` | S$540 | 30 Nov – 16 Dec | A, B, F, G, H, I, J, Carousel 1 |
| HEA26 \| M2 Video awareness | `120251407043670261` | `120251407045230261` | S$180 | 30 Nov – 14 Dec | 2025 showcase video |
| HEA26 \| M3 Registrations \| Retargeting | `120251407043860261` | three, below | S$150 (campaign budget) | 1 – 16 Dec | R1, R2, R3 |
| HEA26 \| M4 Show days \| Reach | `120251407044080261` | `120251407045410261` | S$130 | 16 Dec 6pm – 19 Dec 5pm | E |

Since 28 Nov every draft ad holds its creative inline (written through `ads_update_entity`), not a reference to a saved creative. Each one has the same images and text as its "HEA26 v2 | …" creative (E: the original "HEA26 | E Open now"), links to `https://www.hiendasia.com/…`, and has the WhatsApp browser add-on switched on (`asset_feed_spec.message_extensions: [{"type":"whatsapp"}]`). The saved creatives in the library, including two "HEA26 v3 …" tests, are now unused.

WhatsApp: +65 8668 1927 (Michelle) is linked to the Page as its primary number. Two things to know before touching this again:

- `ads_create_creative` accepts `message_extensions` but silently drops it. Only the inline creative on the draft ad keeps it.
- Switching the add-on on by hand in Ads Manager rewrites the creative: it drops the story image, adds Meta's generated text options and raises error 1815589 ("link title and description … deprecated"). If that happens, re-send the inline creative.

Checked in Ads Manager on A, Carousel 1 and E: WhatsApp add-on selected, number shown, no errors. The M2 video ad was accepted without errors, but its editor does not show the add-on options, so the button may not appear on that ad.

The ad images Meta imported are hosted at `https://www.hiendasia.com/ads/v2/`.

### M3 retargeting sequence

Meta does not allow per-ad dates in this campaign (error 3858139), so M3 is three ad sets with back-to-back dates under the one S$150 campaign budget. Only the text differs from the prospecting ads; copy is in `campaign-drafts.md` under M3.

| Ad set | ID | Dates | Ads |
| --- | --- | --- | --- |
| R1 Lucky draw nudge | `120251409155330261` | 1 – 5 Dec | A `120251409156940261` |
| R2 Still deciding | `120251407045550261` | 6 – 11 Dec | C `120251407640290261`, D `120251407640460261`, Carousel 2 `120251407640640261` |
| R3 Countdown | `120251409155480261` | 12 – 16 Dec | B `120251409157070261`, D `120251409157230261` |

The R2 ad set also holds the old A ad (`120251407639440261`), paused and renamed "OLD A copy, not used (can delete)". It could not be moved to R1.

The copy says "still deciding", never "you visited": Meta rejects ads that imply knowing what someone did. All three ad sets still have no custom audience; add the same include/exclude audiences to each once the terms are accepted.

## Ads I and J

Added 28 Nov from the image catalogue; both are draft ads in M1.

- **I · Hi-fi and art** (`hea26_I-art_*`): the NOWASIA fair aisle, catalogue photo 007, which is cleared for ads as it stands.
- **J · Listening rooms come alive** (`hea26_J-live_*`): the HiEnd Asia room at the NOWASIA Art Fair in August 2026, catalogue photo 136. It shows recognisable guests and performers, so their consent is needed before it runs as a paid ad.

Open question: a poster on now-asia.org announces a HiEnd Asia 2026 limited-edition 1:1 MQD disc, 50 copies. If it is real for December it belongs in the albums ad.

## Google: what exists

Account HIEND ASIA + PTE. LTD., 545-469-1642. The API connection is read-only (set the manager account to 5454691642 first), so everything below was built in the Google Ads web UI on 28 Nov 2026. G1 and G2 were enabled by the owner on 28 Nov; G3 was enabled on the owner's request later that day.

- **Conversions:** `sign_up` is a GA4 key event (property hiendasia.com, 401777091) and is imported as "hiendasia.com (web) sign_up", the only primary conversion. "Page view (1)" and "OUTBOUND_CLICK" are secondary.
- **G1 Search** `24564952055`: "HEA26 | G1 Search | Registrations". Search network only, Singapore, S$140 campaign total, 28 Nov – 19 Dec, maximise clicks with a S$0.60 cap, AI Max off. One ad group, 19 brand and show keywords (phrase and exact; four added 28 Nov from Search Console: "hi end show 2026", "audio exhibition 2026", "av show singapore", "stereonet"; Google marks the first three low search volume, so they only run if searches pick up), 14 campaign negatives, one responsive search ad (approved), 4 sitelinks, 6 callouts. The "What's on" ad group for 14 – 19 Dec was not built.
- **G2 Demand Gen** `24560160477`: "HEA26 | G2 Demand Gen | Registrations". Sign-ups goal, maximise conversions, S$360 campaign total (S$290 plus G3's S$70), 28 Nov – 16 Dec. One ad group "Hi-fi, audio and art" (Singapore, Display Network off, optimised targeting on) with audience "HEA26 hi-fi, audio and art": a custom segment of 8 hi-fi search terms, a second custom segment "HEA26 StereoNET readers" (people who browse sites like stereonet.com; added 28 Nov, its "stereonet" search term was not approved but the website part counts), plus Audiophiles, Music Lovers, Classical Music Enthusiasts, Audio, Audio Equipment, Art & Theater Aficionados, Concert & Music Festival Tickets, Performing Arts Tickets. One image ad with B, C and D in three sizes and the logo mark (`images/hea26_logo-mark_square-1200x1200.png`); A is left out because the campaign runs past 5 Dec. Animated images and auto-generated videos are off. Google called S$290 low for this goal and suggested S$490.
- **G3 Remarketing** `24571672258`: "HEA26 | G3 Remarketing | Registrations", built and paused on the owner's request. Demand Gen, Sign-ups goal, S$70 campaign total, 9 – 18 Dec (Google's minimum is about S$7 a day, so the full 1 – 18 Dec run would have needed S$126). Ad group "Site visitors", Singapore, optimised targeting off, audience "HEA26 site visitors" built only on GA4 "All Users of hiendasia.com". Google marks that list not eligible: it sees 0 reachable people although GA4 counts 505, most likely because visitors decline ad personalisation. One image ad with B, C, D and the logo, "still deciding" headlines, button Sign up. It will not serve unless the list reaches Google's minimum. Its S$70 is on top of G2's S$360, so if it ever spends, Google's total goes to S$570.

## Blocked on the account owner

1. **Verified advertiser for Singapore.** Done 28 Nov: identity `2131198877405316` is set as beneficiary and payer on all four ad sets.
2. **Audiences (28 Nov).** Customer list terms accepted; "HEA26 Past show-goers 2024–2025" (`120251413360130261`, about 1,000) uploaded hashed from the 2024–2025 Wix RSVPs. Created "HEA26 Facebook Page engagers 365 days" (`120251413510960261`), "HEA26 Instagram engagers 365 days" (`120251413511480261`) and "HEA26 Lookalike 1% past show-goers" (`120251413511560261`). R1–R3 now target past show-goers + both engager lists with Advantage+ audience off; M1 has the lookalike and past show-goers as audience suggestions. Website visitor and registered-exclusion audiences still need the website custom audience terms at https://www.facebook.com/customaudiences/app/tos/?act=1747104616175118, then add visitors to R1–R3 and exclude registered everywhere. Google: G3's audience now also has the "HEA26 Past show-goers 2024-2025" customer list (raw upload, about 790 rows; needs 1,000 matched to serve) and "Google-engaged audiences" (630K); G3 was enabled on 28 Nov and runs 9 – 18 Dec at S$70, so Google's total is now S$570. Old note: accept terms at https://www.facebook.com/customaudiences/app/tos/?act=1747104616175118, then create "website visitors 30 days" and "registered 30 days" audiences and attach them to all three M3 ad sets (include the first, exclude the second). Until then M3 reaches everyone in Singapore. The pixel is collecting (about 80–130 page views a day in late November).
3. **Publish** when ready to spend. M1 and M2 are scheduled from 30 Nov.

## Still to do

- Switch off ad A (lucky draw) in M1 after 5 December. In M3 the R1 ad set ends on 5 Dec by itself.
- In Ads Manager, turn off reordering of carousel cards by performance on both carousels.
- Decide on Meta's AI disclosure for ad A; its background is AI-generated. Not required for ads shown in Singapore.
- Targeting is broad everywhere (Singapore, 25–65 as a suggestion, Advantage+ audience on). Interest ad sets were considered on 28 Nov and dropped: M1 is an Advantage+ leads campaign, which has no interest targeting, and splitting S$540 three ways would slow learning.
- Google: no GDN or Performance Max (too little budget and conversion data).
- Site: the albums section still lists only the 2024 and 2025 recordings; the ads say the 2023 CD is on sale too.
- Site: `www.hiendasia.com` (Wix) has no link to the registration page.
- GA4 property "hiendasia.com": mark `sign_up` as a key event. Apps Script: redeploy so the confirmation email no longer mentions prizes.
- Unconfirmed: Richard H. Mak's sessions, approval of the keynote portraits, when Billy Ho plays, a 2025 attendance figure.
- Weak logo files: Clearaudio, Aries Cerat, MU6, Graham Audio, Graham Engineering, Audio Desk, Ensemble.
