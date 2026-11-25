# Fits the live-glass model to iOS simulator captures (capture.sh) of the scenes in
# Scenes/scenes.json. Usage, from tools/glass-live:
#   uv run --with pillow --with numpy --with scipy python fit.py <dir> [--resume] [--bevel] [--write]
# The model, which src/shaders/live-glass.wgsl evaluates the same way, per pixel at distance d
# inside the shape's edge (pt) with outward normal n:
#   sample = p - n * pull(d)                    (refraction: a monotone cubic through KNOTS, from
#                                                about 23 pt at the rim to 0 by 14 pt in)
#   b      = backdrop ^ gamma                   (the frost works in a power space, per scheme)
#   base   = mix(half(b), gaussian(b, wideBlur), wide) at sample, ^ (1 / gamma)
#   base   = luma + saturation * (base - luma)  (vibrancy)
#   out    = offset + gain * base + curve * base^2   (sRGB 0-1, tables over d and angle)
# half() is the sharp share as iOS draws it: a 2x box downsample on the screen's pixel grid,
# read back bilinearly. offset, gain and curve carry the tone, rim light and drop shadow: for
# given refraction and frost they solve per pixel by least squares across every scene of a
# scheme, then reduce to a table over (d, angle) that the shader reads. The frost is searched to
# minimise what's left; --bevel also refits the knots to the image error, over both schemes.
# The motion stills at 150, 450, 750, 1050 and 1350 pt are held out of every search and
# reported apart; the tables written use every scene.
# --resume starts from the material already written; --write saves to
# src/lib/live-glass-material.json.
import json, os, sys
import numpy as np
from PIL import Image
from scipy import interpolate, ndimage, optimize

DIR = sys.argv[1]
WRITE = '--write' in sys.argv
HERE = __file__.rsplit('/', 1)[0] or '.'
SCENES = json.load(open(f'{HERE}/Scenes/scenes.json'))
SCALE = 3
BUTTON = SCENES['scenes'][0]['button']
RADIUS = BUTTON['size'] / 2
CX, CY = BUTTON['x'] + RADIUS, BUTTON['y'] + RADIUS
# The crop: the button and 12 pt around it for the shadow; the backdrop gets 100 pt for the
# refraction and blur to reach into.
CROP = RADIUS + 12
PAD = RADIUS + 100
# Lookup table: d from -12 to 12 pt in 1/3 pt steps (past 12 pt in, the material is flat), angle
# of the outward normal in 32 steps.
D_MIN, D_MAX, D_STEP = -12.0, 12.0, 1 / 3
ANGLES = 32


def load(path):
    return np.asarray(Image.open(path).convert('RGB')).astype(np.float64)


def grid(half):
    n = int(round(2 * half * SCALE))
    c = (np.arange(n) + 0.5) / SCALE - half
    return np.meshgrid(CX + c, CY + c)


def rounded_box(px, py, x, y, w, h, r):
    qx = np.abs(px - (x + w / 2)) - (w / 2 - r)
    qy = np.abs(py - (y + h / 2)) - (h / 2 - r)
    return np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - r


image_cache = {}


def backdrop(scene):
    """The scene composed at 3x over the PAD square, as CSS draws it."""
    px, py = grid(PAD)
    # Past the screen's edge the frost sees the edge row repeated.
    px = np.clip(px, 0.5 / SCALE, SCENES['width'] - 0.5 / SCALE)
    py = np.clip(py, 0.5 / SCALE, SCENES['height'] - 0.5 / SCALE)
    bg = scene['background']
    out = np.empty(px.shape + (3,))
    out[:] = [int(bg[i : i + 2], 16) for i in (1, 3, 5)]
    for placed in scene['images']:
        name = placed['file']
        if name not in image_cache:
            folder = f'{HERE}/Scenes' if name.endswith('.png') else f'{HERE}/../../src/assets/gallery'
            image_cache[name] = load(f'{folder}/{name}')
        img = image_cache[name]
        ih, iw = img.shape[:2]
        x, y, w, h, r = (placed[k] for k in ('x', 'y', 'width', 'height', 'radius'))
        cover = max(w / iw, h / ih)
        u = (px - x - w / 2) / cover + iw / 2 - 0.5
        v = (py - y - h / 2) / cover + ih / 2 - 0.5
        sampled = np.stack(
            [ndimage.map_coordinates(img[:, :, c], [v, u], order=1, mode='nearest') for c in range(3)],
            -1,
        )
        cov = np.clip(0.5 - rounded_box(px, py, x, y, w, h, r) * SCALE, 0, 1)[..., None]
        out = out * (1 - cov) + sampled * cov
    return out


