# Fits the live-glass model to iOS simulator captures (capture.sh) of the scenes in
# Scenes/scenes.json. Usage, from tools/glass-live:
#   uv run --with pillow --with numpy --with scipy python fit.py <dir> [--write]
# The model, which src/shaders/live-glass.wgsl evaluates the same way, per pixel at distance d
# inside the shape's edge (pt) with outward normal n:
#   sample = p - n * depth * (1 - d / bevel)^power        (refraction, inside d < bevel)
#   base   = mix(gaussian(backdrop, blur), gaussian(backdrop, wideBlur), wide) at sample  (frost)
#   base   = luma + saturation * (base - luma)              (vibrancy)
#   out    = offset + gain * base + curve * base^2         (sRGB 0-1, tables over d and angle)
# offset, gain and curve carry the tone, rim light and drop shadow. For given refraction and blur they
# solve per pixel by least squares across every scene of a scheme, then reduce to a table over
# (d, angle) that the shader reads. The refraction and blur are searched to minimise what's left.
# --write saves the tables and parameters to src/lib/live-glass-material.json.
import json, sys
import numpy as np
from PIL import Image
from scipy import ndimage, optimize

DIR = sys.argv[1]
WRITE = '--write' in sys.argv
HERE = __file__.rsplit('/', 1)[0] or '.'
SCENES = json.load(open(f'{HERE}/Scenes/scenes.json'))
SCALE = 3
BUTTON = SCENES['scenes'][0]['button']
RADIUS = BUTTON['size'] / 2
CX, CY = BUTTON['x'] + RADIUS, BUTTON['y'] + RADIUS
# The crop: the button and 12 pt around it for the shadow; the backdrop gets 40 pt for the
# refraction and blur to reach into.
CROP = RADIUS + 12
PAD = RADIUS + 64
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
KNOTS = np.array([0, 0.75, 1.5, 2.5, 3.5, 5, 6.5, 8, 10, 12.0])
PROFILE = None


def pull():
    if PROFILE is not None:
        return np.interp(np.maximum(D, 0), KNOTS, np.append(PROFILE, 0.0))
    return None


