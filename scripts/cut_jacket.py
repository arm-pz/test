# Run from the repo root after segment_jacket.py: python3 scripts/cut_jacket.py  (needs raw/p6764990.jpg for the canvas)
import json, os, sys
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, 'scripts')
from jacket_pieces import P

OUT = 'public/media/jacket'
os.makedirs(OUT, exist_ok=True)
CROP = (640, 1180, 2700, 3860)
S = 0.8  # export scale: 2060x2680 → 1648x2144

rgb = np.asarray(Image.open('raw/jacket.jpg').convert('RGB').crop(CROP)).copy()
alpha = np.load('raw/alpha.npy').astype(np.uint8)
H, W = alpha.shape

# Paint out the hanger's printed name and brand label (dark ink on white).
L = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
ink = np.zeros_like(L)
ink[115:290, 860:1150] = (L[115:290, 860:1150] < 135).astype(np.uint8) * 255
ink = cv2.dilate(ink, np.ones((7, 7), np.uint8))
rgb = cv2.inpaint(rgb, ink, 11, cv2.INPAINT_TELEA)

# Partition the silhouette: each pixel belongs to the first piece containing it.
owner = np.full((H, W), -1, np.int16)
for i, (name, kind, g) in enumerate(P):
    m = np.zeros((H, W), np.uint8)
    if kind == 'circle':
        cv2.circle(m, (g[0], g[1]), g[2], 255, -1, lineType=cv2.LINE_8)
    else:
        cv2.fillPoly(m, [np.array(g, np.int32)], 255)
    owner[(m > 0) & (owner < 0)] = i

Ws, Hs = round(W * S), round(H * S)
rgb_s = cv2.resize(rgb, (Ws, Hs), interpolation=cv2.INTER_AREA)
alpha_s = cv2.resize(alpha, (Ws, Hs), interpolation=cv2.INTER_AREA)
owner_s = cv2.resize(owner.astype(np.int16), (Ws, Hs), interpolation=cv2.INTER_NEAREST)

meta = {'width': Ws, 'height': Hs, 'pieces': []}
for i, (name, kind, g) in enumerate(P):
    if name in ('frontL', 'frontR'):
        # a front keeps the cloth under its flaps, welt and button: those come
        # off as copies, the way a flap lifts off a pocket mouth
        names = [n for n, *_ in P]
        under = [names.index(n) for n in (name, 'flapUL', 'flapLL', 'flapR', 'welt', 'button')]
        side = (np.arange(Ws)[None, :] < round(1010 * S)) if name == 'frontL' else (np.arange(Ws)[None, :] >= round(1010 * S))
        a = np.where(np.isin(owner_s, under) & side, alpha_s, 0).astype(np.uint8)
    else:
        a = np.where(owner_s == i, alpha_s, 0).astype(np.uint8)
    ys, xs = np.nonzero(a > 8)
    if len(xs) == 0:
        print('empty', name); continue
    x0, y0, x1, y1 = max(0, xs.min() - 2), max(0, ys.min() - 2), min(Ws, xs.max() + 3), min(Hs, ys.max() + 3)
    rgba = np.dstack([rgb_s[y0:y1, x0:x1], a[y0:y1, x0:x1]])
    Image.fromarray(rgba, 'RGBA').save(f'{OUT}/{name}.webp', 'WEBP', quality=86, method=6)
    # outline for the chalk line, in piece-local pixels
    cs, _ = cv2.findContours((a[y0:y1, x0:x1] > 110).astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    c = max(cs, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, 1.6, True)[:, 0, :]
    path = 'M' + 'L'.join(f'{x},{y}' for x, y in c) + 'Z'
    meta['pieces'].append({'id': name, 'x': int(x0), 'y': int(y0), 'w': int(x1 - x0), 'h': int(y1 - y0), 'path': path})

# The whole jacket in one image, for the still layout and the first paint.
Image.fromarray(np.dstack([rgb_s, alpha_s]), 'RGBA').save(f'{OUT}/whole.webp', 'WEBP', quality=86, method=6)

# What is under the cloth: the hand-padded canvas photo, cut to the jacket's
# silhouette (minus the hanger and tie, which stay put).
inside_mask = np.where((owner_s >= 0) & (owner_s != [n for n, *_ in P].index('rest')), alpha_s, 0).astype(np.uint8)
canvas = Image.open('raw/p6764990.jpg').convert('RGB').rotate(-8, resample=Image.BICUBIC)
# the padded canvas strip, straightened: pale cloth with herringbone pad-stitching
strip = np.asarray(canvas.crop((1420, 1150, 1940, 3950))).astype(np.float32)   # 520 x 2800
sw, sh = strip.shape[1], strip.shape[0]
OV = 60  # columns overlap and blend across this many pixels
inside = np.zeros((Hs, Ws, 3), np.float32)
weight = np.zeros((Hs, Ws, 1), np.float32)
ramp = np.ones(sw, np.float32)
ramp[:OV] = np.linspace(0, 1, OV); ramp[-OV:] = np.linspace(1, 0, OV)
for col, x in enumerate(range(-OV, Ws, sw - OV)):
    off = (col * 377) % (sh - Hs)          # a different stretch of strip per column
    piece = strip[off:off + Hs]
    x0, x1 = max(0, x), min(Ws, x + sw)
    w = ramp[x0 - x:x1 - x][None, :, None]
    inside[:, x0:x1] += piece[:, x0 - x:x1 - x] * w
    weight[:, x0:x1] += w
inside = inside / np.maximum(weight, 1e-3) * 0.8  # a step darker, so it reads as cloth in shadow
Image.fromarray(np.dstack([inside.astype(np.uint8), inside_mask]), 'RGBA').save(f'{OUT}/inside.webp', 'WEBP', quality=84, method=6)

json.dump(meta, open('src/jacket.json', 'w'))
print(Ws, Hs, [p['id'] for p in meta['pieces']])
