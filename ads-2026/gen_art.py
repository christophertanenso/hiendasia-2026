"""Generates the illustrative background art for the ads through OpenRouter.

    python gen_art.py            # everything that is missing
    python gen_art.py turntable  # only names containing "turntable", overwriting

Reads OPENROUTER_API_KEY from ../env.txt. Prompts ask for pictures only: every word in an ad is set
by build_ads.py, never by the image model. Output goes to src/gen/<name>_<ratio>.png.
"""
import base64, json, os, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'src', 'gen')
MODEL = 'google/gemini-3-pro-image'

RULES = (' Photorealistic studio product photography, shallow depth of field, rich blacks, warm gold and amber light.'
         ' Generic unbranded equipment of original design. Absolutely no text, no letters, no numbers, no logos,'
         ' no watermarks, no people.')

ART = {
    'turntable': 'Dramatic close-up of a high-end turntable playing a black vinyl record: the tonearm and cartridge'
                 ' resting in the groove, brushed gold and black metal, a single warm key light raking across the'
                 ' record so the grooves glow gold, deep black background with faint golden dust motes.',
    'speakers': 'A pair of tall luxury floorstanding loudspeakers in dark walnut and black with gold-rimmed drivers,'
                ' standing either side of a low rack with glowing vacuum tube amplifiers, in a dark listening room.'
                ' Warm amber tube glow, soft gold rim light on the cabinets, black background, cinematic.',
    'jackpot': 'A jackpot moment: an open matte black gift box with a gold satin ribbon, exploding upward with a huge burst of'
               ' gold confetti, glitter, metallic streamers and sparkling firework stars, bright golden spotlight rays'
               ' fanning out behind it, glossy black stage floor with reflections, black background. Loud, celebratory,'
               ' high energy, lots of gold.',
    'giftbox': 'A single luxurious matte black gift box tied with a wide gold satin ribbon, its lid lifting slightly'
               ' with brilliant golden light and fine gold sparkles bursting out from inside, on a glossy black'
               ' reflective surface, black background, gold bokeh. Mysterious and festive.',
}
# Where the subject sits, so the type has clear dark space.
FRAMING = {
    '4:5': ' Vertical composition: the subject fills the upper two thirds, the lower third fades to plain near-black.',
    '9:16': ' Tall vertical composition: the subject sits in the middle of the frame, the top fifth and the bottom'
            ' third are plain near-black.',
    '16:9': ' Wide composition: the subject sits in the right half, the left half fades to plain near-black.',
}


def key():
    for line in open(os.path.join(HERE, '..', 'env.txt'), encoding='utf-8'):
        if line.startswith('OPENROUTER_API_KEY='):
            return line.split('=', 1)[1].strip()
    raise SystemExit('OPENROUTER_API_KEY not found in env.txt')


def generate(prompt, ratio):
    body = json.dumps({'model': MODEL, 'modalities': ['image', 'text'],
                       'image_config': {'aspect_ratio': ratio, 'image_size': '2K'},
                       'messages': [{'role': 'user', 'content': prompt}]}).encode()
    req = urllib.request.Request('https://openrouter.ai/api/v1/chat/completions', data=body,
                                 headers={'Authorization': 'Bearer ' + key(), 'Content-Type': 'application/json'})
    msg = json.load(urllib.request.urlopen(req, timeout=300))['choices'][0]['message']
    url = msg['images'][0]['image_url']['url']
    return base64.b64decode(url.split(',', 1)[1])


def main(only=None):
    os.makedirs(OUT, exist_ok=True)
    for name, prompt in ART.items():
        for ratio, framing in FRAMING.items():
            path = os.path.join(OUT, f'{name}_{ratio.replace(":", "x")}.png')
            if (only and only not in name) or (not only and os.path.exists(path)):
                continue
            open(path, 'wb').write(generate(prompt + framing + RULES, ratio))
            print('ok', os.path.basename(path))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else None)