def refracted(blurred, params):
    depth, bevel, power = params[:3]
    shift = pull()
    if shift is None:
        t = np.clip(1 - D / bevel, 0, 1) ** power
        shift = depth * t
    shift = np.where(D > 0, shift, 0)
    sx = PX - NX * shift
    sy = PY - NY * shift
    # Backdrop pixel coordinates over the PAD square.
    u = (sx - (CX - PAD)) * SCALE - 0.5
    v = (sy - (CY - PAD)) * SCALE - 0.5
    return np.stack(
        [ndimage.map_coordinates(blurred[:, :, c], [v, u], order=1, mode='nearest') for c in range(3)],
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


BEND_FIRST = '--bend-first' in sys.argv


def blurred_backdrops(scenes, params):
    blur, wide, wide_blur = params[3], params[5], params[6]
    out = []
    for scene, back in scenes:
        if BEND_FIRST:
            out.append((scene, back, None))
            continue
        b = (1 - wide) * gaussian(back, blur) + wide * gaussian(back, wide_blur)
        out.append((scene, back, b))
    return out


LUMA = np.array([0.2126, 0.7152, 0.0722])


def model_inputs(prepared, params):
    """Per scene: the base the material sees, frosted, refracted and saturated inside, plain
    outside, in 0-1."""
    inside = (D > 0)[..., None]
    lo = int(round((PAD - CROP) * SCALE))
    hi = lo + D.shape[0]
    bases = []
    for scene, back, blurred in prepared:
        plain = back[lo:hi, lo:hi] / 255
        if BEND_FIRST:
            # The core blur runs on the bent image, in screen space; the wide one is bent.
            sharp = refracted(back, params)
            core = gaussian(sharp, params[3]) if params[3] >= 0.05 else sharp
            wide = refracted(gaussian(back, params[6]), params)
            glass = ((1 - params[5]) * core + params[5] * wide) / 255
        else:
            glass = refracted(blurred, params) / 255
        luma = (glass @ LUMA)[..., None]
        glass = luma + params[4] * (glass - luma)
        bases.append(np.where(inside, glass, plain))
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


def scheme_data(scheme):
    names = [s for s in SCENES['scenes'] if s['scheme'] == scheme]
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


def evaluate(data, params, detail=False):
    prepared = blurred_backdrops([(s, b) for s, b, _, _ in data], params)
    bases = model_inputs(prepared, params)
    refs = [r for _, _, r, _ in data]
    tables = table(solve_maps(bases, refs))
    O, G, Q = (lookup(t)[..., None] for t in tables)
    renders = [np.clip(O + G * b + Q * b * b, 0, 1) * 255 for b in bases]
    # Scored inside the button and its shadow only, where the model has a say.
    near = D > -12
    errs = [np.abs(m - r)[near].mean() for m, r in zip(renders, refs)]
    if detail:
        return errs, tables, renders
    return float(np.mean(errs))


# Measured directly from the ramp captures (see README): inside about 19 pt from the middle the
# glass is 1:1, and across the outer bevel every pixel samples from about 6.5 pt inside the edge.
# Light and dark agree, so the refraction is fixed and shared; the search fits the frost.
REFRACTION = [6.5, 10.0, 1.8]


def fit(scheme, start):
    data = scheme_data(scheme)
    for scene, _, _, err in data:
        print(f"  align {scene['name']:16s} {err:5.2f}")
    bounds = [(0.05, 6), (0.5, 3), (0, 0.95), (3, 24)]

    def full(q):
        q = np.clip(q, [b[0] for b in bounds], [b[1] for b in bounds])
        return [*REFRACTION, *q]

    res = optimize.minimize(
        lambda q: evaluate(data, full(q)),
        start,
        method='Nelder-Mead',
        options={'xatol': 0.02, 'fatol': 0.002, 'maxiter': 120},
    )
    p = full(res.x)
    errs, tables, _ = evaluate(data, p, detail=True)
    print(
        f'{scheme}: blur {p[3]:.2f} saturation {p[4]:.2f} wide {p[5]:.2f} '
        f'wideBlur {p[6]:.2f} -> {np.mean(errs):.2f}'
    )
    for (scene, *_), e in zip(data, errs):
        print(f"  {scene['name']:16s} {e:5.2f}")
    return p, tables


def fit_profile(start, frost, names):
    """Fits the bevel's pull at KNOTS, shared by both schemes, with each scheme's frost fixed."""
    global PROFILE
    sets = {}
    for scheme in frost:
        data = scheme_data(scheme)
        sets[scheme] = [x for x in data if x[0]['name'] in names]

    def loss(knots):
        global PROFILE
        PROFILE = np.maximum(knots, 0)
        # A light penalty on bends keeps the profile from kinking to chase single pixels.
        bends = np.diff(np.append(PROFILE, 0.0), 2)
        return np.mean([evaluate(sets[k], [0, 1, 1, *frost[k]]) for k in sets]) + 0.01 * (bends**2).sum()

    res = optimize.minimize(loss, start, method='Powell', options={'xtol': 0.05, 'ftol': 0.002, 'maxfev': 700})
    PROFILE = np.maximum(res.x, 0)
    print('profile', np.round(PROFILE, 2).tolist(), '->', round(res.fun, 3))
    return PROFILE


if __name__ == '__main__':
    # Alternates the frost (per scheme) and the bevel profile (shared). The frost starts from the
    # step captures' line spread: about 30% passes nearly sharp, the rest blurs ~14 pt wide.
    PROFILE = 6.5 * np.clip(1 - KNOTS[:-1] / 10, 0, 1) ** 1.8
    frost = {'light': [0.5, 1.7, 0.71, 14.9], 'dark': [0.3, 1.5, 0.66, 12.7]}
    bevel_scenes = {f'{k}-{s}' for k in ('grid', 'step', 'scrolled', 'saw-x') for s in ('light', 'dark')}
    for round_ in range(2):
        for scheme in frost:
            p, _ = fit(scheme, frost[scheme])
            frost[scheme] = p[3:]
        PROFILE = fit_profile(PROFILE, frost, bevel_scenes)
    out = {
        'dMin': D_MIN,
        'dStep': D_STEP,
        'angles': ANGLES,
        'size': BUTTON['size'],
        'knots': KNOTS.tolist(),
        'pulls': np.round(np.append(PROFILE, 0.0), 3).tolist(),
    }
    for scheme in frost:
        errs, (o, g, q), _ = evaluate(scheme_data(scheme), [0, 1, 1, *frost[scheme]], detail=True)
        print(scheme, 'final', round(float(np.mean(errs)), 2), [round(float(e), 2) for e in errs])
        blur, saturation, wide, wide_blur = frost[scheme]
        out[scheme] = {
            'blur': round(float(blur), 3),
            'saturation': round(float(saturation), 3),
            'wide': round(float(wide), 3),
            'wideBlur': round(float(wide_blur), 3),
            'offset': np.round(o, 4).tolist(),
            'gain': np.round(g, 4).tolist(),
            'curve': np.round(q, 4).tolist(),
        }
    if WRITE:
        path = f'{HERE}/../../src/lib/live-glass-material.json'
        json.dump(out, open(path, 'w'))
        print('wrote', path)
