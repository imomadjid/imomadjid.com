# The live-glass fixture in motion: compares the simulator's glass over a scrolling motion scene
# (record.sh) with the web's at the same scroll offsets (motion.ts). Usage, from tools/glass-live:
#   uv run --with pillow --with numpy python motion.py offsets <dir> <scene>
#     reads <dir>/ios/<scene>/NNNN.png, finds each frame's scroll offset from the content away
#     from the glass, and writes <dir>/ios/<scene>.json
#   uv run --with pillow --with numpy python motion.py diff <dir> <scene>
#     diffs each frame's glass against <dir>/web/<scene>/NNNN.png (motion.ts renders them) and
#     writes <dir>/<scene>-diff.png: iOS, web and the difference x8, a row per sampled frame.
#   uv run --with pillow --with numpy python motion.py video <dir> <scene>
#     writes <dir>/<scene>.mp4: iOS left, web right, 120 pt around the glass at 3x, at the
#     recording's own timing
#   uv run --with pillow --with numpy --with scipy python motion.py lag <dir> <scene> <how>
#     reads lag.ts's screencast, <dir>/lag/<scene>-<how>/NNNN.png, and per frame finds the content's
#     offset (away from the glass) and the offset the glass shows (its flat middle, matched
#     against the frosted strip): how far the glass trails the page it refracts.
# The videos are lossy H.264, so every error comes with the same measure over a patch of plain
# content away from the glass: the floor that compression and resampling alone reach.
import json, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = json.load(open(f'{HERE}/Scenes/scenes.json'))
SCALE = 3
W, H = SCENES['width'], SCENES['height']
mode, DIR, NAME = sys.argv[1:4]
HOW = sys.argv[4] if len(sys.argv) > 4 else None
scene = next(s for s in SCENES['scenes'] if s['name'] == NAME)
button = scene['button']
frames_dir = f'{DIR}/lag/{NAME}-{HOW}' if mode == 'lag' else f'{DIR}/ios/{NAME}'
frames = sorted(f for f in os.listdir(frames_dir) if f.endswith('.png'))


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64)


def strip():
    """The motion scene's whole content at 3x, composed as both sides draw it."""
    height = scene['motion']['height']
    bg = tuple(int(scene['background'][i : i + 2], 16) for i in (1, 3, 5))
    out = Image.new('RGB', (W * SCALE, height * SCALE), bg)
    for placed in scene['images']:
        x, y, w, h, r = (placed[k] * SCALE for k in ('x', 'y', 'width', 'height', 'radius'))
        size = (round(x + w) - round(x), round(y + h) - round(y))
        photo = Image.open(f'{HERE}/../../src/assets/gallery/{placed["file"]}').convert('RGB')
        photo = ImageOps.fit(photo, size, Image.Resampling.LANCZOS)
        mask = Image.new('L', size, 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, size[0] - 1, size[1] - 1], r, fill=255)
        out.paste(photo, (round(x), round(y)), mask)
    return np.asarray(out).astype(np.float64)


# Rows for the offset match: well above the glass and its shadow, and below the 60 pt lag.ts lifts
# out of its frames.
ROWS = slice(70 * SCALE, 700 * SCALE)
LIFT = 60


def profiles(image):
    """Each of the four columns' mean luma per row: enough to place a frame on the strip."""
    luma = image @ [0.299, 0.587, 0.114]
    edges = np.linspace(0, W * SCALE, 5).astype(int)
    return np.stack([luma[:, a:b].mean(1) for a, b in zip(edges[:-1], edges[1:])], 1)


def place(content, image):
    """A frame's scroll offset (pt) on the strip, and how well it matched."""
    end = (scene['motion']['height'] - H) * SCALE
    span = ROWS.stop - ROWS.start
    windows = np.lib.stride_tricks.sliding_window_view(content, span, axis=0)
    windows = windows[: end + ROWS.start + 1]
    target = profiles(image)[ROWS].T
    err = ((windows - target) ** 2).mean((1, 2))
    k = int(np.argmin(err))
    shift = float(k)
    if 0 < k < len(err) - 1:
        a, b, c = err[k - 1], err[k], err[k + 1]
        shift += 0.5 * (a - c) / max(a - 2 * b + c, 1e-9)
    return (shift - ROWS.start) / SCALE, float(np.sqrt(err[k]))


