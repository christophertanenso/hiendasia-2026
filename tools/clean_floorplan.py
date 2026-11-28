# Restyles the organiser's floor plan (Layout/floorplan-2026-source.png) in the HiEnd Asia 2026 brand
# with an image model on OpenRouter, then writes img/floorplan-2026.png and img/floorplan-2026.webp.
#
#   OPENROUTER_API_KEY=... python tools/clean_floorplan.py [--model google/gemini-2.5-flash-image]
#
# Image models can misspell small text, so always check every room number and name in the result
# against the source before committing it. Re-run (or try another model) until it is right.
import argparse, base64, io, json, os, sys, urllib.error, urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(HERE, 'Layout', 'floorplan-2026-source.png')
OUT = os.path.join(HERE, 'img', 'floorplan-2026')

PROMPT = """Redraw this exhibition floor plan as a clean, flat, professional vector-style map in this brand style:
- Background solid black (#000000). Venue walls and non-show areas dark bronze-grey (#201d17) with thin gold outlines (#4f4632).
- Listening/meeting rooms: filled champagne gold (#c6a661) with black text. Art spaces: muted bronze (#8a6d3b).
  Headphone & accessory area: pale champagne (#f0d9a0). Shell schemes and sound rooms along the concourses: outlined in gold (#c6a661), no fill.
- All other text (Nicoll 1-3, Concourse 1-3, Freight Elevators, Suite, legend) in champagne gold (#f0d9a0), clean sans-serif like Arimo.
- Keep EXACTLY the same layout, proportions, room positions, toilets, lifts, escalators and compass.
- Keep EXACTLY these labels, spelled exactly: 332 Aries Cerat; 333; 334 Prodigio; 335 San Yuan; 336 AMR; Suite;
  307 Hi End Research; 306; 305 AOPT; 304; 303 Audio Line; 302; 301; 300; 312; 323; NICOLL 1; NICOLL 2; NICOLL 3;
  CONCOURSE 1; CONCOURSE 2; CONCOURSE 3; Freight Elevators.
- Rebuild the legend on the right with the new colours: Meeting room, Art space 4m x 6m, Headphone & accessory,
  Shell scheme 3.5m x 3m, Sound room 5m x 7m. Drop "IBM table" and "NICOLL CORNER SCREEN".
- No added text, no logos, no watermark, no perspective, no shadows. Landscape, same aspect ratio as the input."""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', default='google/gemini-2.5-flash-image')
    args = ap.parse_args()
    key = os.environ.get('OPENROUTER_API_KEY')
    if not key:
        sys.exit('Set OPENROUTER_API_KEY first.')
    src = base64.b64encode(open(SRC, 'rb').read()).decode()
    body = {'model': args.model, 'modalities': ['image', 'text'],
            'messages': [{'role': 'user', 'content': [
                {'type': 'text', 'text': PROMPT},
                {'type': 'image_url', 'image_url': {'url': 'data:image/png;base64,' + src}}]}]}
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions', json.dumps(body).encode(),
                                 {'Authorization': 'Bearer ' + key, 'Content-Type': 'application/json',
                                  'HTTP-Referer': 'https://www.hiendasia.com/',
                                  'X-Title': 'HiEnd Asia 2026 floor plan'})
    try:
        res = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as err:
        sys.exit('OpenRouter HTTP %s: %s' % (err.code, err.read().decode()[:1500]))
    if 'choices' not in res:
        sys.exit('Unexpected response: ' + json.dumps(res)[:1500])
    msg = res['choices'][0]['message']
    imgs = msg.get('images') or []
    if not imgs:
        sys.exit('No image returned: ' + json.dumps(msg)[:500])
    data = base64.b64decode(imgs[0]['image_url']['url'].split(',', 1)[1])
    from PIL import Image
    im = Image.open(io.BytesIO(data)).convert('RGB')
    im.save(OUT + '.png', optimize=True)
    im.save(OUT + '.webp', quality=88, method=6)
    print('Wrote %s.png and .webp (%dx%d). Check every label against the source before committing.' % (OUT, *im.size))


if __name__ == '__main__':
    main()
