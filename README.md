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

`page.tpl.html` loads GA4 (`G-NED2Z7D1C5`, property 401777091) and the Meta Pixel (`982955510477872`) in the `<head>`. One helper, `trackIntent(action, detail)`, reports intent clicks. A delegated click listener matches link hrefs, so every repeated link, and any added later, is covered:

| Link | GA4 | Meta |
| --- | --- | --- |
| Google, Outlook.com, Office 365 calendar (and any `.ics`) | `add_to_calendar` with `calendar` | `Schedule` |
| WhatsApp (`wa.me`) | `share` with `method=whatsapp` | `Share` (custom) |
| Google/Apple Maps | `get_directions` | none |

Every event carries `page_language`. Nothing blocks navigation, and the page works if an ad blocker stops the tags. Query strings (UTMs, `?lang=`) are never stripped. To track a new link type, add a host pattern to `classify()`.

## Hosted asset URLs

Every image and the video can be linked directly, for example:

- `https://christophertanenso.github.io/hiendasia-2026/img/000.jpg` (official poster)
- `https://christophertanenso.github.io/hiendasia-2026/video/showcase-2025.mp4`
