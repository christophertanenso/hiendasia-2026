# HiEnd Asia 2026

One-page site, in eight languages, for the **2026 Singapore Hi-End Asia International Audio Visual Show**, 17–19 December 2026, Level 3, Suntec Singapore Convention & Exhibition Centre. Free entry.

Live: https://christophertanenso.github.io/hiendasia-2026/

Built on the HiEnd Asia 2026 design system (black ground, champagne-gold headings sampled from the poster (`#f0d9a0`), gold rules, bronze bands; Arimo, Open Sans, Noto Sans SC). Photos, logos, copy and the 2025 showcase video come from [hiendasia.com](https://www.hiendasia.com/).

## Files

| Path | What |
| --- | --- |
| `page.tpl.html` | Page template: styles, layout and section copy |
| `build.py` | Fills the template with speakers, artists, brand reps and logos, then writes the pages |
| `consent.js` | Cookie banner and consent logic. `build.py` inlines it into every page |
| `index.html` | Generated. The English page, and the landing page that forwards visitors to their language |
| `<lang>/index.html` | Generated. One page per language, with its text in the HTML |
| `privacy.html` | Generated. Privacy notice and cookie table (PDPA) |
| `artifact.html` | Generated. The same page as a fragment for the Claude artifact preview |
| `i18n/en.json` | All English copy, by key. The source for every translation |
| `i18n/<lang>.json` | Translations: `zh-Hans`, `zh-Hant`, `id`, `ms`, `fil`, `th`, `vi`. Same keys as `en.json` |
| `i18n/_seed-zh.json` | The client's original Simplified Chinese wording, kept for reference |
| `imgs.json` | Image list scraped from hiendasia.com (alt text = brand names) |
| `img/` | Poster, floorplan, venue, portraits and brand logos. `000-*.webp`, `007-760.webp`, `007/008/009.webp` are compressed copies; `og-2026.jpg` is the 1200×630 share image |
| `video/` | 2025 showcase video (480p) and its poster frame |
| `fonts/` | Arimo and Open Sans (woff2), served locally |
| `signage/` | Venue QR signs (PDF, print page, SVGs) |
| `hiendasia-2026.ics` | Generated. Calendar file for Apple Calendar and other apps |

## Editing

Change copy or layout in `page.tpl.html`, or the people and brand lists in `build.py`, then rebuild:

```bash
python build.py
```

Commit all generated pages (`index.html`, the language folders, `privacy.html`, `artifact.html`). GitHub Pages redeploys from `main` on every push.

## Languages

Each language is its own pre-rendered page: `/` (English), `/zh-Hans/`, `/zh-Hant/`, `/id/`, `/ms/`, `/fil/`, `/th/`, `/vi/`. The text is in the HTML, so nothing is hidden while a translation loads, and the pages carry `hreflang` links so search engines index every language.

The English page forwards a visitor to their own language before it paints, from their browser and device language list (繁體中文 for Taiwan, Hong Kong and Macau). Anything unsupported stays in English. Visitors can switch with the globe menu, and the choice is remembered. A language URL opened directly is always respected. A link can force a language with `?lang=`, e.g. `?lang=th` or `?lang=zh-Hant`.

To change copy, edit `i18n/en.json` and the same key in each language file, then rebuild. A key missing from a language falls back to English. To add a language, copy `en.json` to `i18n/<code>.json`, translate it, and add the code to `LANGS`, `LANG_NAMES` and `OG_LOCALE` in `build.py` and to `SUPPORTED` and `match()` in `page.tpl.html`.

The translations were machine-drafted and should be checked by native speakers before launch.

## Tracking

GA4 (`G-NED2Z7D1C5`, property 401777091, which also feeds Google Ads) and the Meta Pixel (`9829555510477872`) sit behind a cookie banner (`consent.js`).

**Consent (PDPA).** Google Consent Mode v2 starts with everything denied. Neither vendor script is downloaded until the visitor accepts: *Analytics* loads GA4, *Marketing* also grants Google Ads storage and loads the Meta Pixel. They load only after the page has finished loading, so tracking never slows the first paint. The choice is stored in `localStorage` (`hea-consent`, with a version and date). "Cookie settings" in the footer and on `privacy.html` reopens it, and withdrawing removes the `_ga`, `_gcl` and `_fbp` cookies. Events raised before consent wait in `dataLayer` and are sent if analytics is accepted later in the visit. Meta events before marketing consent are dropped. Raising `VERSION` in `consent.js` asks everyone again, which is needed if the notice changes what people agree to. This is Consent Mode *basic*: visitors who don't accept send nothing, so GA4 and Ads won't model them. Switching to *advanced* (cookieless pings without consent) is a legal call for the client, not a code one.

The privacy notice is in `build.py` (English only). Its data-protection contact is `michelle@hiendasia.com` (`DPO_EMAIL`). Set GA4 data retention to 14 months (Admin → Data collection → Data retention) to match what the notice says.

One helper, `trackIntent(action, detail)`, reports actions. One helper, `trackIntent(action, detail)`, reports actions. A delegated click listener matches link hrefs, so every repeated link, and any added later, is covered. Every event carries `page_language`.

| GA4 event | When | Params | Meta |
| --- | --- | --- | --- |
| `add_to_calendar` | Google, Outlook.com, Office 365 or `.ics` link | `calendar` | `Schedule` |
| `get_directions` | Google/Apple Maps link | | `FindLocation` |
| `share` | WhatsApp, WeChat panel opened, or WeChat "copy link" | `method` = `whatsapp` / `wechat` / `copy_link` | `Share` (custom) |
| `contact` | Footer phone or email tapped | `method` = `phone` / `email` | `Contact` |
| `search` | Room finder search, after a 1.5 s pause | `search_term`, `results` | `Search` |
| `find_room` | Room picked in the finder | `room`, `search_term`, `from` | |
| `video_start` / `video_progress` / `video_complete` | Showcase video, at 25 / 50 / 75 / 100 % | `video_title`, `video_percent` | |
| `view_brand_list` | "Show all brands" opened (once per page view) | | |
| `section_view` | Programme, floorplan, speakers, concerts, brands or visit in view for 1 s (once each) | `section` | |
| `select_language` | Language menu changed | `language` | |
| `consent_choice` | Cookie banner answered (sent only if analytics was allowed) | `analytics`, `marketing` | |
| `venue_checkin` | Page opened from a QR sign (`?here=`), once per device per day | `here`, `show_day` | `VenueCheckin` (custom) |

**On-site visitors.** A visit opened with `?here=` (QR signage) is on-site for the rest of the browser session. Its events carry `on_site=yes`, and the two bidding conversions (`add_to_calendar`, `get_directions`) are sent as `onsite_action` with `action=…` instead (Meta: `OnsiteAction`). People already at the show never count as ad conversions.

**Testing locally.** On `localhost`, `127.0.0.1`, `*.localhost` and `*.test`, GA4 hits are sent with `debug_mode`, so they show in GA4 DebugView, and the GA4 "Developer traffic" data filter keeps them out of reports. The Meta Pixel doesn't load. Add `?track=live` to a local URL to send real hits.

Nothing blocks navigation, and the page works if an ad blocker stops the tags. Query strings (UTMs, `?lang=`) are never stripped. Shared links are UTM-tagged so GA4 credits the visits they bring back: WhatsApp `utm_source=whatsapp`, WeChat `utm_source=wechat`, calendar entries `utm_source=calendar`. To track a new link type, add a pattern to `classify()`.

## Venue QR signs

`signage/` holds the "You are here" QR codes for the show floor:
- `signage/venue-qr-signs.pdf`: print-ready, A4, 4 signs per page.
- `signage/index.html`: the same sheet as a web page.
- `signage/qr/*.svg`: one QR code per sign, for larger prints.

There are 20 signs: the entrance and info counter, both escalators, Concourse 2 & 3, and rooms 303–312, 323 and 332–336. Each code opens `?here=<spot>&utm_source=qr&utm_medium=signage&utm_campaign=venue`. The room finder starts its route there, and GA4 logs a `venue_checkin`, which is the show's only attendance signal, so put the signs where people will scan them.

## Mainland China

Google services are blocked in mainland China, so the page avoids depending on them for anything essential:
- **Fonts.** Arimo and Open Sans are served from `fonts/` (Latin, Latin Extended and Vietnamese subsets). Chinese and Thai web fonts still come from Google Fonts, but load after first paint and fall back to system fonts (PingFang, Microsoft YaHei).
- **Calendar.** "Apple Calendar & others" downloads `hiendasia-2026.ics`, which `build.py` writes. It works with any calendar app.
- **WeChat.** Simplified Chinese visitors also get a "分享到微信" button with a QR code (`img/wechat-qr.svg`) and a copy-link button. To regenerate the QR: `pip install segno`, then `python -c "import segno; segno.make('<url>', error='m').save('img/wechat-qr.svg', scale=4, border=3)"`, then add `viewBox="0 0 204 204"` to the `<svg>` tag.
- GA4 and Meta don't load in mainland China, so visits from there aren't counted.

## Hosted asset URLs

Every image and the video can be linked directly, for example:

- `https://christophertanenso.github.io/hiendasia-2026/img/000.jpg` (official poster)
- `https://christophertanenso.github.io/hiendasia-2026/img/og-2026.jpg` (1200×630 share image)
- `https://christophertanenso.github.io/hiendasia-2026/video/showcase-2025.mp4`
