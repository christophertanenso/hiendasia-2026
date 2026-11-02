# HiEnd Asia 2026

Bilingual (English / 简体中文) one-page site for the **2026 Singapore Hi-End Asia International Audio Visual Show**, 17–19 December 2026, Level 3, Suntec Singapore Convention & Exhibition Centre. Free entry.

Live: https://christophertanenso.github.io/hiendasia-2026/

Built on the HiEnd Asia 2026 design system (black ground, peach-gold headings, gold rules, bronze bands; Arimo, Open Sans, Noto Sans SC). Photos, logos, copy and the 2025 showcase video come from [hiendasia.com](https://www.hiendasia.com/).

## Files

| Path | What |
| --- | --- |
| `page.tpl.html` | Page template: styles, layout and section copy |
| `build.py` | Fills the template with speakers, artists, brand reps and logos, then writes the pages |
| `index.html` | Generated. The full page served by GitHub Pages |
| `artifact.html` | Generated. The same page as a fragment for the Claude artifact preview |
| `imgs.json` | Image list scraped from hiendasia.com (alt text = brand names) |
| `img/` | Poster, floorplan, venue, portraits and brand logos |
| `video/` | 2025 showcase video (480p) and its poster frame |

## Editing

Change copy or layout in `page.tpl.html`, or the people and brand lists in `build.py`, then rebuild:

```bash
python build.py
```

Commit both generated pages. GitHub Pages redeploys from `main` on every push.

## Hosted asset URLs

Every image and the video can be linked directly, for example:

- `https://christophertanenso.github.io/hiendasia-2026/img/000.jpg` (official poster)
- `https://christophertanenso.github.io/hiendasia-2026/video/showcase-2025.mp4`
