# Diff tinted glass: iOS simulator captures (<dir>/ref, from capture.sh) against the 3x
# /dev/glass render (<dir>/web/shot.png, from shoot.sh). Usage: uv run --with pillow --with
# numpy python tintdiff.py <dir> [-v]. Frames are found by their magenta corner markers.
# Frames are aligned on the pill's top edge and left edge; regions are reported separately.
import sys, numpy as np
from PIL import Image
S = sys.argv[1]
L = lambda p: np.asarray(Image.open(p).convert('RGB')).astype(float)
web = L(f'{S}/web/shot.png')
mk = np.argwhere((web[:, :, 0] == 255) & (web[:, :, 1] == 0) & (web[:, :, 2] == 255))
# Marker blocks are 3x3; keep top-left corners.
pts = []
mkset = {(int(y), int(x)) for y, x in mk}
for y, x in mkset:
    if (y - 1, x) not in mkset and (y, x - 1) not in mkset:
        pts.append((y, x))
pts.sort()
# Columns: same x; order columns by (first y, x).
print('markers', len(pts))
byx = {}
for y, x in pts:
    byx.setdefault(x, []).append(y)
groups = []
for x, ys in byx.items():
    ys.sort()
    cur = [ys[0]]
    for y in ys[1:]:
        if y - cur[-1] > 400:
            groups.append((x, cur)); cur = [y]
        else:
            cur.append(y)
    groups.append((x, cur))
order = sorted(groups, key=lambda g: (g[1][0], g[0]))
names = [f'{b}-full' for b in ('white', 'grey', 'dark', 'black')]
tints = ['red-500', 'amber-500', 'green-500', 'blue-600']
assert len(order) == len(names), len(order)

def pill(im, oy, ox, h=324, w=1179):
    fr = im[oy:oy + h, ox:ox + w]
    bg = fr[h - 4, 4]
    cx = w // 2
    t = int(np.argmax(np.abs(fr[:, cx] - bg).sum(1) > 6))
    cy = t + 95
    l = int(np.argmax(np.abs(fr[cy, :] - bg).sum(1) > 6))
    return fr, t, l

regions = {'rim+shine top': (0, 16), 'body': (16, 172), 'rim+shine bottom': (172, 192)}
tot = []
for ci, (x, ys) in enumerate(order):
    bname = names[ci].split('-')[0]
    ref = L(f'{S}/ref/effect-{bname}-1-red-500_amber-500_green-500_blue-600.png')
    rbg = ref[2200, 600]
    rt0 = int(np.argmax(np.abs(ref[30:, 600] - rbg).sum(1) > 6)) + 30
    for ti, y in enumerate(sorted(ys)):
        wf, wt, wl = pill(web, y, x)
        # Sim frame: pill top of frame ti; frame origin = pill top - same offset as web.
        oy = rt0 + 324 * ti - wt
        rf, rt, rl = pill(ref, oy, 0)
        dx = rl - wl
        out = []
        for rn, (a0, a1) in regions.items():
            W = wf[wt + a0:wt + a1, wl + 30:wl + 1000]
            R = rf[rt + a0:rt + a1, rl + 30:rl + 1000]
            out.append(f'{rn} {np.abs(W - R).mean():5.2f}')
        cap = np.abs(wf[wt:wt + 190, wl - 3:wl + 30] - rf[rt:rt + 190, rl - 3:rl + 30]).mean()
        allm = np.abs(wf[wt - 3:wt + 195, wl - 3:wl + 1060] - rf[rt - 3:rt + 195, rl - 3:rl + 1060]).mean()
        tot.append(allm)
        print(f'{names[ci]:11s} {tints[ti]:9s} all {allm:5.2f} | ' + ' | '.join(out) + f' | cap {cap:5.2f} | dx {dx} dt {rt - wt}')
        if '-v' in sys.argv:
            for r in [0, 1, 2, 3, 4, 5, 8, 12, 95, 186, 188, 190]:
                print(f'     row {r:3d} web {wf[wt + r, wl + 500].astype(int)} ios {rf[rt + r, rl + 500].astype(int)}')
print(f'mean {np.mean(tot):.2f}')