def lag():
    from scipy import ndimage

    material = json.load(open(f'{HERE}/../../src/lib/live-glass-material.json'))[scene['scheme']]
    full = strip()
    content = profiles(full)
    luma = full @ [0.299, 0.587, 0.114]
    small = ndimage.zoom(luma, 1 / SCALE, order=1)
    wide = ndimage.zoom(ndimage.gaussian_filter(small, material['wideBlur']), SCALE, order=1)
    wide = np.pad(wide, ((0, max(0, luma.shape[0] - wide.shape[0])), (0, 0)), mode='edge')
    frost = (1 - material['wide']) * ndimage.gaussian_filter(luma, material['blur'] * SCALE)
    frost = frost + material['wide'] * wide[: luma.shape[0], : luma.shape[1]]
    # The glass's flat middle: 12 pt either side of its centre, where it doesn't bend.
    cx = round((button['x'] + button['size'] / 2) * SCALE)
    cy = round((button['y'] + button['size'] / 2) * SCALE)
    half = 12 * SCALE
    cols = slice(cx - half, cx + half)
    rows = []
    for name in frames:
        # Screencast frames show the whole window, at whatever scale Chrome sends: the scene is
        # its top left W x H pt, scaled up to SCALE.
        frame = Image.open(f'{frames_dir}/{name}').convert('RGB')
        k = frame.size[0] / 520
        frame = frame.crop((0, -round(LIFT * k), round(W * k), round((H - LIFT) * k)))
        frame = frame.resize((W * SCALE, H * SCALE), Image.Resampling.BICUBIC)
        image = np.asarray(frame).astype(np.float64)
        scroll, residual = place(content, image)
        if residual > 30:
            continue
        seen = (image @ [0.299, 0.587, 0.114])[cy - half : cy + half, cols].mean(1)
        seen = (seen - seen.mean()) / (seen.std() + 1e-6)
        best, score = None, -2.0
        for back in np.arange(scroll - 40, scroll + 40.01, 1 / SCALE):
            top = round((back + button['y'] + button['size'] / 2) * SCALE) - half
            if top < 0 or top + 2 * half > frost.shape[0]:
                continue
            ref = frost[top : top + 2 * half, cols].mean(1)
            ref = (ref - ref.mean()) / (ref.std() + 1e-6)
            ncc = float((seen * ref).mean())
            if ncc > score:
                best, score = back, ncc
        if best is not None:
            rows.append((name, scroll, best, score))
    moving = [r for r in rows if 1 < r[1] < scene['motion']['height'] - H - 1]
    for name, scroll, seen, score in rows[:: max(1, len(rows) // 30)]:
        print(f'{name} page {scroll:8.2f}  glass {seen:8.2f}  trails {scroll - seen:6.2f} pt  ncc {score:.2f}')
    trail = np.array([r[1] - r[2] for r in moving if r[3] > 0.8])
    steps = np.diff([r[1] for r in rows])
    step = np.median(steps[steps > 0.5]) if (steps > 0.5).any() else float('nan')
    print(f'{len(moving)} moving frames: glass trails the page by {np.median(trail):.2f} pt median '
          f'(mean {trail.mean():.2f}, max {np.abs(trail).max():.2f}); the page moves '
          f'{step:.2f} pt a captured frame')


def offsets():
    content = profiles(strip())
    end = (scene['motion']['height'] - H) * SCALE
    span = ROWS.stop - ROWS.start
    windows = np.lib.stride_tricks.sliding_window_view(content, span, axis=0)  # (n, 4, span)
    windows = windows[: end + ROWS.start + 1]
    found = []
    for name in frames:
        target = profiles(load(f'{frames_dir}/{name}'))[ROWS].T  # (4, span)
        err = ((windows - target) ** 2).mean((1, 2))
        k = int(np.argmin(err))
        shift = float(k)
        if 0 < k < len(err) - 1:
            a, b, c = err[k - 1], err[k], err[k + 1]
            shift += 0.5 * (a - c) / max(a - 2 * b + c, 1e-9)
        # Frame row ROWS.start at scroll o is strip row ROWS.start + o * SCALE. Frames from before
        # the app came up (the launch animation) match nothing and are dropped.
        residual = float(np.sqrt(err[k]))
        if residual < 30:
            found.append({'frame': name, 'scroll': (shift - ROWS.start) / SCALE,
                          'residual': residual})
    json.dump(found, open(f'{DIR}/ios/{NAME}.json', 'w'), indent=1)
    for f in found[:: max(1, len(found) // 20)]:
        print(f"{f['frame']} scroll {f['scroll']:8.2f} pt  residual {f['residual']:.2f}")


def regions():
    half = button['size'] / 2 + 12
    cx, cy = button['x'] + button['size'] / 2, button['y'] + button['size'] / 2
    n = round(2 * half * SCALE)
    yy, xx = np.mgrid[0:n, 0:n]
    d = button['size'] / 2 - np.hypot((xx + 0.5) / SCALE - half, (yy + 0.5) / SCALE - half)
    box = (round((cy - half) * SCALE), round((cx - half) * SCALE), n)
    # The same square of plain content 300 pt above the glass, for the floor.
    floor = (box[0] - 300 * SCALE, box[1], n)
    masks = {'body': d > 10, 'rim': (d > 0) & (d <= 10), 'shadow': (d <= 0) & (d > -12)}
    return box, floor, masks, d > -12


def crop(image, at):
    y, x, n = at
    return image[y : y + n, x : x + n]


def diff():
    found = {f['frame']: f for f in json.load(open(f'{DIR}/ios/{NAME}.json'))}
    box, floor, masks, inside = regions()
    rows, table = [], []
    for name in found:
        web_path = f'{DIR}/web/{NAME}/{name}'
        if not os.path.exists(web_path):
            continue
        ios, web = load(f'{frames_dir}/{name}'), load(web_path)
        err = np.abs(crop(web, box) - crop(ios, box)).mean(2)
        base = np.abs(crop(web, floor) - crop(ios, floor)).mean(2)[inside].mean()
        parts = {k: err[m].mean() for k, m in masks.items()}
        table.append((name, found[name]['scroll'], err[inside].mean(), base, parts))
        rows.append(np.concatenate([crop(ios, box), crop(web, box),
                                    np.clip(128 + (crop(web, box) - crop(ios, box)) * 8, 0, 255)], 1))
    for name, scroll, total, base, parts in table[:: max(1, len(table) // 25)]:
        print(f'{name} scroll {scroll:7.1f}  glass {total:5.2f}  floor {base:5.2f} | '
              + ' | '.join(f'{k} {v:5.2f}' for k, v in parts.items()))
    totals = np.array([t[2] for t in table])
    floors = np.array([t[3] for t in table])
    print(f'{len(table)} frames: glass {totals.mean():.2f} (max {totals.max():.2f}), '
          f'floor {floors.mean():.2f}')
    pick = rows[:: max(1, len(rows) // 12)]
    Image.fromarray(np.concatenate(pick, 0).astype(np.uint8)).save(f'{DIR}/{NAME}-diff.png')


def video():
    import shutil, tempfile

    found = json.load(open(f'{DIR}/ios/{NAME}.json'))
    times = subprocess.run(
        ['ffprobe', '-v', 'error', '-select_streams', 'v', '-show_entries', 'frame=pts_time',
         '-of', 'csv=p=0', f'{DIR}/ios/{NAME}.mov'],
        capture_output=True, text=True, check=True,
    ).stdout.split()
    half = 60 * SCALE
    cx = round((button['x'] + button['size'] / 2) * SCALE)
    cy = round((button['y'] + button['size'] / 2) * SCALE)
    work = tempfile.mkdtemp()
    lines = []
    for i, f in enumerate(found):
        web_path = f'{DIR}/web/{NAME}/{f["frame"]}'
        if not os.path.exists(web_path):
            continue
        pair = [load(p)[cy - half : cy + half, cx - half : cx + half]
                for p in (f'{frames_dir}/{f["frame"]}', web_path)]
        gap = np.full((2 * half, 6, 3), 128.0)
        out = f'{work}/{i:04d}.png'
        Image.fromarray(np.concatenate([pair[0], gap, pair[1]], 1).astype(np.uint8)).save(out)
        start = float(times[int(f['frame'][:4]) - 1])
        end = float(times[int(found[i + 1]['frame'][:4]) - 1]) if i + 1 < len(found) else start + 1
        lines += [f"file '{out}'", f'duration {max(end - start, 1 / 60):.4f}']
    open(f'{work}/list.txt', 'w').write('\n'.join(lines) + '\n')
    subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i',
         f'{work}/list.txt', '-vf', 'fps=60,format=yuv420p', '-c:v', 'libx264', '-crf', '12',
         f'{DIR}/{NAME}.mp4'],
        check=True,
    )
    shutil.rmtree(work)
    print(f'{DIR}/{NAME}.mp4')


{'offsets': offsets, 'diff': diff, 'lag': lag, 'video': video}[mode]()
