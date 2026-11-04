# HiEnd Asia 2026

One-page site, in eight languages, for the **2026 Singapore Hi-End Asia International Audio Visual Show**, 17–19 December 2026, Level 3, Suntec Singapore Convention & Exhibition Centre. Free entry.

Live: https://christophertanenso.github.io/hiendasia-2026/

Built on the HiEnd Asia 2026 design system (black ground, peach-gold headings, gold rules, bronze bands; Arimo, Open Sans, Noto Sans SC). Photos, logos, copy and the 2025 showcase video come from [hiendasia.com](https://www.hiendasia.com/).

## Files

| Path | What |
| --- | --- |
| `page.tpl.html` | Page template: styles, layout and section copy |
| `build.py` | Fills the template with speakers, artists, brand reps and logos, then writes the pages |
| `index.html` | Generated. The full page served by GitHub Pages |
| `artifact.html` | Generated. The same page as a fragment for the Claude artifact preview |
| `i18n/en.json` | All English copy, by key. The source for every translation |
| `i18n/<lang>.json` | Translations: `zh-Hans`, `zh-Hant`, `id`, `ms`, `fil`, `th`, `vi`. Same keys as `en.json` |
| `i18n/_seed-zh.json` | The client's original Simplified Chinese wording, kept for reference |
| `imgs.json` | Image list scraped from hiendasia.com (alt text = brand names) |
| `img/` | Poster, floorplan, venue, portraits and brand logos |
| `video/` | 2025 showcase video (480p) and its poster frame |
| `fonts/` | Arimo and Open Sans (woff2), served locally |
| `hiendasia-2026.ics` | Generated. Calendar file for Apple Calendar and other apps |

## Editing

Change copy or layout in `page.tpl.html`, or the people and brand lists in `build.py`, then rebuild:

```bash
python build.py
```

Commit both generated pages. GitHub Pages redeploys from `main` on every push.

## Languages

The page picks its language automatically from the visitor's browser and device language list: English, 简体中文, 繁體中文 (Taiwan, Hong Kong, Macau), Bahasa Indonesia, Bahasa Melayu, Filipino, ไทย and Tiếng Việt. Anything else falls back to English. Visitors can switch with the globe menu, and the choice is remembered. A link can force a language with `?lang=`, e.g. `?lang=th` or `?lang=zh-Hant`.

To change copy, edit `i18n/en.json` and the same key in each language file. To add a language, copy `en.json` to `i18n/<code>.json`, translate it, and add the code to `SUPPORTED`, `match()` and the `<select>` in `page.tpl.html`.

The translations were machine-drafted and should be checked by native speakers before launch.

## Tracking

`page.tpl.html` loads GA4 (`G-NED2Z7D1C5`, property 401777091) and the Meta Pixel (`982955510477872`) in the `<head>`. One helper, `trackIntent(action, detail)`, reports actions. A delegated click listener matches link hrefs, so every repeated link, and any added later, is covered. Every event carries `page_language`.

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
| `venue_checkin` | Page opened from a QR sign (`?here=`), once per device per day | `here`, `show_day` | `VenueCheckin` (custom) |

**On-site visitors.** A visit opened with `?here=` (QR signage) is on-site for the rest of the browser session. Its events carry `on_site=yes`, and the two bidding conversions (`add_to_calendar`, `get_directions`) are sent as `onsite_action` with `action=…` instead (Meta: `OnsiteAction`). People already at the show never count as ad conversions.

Nothing blocks navigation, and the page works if an ad blocker stops the tags. Query strings (UTMs, `?lang=`) are never stripped. Shared links are UTM-tagged so GA4 credits the visits they bring back: WhatsApp `utm_source=whatsapp`, WeChat `utm_source=wechat`, calendar entries `utm_source=calendar`. To track a new link type, add a pattern to `classify()`.

## Mainland China

Google services are blocked in mainland China, so the page avoids depending on them for anything essential:
- **Fonts.** Arimo and Open Sans are served from `fonts/` (Latin, Latin Extended and Vietnamese subsets). Chinese and Thai web fonts still come from Google Fonts, but load after first paint and fall back to system fonts (PingFang, Microsoft YaHei).
- **Calendar.** "Apple Calendar & others" downloads `hiendasia-2026.ics`, which `build.py` writes. It works with any calendar app.
- **WeChat.** Simplified Chinese visitors also get a "分享到微信" button with a QR code (`img/wechat-qr.svg`) and a copy-link button. To regenerate the QR: `pip install segno`, then `python -c "import segno; segno.make('<url>', error='m').save('img/wechat-qr.svg', scale=4, border=3)"`, then add `viewBox="0 0 204 204"` to the `<svg>` tag.
- GA4 and Meta don't load in mainland China, so visits from there aren't counted.

## Hosted asset URLs

Every image and the video can be linked directly, for example:

- `https://christophertanenso.github.io/hiendasia-2026/img/000.jpg` (official poster)
- `https://christophertanenso.github.io/hiendasia-2026/video/showcase-2025.mp4`
