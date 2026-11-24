# Diffs the web's live glass (shoot.ts, <dir>/web) against the simulator's (capture.sh, <dir>/ref)
# over the button and the 12 pt around it, and writes <dir>/diff.png: per scene, iOS, web, and
# the difference x8 around grey. Usage, from tools/glass-live:
#   uv run --with pillow --with numpy python diff.py <dir> [scene ...]
import json, os, sys
import numpy as np
from PIL import Image

DIR = sys.argv[1]
HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = json.load(open(f'{HERE}/Scenes/scenes.json'))
names = sys.argv[2:] or [s['name'] for s in SCENES['scenes'] if 'motion' not in s]
button = SCENES['scenes'][0]['button']
half = button['size'] / 2 + 12
cx, cy = button['x'] + button['size'] / 2, button['y'] + button['size'] / 2
x0, y0, n = round((cx - half) * 3), round((cy - half) * 3), round(2 * half * 3)
yy, xx = np.mgrid[0:n, 0:n]
d = button['size'] / 2 - np.hypot((xx + 0.5) / 3 - half, (yy + 0.5) / 3 - half)
regions = {'body': d > 10, 'rim': (d > 0) & (d <= 10), 'shadow': (d <= 0) & (d > -12)}

rows, totals = [], []
for name in names:
    web_path = f'{DIR}/web/{name}-bare.png'
    if not os.path.exists(web_path):
        continue
    ref = np.asarray(Image.open(f'{DIR}/ref/{name}-bare.png').convert('RGB')).astype(float)
    web = np.asarray(Image.open(web_path).convert('RGB')).astype(float)
    r, w = ref[y0 : y0 + n, x0 : x0 + n], web[y0 : y0 + n, x0 : x0 + n]
    err = np.abs(w - r).mean(2)
    parts = {k: err[m].mean() for k, m in regions.items()}
    total = err[d > -12].mean()
    totals.append(total)
    print(f'{name:16s} all {total:5.2f} | ' + ' | '.join(f'{k} {v:5.2f}' for k, v in parts.items()))
    rows.append(np.concatenate([r, w, np.clip(128 + (w - r) * 8, 0, 255)], 1))
if totals:
    print(f'mean {np.mean(totals):.2f}')
    Image.fromarray(np.concatenate(rows, 0).astype(np.uint8)).save(f'{DIR}/diff.png')
