# HiEnd Asia 2026 – room finder

The working copy of the Level 3 room finder for the site. It's mobile first: search and a room list come first, then a flat, upright map of Level 3 (not to scale, escalators and entrance at the bottom) that shows a walking route, plus a details panel with written directions. Room numbers follow the "2nd Contract Layout_plan 2" (27/8/2026). Positions are simplified from Suntec's Level 3 plan.

The live copy is in `../floormap/`. After changing files here, copy them there (see section 2).

## Files
| File | What |
|---|---|
| `floormap.js` | The finder. No libraries. Room positions are in `ROOMS`, wording and directions are in `STR` |
| `floormap.css` | Styles. Uses the site's `--bg`, `--heading`, `--accent` etc. tokens, with fallbacks |
| `rooms-template.csv` | Starter rows for the Google Sheet |
| `index.html` | Standalone demo page (`python3 -m http.server` in this folder, then open it) |

## 1. Set up the Google Sheet (one-off)
1. In Google Sheets, go to File → Import → upload `rooms-template.csv`.
2. Go to File → Share → **Publish to web**, choose the sheet tab, pick **Comma-separated values (.csv)**, then Publish.
3. Copy the link. It ends in `output=csv`. Paste it into `data-sheet=""` on `<div id="hea-map">` in `../page.tpl.html`, then run `python build.py`, commit and push.

Columns:
- `room`: 303–312, 323, 332–336, or `C23` (Concourse 2 & 3). Don't change these.
- `name`: optional title, e.g. "VIP room".
- `type`: `listening`, `vip`, `hall`, `stage` or `tbc`. The type sets the colour and legend entry.
- `exhibitor`, `brands`, `note`: free text. Search covers these.
- `show`: `no` hides that room.

After the link is in place, Sheet edits go live within about 5 minutes (Google's publish cache), with no rebuild needed.

## 2. Update the site
1. Copy `floormap.js` and `floormap.css` into `../floormap/`.
2. The finder is already placed in `../page.tpl.html`, in the `#floorplan` section, below the poster image.
3. Run `python build.py`, commit, and push. GitHub Pages updates within a minute or two.

## "You are here" (QR signage)
Add `?here=entrance` (info counter), `?here=esc-left`, `?here=esc-right`, or `?here=308` (any room) to the page link. The route and directions start from there. A room code also opens that room's details.

## Changing things
- **Room use or exhibitor**: edit the Sheet.
- **A new room, or a room that moved**: add or adjust `[x1, y1, x2, y2, door side]` in `ROOMS` (units are the map's 360 × 486 viewBox). For directions, add it to `ORDER` (doors counted from the front), then add it to the Sheet.
- **Wording, directions or translation**: edit `STR` at the top of `floormap.js`.
- **Look**: colours are CSS variables at the top of `floormap.css` (`--hm-room`, `--hm-vip`, `--hm-route` …).
- **Layout**: phones get one column (search, filters, map, list). The details panel sticks to the bottom of the screen. From 900px wide, the list is on the left and the map stays on screen on the right.