def geometry():
    px, py = grid(CROP)
    dx, dy = px - CX, py - CY
    r = np.hypot(dx, dy)
    d = RADIUS - r
    nx, ny = dx / np.maximum(r, 1e-6), dy / np.maximum(r, 1e-6)
    return px, py, d, nx, ny, np.arctan2(ny, nx)


PX, PY, D, NX, NY, ANG = geometry()


# The bevel's pull, pt inward, at these distances from the edge (pt); 0 from the last on.
KNOTS = np.array([0, 1.5, 3, 4.5, 6, 8, 10, 12, 14, 28.0])
PROFILE = np.array([22.9, 15.3, 10.4, 7.4, 4.95, 2.66, 1.16, 0.32, 0.0])


def bevel(profile):
    """The pull as a monotone cubic through the knots (PCHIP): smooth, so the magnification it
    gives changes without creases, and never overshooting the knots into a fold they don't have."""
    return interpolate.PchipInterpolator(KNOTS, np.append(profile, 0.0))


def refracted(image, profile):
    """`image` (over the PAD square) read where each crop pixel samples it through the bevel."""
    shift = np.where(D > 0, bevel(profile)(np.clip(D, 0, KNOTS[-1])), 0)
    u = (PX - NX * shift - (CX - PAD)) * SCALE - 0.5
    v = (PY - NY * shift - (CY - PAD)) * SCALE - 0.5
    return np.stack(
        [ndimage.map_coordinates(image[:, :, c], [v, u], order=1, mode='nearest') for c in range(3)],
        -1,
    )


def gaussian(back, sigma):
    """Gaussian blur of sigma pt; wide ones run at 1x and scale back up."""
    if sigma < 3:
        return np.stack([ndimage.gaussian_filter(back[:, :, c], sigma * SCALE, mode='nearest') for c in range(3)], -1)
    n = back.shape[0] // SCALE
    small = back[: n * SCALE, : n * SCALE].reshape(n, SCALE, n, SCALE, 3).mean((1, 3))
    small = np.stack([ndimage.gaussian_filter(small[:, :, c], sigma, mode='nearest') for c in range(3)], -1)
    up = ndimage.zoom(small, (SCALE, SCALE, 1), order=1, grid_mode=True, mode='nearest')
    return np.pad(up, ((0, back.shape[0] - up.shape[0]), (0, back.shape[1] - up.shape[1]), (0, 0)), mode='edge')


def half(back):
    """The sharp share: a 2x box downsample in blocks on even screen pixels, read back bilinearly.
    iOS's line spread has the half-pixel tails toward -x and +y this leaves."""
    ox, oy = round((CX - PAD) * SCALE) % 2, round((CY - PAD) * SCALE) % 2
    b = np.pad(back, ((oy, 0), (ox, 0), (0, 0)), mode='edge')
    h, w = b.shape[:2]
    b = np.pad(b, ((0, h % 2), (0, w % 2), (0, 0)), mode='edge')
    small = b.reshape(b.shape[0] // 2, 2, b.shape[1] // 2, 2, 3).mean((1, 3))
    gy, gx = np.meshgrid((np.arange(h) + 0.5) / 2 - 0.5, (np.arange(w) + 0.5) / 2 - 0.5, indexing='ij')
    up = np.stack([ndimage.map_coordinates(small[:, :, c], [gy, gx], order=1, mode='nearest') for c in range(3)], -1)
    return up[oy : oy + back.shape[0], ox : ox + back.shape[1]]


LUMA = np.array([0.2126, 0.7152, 0.0722])
FROST = ('saturation', 'wide', 'wideBlur', 'gamma')
MATERIAL = f'{HERE}/../../src/lib/live-glass-material.json'
# The sharp layer depends on gamma alone, the wide one on the blur too. Each holds a few searches'
# worth of a scheme's scenes (about 7 MB an entry) before it starts over.
sharp_cache, wide_cache = {}, {}


def cached(cache, key, make):
    if key not in cache:
        if len(cache) > 120:
            cache.clear()
        cache[key] = make().astype(np.float32)
    return cache[key]


def layers(scene, back, gamma, wide_blur):
    """The sharp and wide layers of a scene's backdrop in the frost's power space, cached."""
    key = (scene['name'], round(gamma, 4))
    raised = lambda: (back / 255) ** gamma
    sharp = cached(sharp_cache, key, lambda: half(raised()))
    wide = cached(wide_cache, (*key, round(wide_blur, 3)), lambda: gaussian(raised(), wide_blur))
    return sharp, wide


def model_inputs(data, frost, profile):
    """Per scene: the base the material sees, frosted, refracted and saturated inside, plain
    outside, in 0-1."""
    inside = (D > 0)[..., None]
    lo = int(round((PAD - CROP) * SCALE))
    hi = lo + D.shape[0]
    bases = []
    for scene, back, _, _ in data:
        sharp, soft = layers(scene, back, frost['gamma'], frost['wideBlur'])
        mixed = (1 - frost['wide']) * refracted(sharp, profile) + frost['wide'] * refracted(soft, profile)
        glass = np.maximum(mixed, 0) ** (1 / frost['gamma'])
        luma = (glass @ LUMA)[..., None]
        glass = luma + frost['saturation'] * (glass - luma)
        bases.append(np.where(inside, glass, back[lo:hi, lo:hi] / 255))
    return bases


def solve_maps(bases, refs):
    """Per pixel offset, gain and curve over every scene and channel, by least squares. A light
    ridge holds the curve at 0 where the scenes don't span enough tones to tell."""
    x = np.stack(bases).reshape(len(bases), -1, 3).transpose(1, 0, 2).reshape(D.size, -1)
    y = np.stack(refs).reshape(len(refs), -1, 3).transpose(1, 0, 2).reshape(D.size, -1) / 255
    X = np.stack([np.ones_like(x), x, x * x], -1)
    A = np.einsum('pni,pnj->pij', X, X) + np.diag([1e-6, 1e-6, 1e-2])
    b = np.einsum('pni,pn->pi', X, y) + np.array([0, 0, 0])
    coef = np.linalg.solve(A, b[..., None])[..., 0]
    return [coef[:, i].reshape(D.shape) for i in range(3)]


def table(maps):
    """Averages each map into (d, angle) bins; empty bins take the nearest d's value."""
    nd = int(round((D_MAX - D_MIN) / D_STEP)) + 1
    di = np.clip(np.round((D - D_MIN) / D_STEP).astype(int), 0, nd - 1)
    ai = np.round((ANG + np.pi) / (2 * np.pi) * ANGLES).astype(int) % ANGLES
    n = np.zeros((nd, ANGLES))
    np.add.at(n, (di, ai), 1)
    tables = []
    for values in maps:
        t = np.zeros((nd, ANGLES))
        np.add.at(t, (di, ai), values)
        t = t / np.maximum(n, 1)
        for a in range(ANGLES):
            have = n[:, a] > 0
            idx = np.arange(nd)
            t[:, a] = np.interp(idx, idx[have], t[have, a])
        tables.append(t)
    return tables


def lookup(tab):
    """Bilinear read of a table at every crop pixel, as the shader reads it."""
    nd = tab.shape[0]
    fd = np.clip((D - D_MIN) / D_STEP, 0, nd - 1)
    fa = (ANG + np.pi) / (2 * np.pi) * ANGLES
    d0 = np.floor(fd).astype(int)
    d1 = np.minimum(d0 + 1, nd - 1)
    a0 = np.floor(fa).astype(int)
    wd = fd - d0
    wa = fa - a0
    a1 = (a0 + 1) % ANGLES
    a0 %= ANGLES
    return (
        tab[d0, a0] * (1 - wd) * (1 - wa)
        + tab[d1, a0] * wd * (1 - wa)
        + tab[d0, a1] * (1 - wd) * wa
        + tab[d1, a1] * wd * wa
    )


def motion_stills():
    """Motion scenes held at an offset (capture.sh <scene>@<pt>), as plain scenes."""
    stills = []
    for file in sorted(os.listdir(f'{DIR}/ref')):
        if '@' not in file or not file.endswith('-bare.png'):
            continue
        name, scroll = file[: -len('-bare.png')].split('@')
        scene = next(s for s in SCENES['scenes'] if s['name'] == name)
        images = [{**i, 'y': i['y'] - float(scroll)} for i in scene['images']]
        near = [i for i in images if i['y'] < CY + PAD and i['y'] + i['height'] > CY - PAD]
        stills.append({**scene, 'name': f'{name}@{scroll}', 'images': near})
    return stills


def scheme_data(scheme):
    every = [s for s in SCENES['scenes'] if 'motion' not in s] + motion_stills()
    names = [s for s in every if s['scheme'] == scheme]
    lo = int(round((PAD - CROP) * SCALE))
    data = []
    for scene in names:
        ref = load(f"{DIR}/ref/{scene['name']}-bare.png")
        # Screen pixels over the crop: the screen is the scene at 3x from its origin.
        x0 = int(round((CX - CROP) * SCALE))
        y0 = int(round((CY - CROP) * SCALE))
        ref = ref[y0 : y0 + D.shape[0], x0 : x0 + D.shape[1]]
        back = backdrop(scene)
        # Alignment check: outside the shadow the crop must be the backdrop.
        far = (D < -10)[..., None]
        err = np.abs(ref - back[lo : lo + D.shape[0], lo : lo + D.shape[1]])[far[..., 0]].mean()
        data.append((scene, back, ref, err))
    return data


def held_out(scene):
    name = scene['name']
    return '@' in name and float(name.split('@')[1]) % 300 == 150


def evaluate(data, frost, profile, detail=False, train=True):
    """Mean error over the button and its shadow, with the tables solved on the training scenes
    (or every scene, `train=False`)."""
    bases = model_inputs(data, frost, profile)
    refs = [r for _, _, r, _ in data]
    use = [i for i, (scene, *_) in enumerate(data) if not (train and held_out(scene))]
    tables = table(solve_maps([bases[i] for i in use], [refs[i] for i in use]))
    O, G, Q = (lookup(t)[..., None] for t in tables)
    renders = [np.clip(O + G * b + Q * b * b, 0, 1) * 255 for b in bases]
    # Scored inside the button and its shadow only, where the model has a say.
    near = D > -12
    errs = np.array([np.abs(m - r)[near].mean() for m, r in zip(renders, refs)])
    if detail:
        return errs, tables
    return float(errs[use].mean())


def report(scheme, data, frost, profile):
    errs, _ = evaluate(data, frost, profile, detail=True)
    test = np.array([held_out(scene) for scene, *_ in data])
    held = f' held out {errs[test].mean():.2f}' if test.any() else ''
    print(f'{scheme}: ' + ' '.join(f'{k} {frost[k]:.3f}' for k in FROST)
          + f' -> train {errs[~test].mean():.2f}{held}')
    for (scene, *_), e in zip(data, errs):
        print(f"  {scene['name']:18s} {e:5.2f}")


def fit(scheme, data, frost, profile):
    """Searches the frost of one scheme, the bevel fixed."""
    for scene, _, _, err in data:
        print(f"  align {scene['name']:18s} {err:5.2f}")
    bounds = np.array([(0.5, 3), (0, 0.95), (3, 30), (0.4, 2.5)])

    def unpack(q):
        return dict(zip(FROST, np.clip(q, bounds[:, 0], bounds[:, 1])))

    res = optimize.minimize(
        lambda q: evaluate(data, unpack(q), profile),
        [frost[k] for k in FROST],
        method='Nelder-Mead',
        options={'xatol': 0.01, 'fatol': 0.002, 'maxiter': 80},
    )
    best = {k: float(v) for k, v in unpack(res.x).items()}
    report(scheme, data, best, profile)
    return best


def fit_bevel(sets, frost, profile):
    """Fits the knots to the image error over both schemes' training scenes, the frost fixed,
    keeping the pull non-increasing from the rim in."""

    def monotone(q):
        return np.minimum.accumulate(np.maximum(q, 0))

    def loss(q):
        return np.mean([evaluate(sets[k], frost[k], monotone(q)) for k in sets])

    res = optimize.minimize(loss, profile, method='Powell', options={'maxiter': 3, 'xtol': 0.05, 'ftol': 0.001})
    best = monotone(res.x)
    print('bevel', np.round(best, 3).tolist(), '->', round(res.fun, 3))
    return best


if __name__ == '__main__':
    # The frost starts from the review that found the power space: about 30% passes at half
    # resolution, the rest blurs ~15 pt wide.
    frost = {
        'light': dict(saturation=2.02, wide=0.693, wideBlur=14.9, gamma=1.56),
        'dark': dict(saturation=1.50, wide=0.693, wideBlur=16.6, gamma=0.70),
    }
    if '--resume' in sys.argv:
        last = json.load(open(MATERIAL))
        if last['knots'] == KNOTS.tolist():
            PROFILE = np.array(last['pulls'][:-1])
        frost = {k: {**frost[k], **{p: last[k][p] for p in FROST}} for k in frost}
    sets = {scheme: scheme_data(scheme) for scheme in frost}
    if '--bevel' in sys.argv:
        PROFILE = fit_bevel(sets, frost, PROFILE)
    for scheme in frost:
        frost[scheme] = fit(scheme, sets[scheme], frost[scheme], PROFILE)
    out = {
        'dMin': D_MIN,
        'dStep': D_STEP,
        'angles': ANGLES,
        'size': BUTTON['size'],
        'knots': KNOTS.tolist(),
        'pulls': np.round(np.append(PROFILE, 0.0), 3).tolist(),
        'slopes': np.round(bevel(PROFILE).derivative()(KNOTS), 4).tolist(),
    }
    for scheme in frost:
        # The tables written are solved over every scene.
        _, (o, g, q) = evaluate(sets[scheme], frost[scheme], PROFILE, detail=True, train=False)
        out[scheme] = {
            **{k: round(frost[scheme][k], 4) for k in FROST},
            'offset': np.round(o, 4).tolist(),
            'gain': np.round(g, 4).tolist(),
            'curve': np.round(q, 4).tolist(),
        }
    if WRITE:
        json.dump(out, open(MATERIAL, 'w'))
        print('wrote', MATERIAL)
