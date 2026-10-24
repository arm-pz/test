import sys, json, math, os
import numpy as np
from PIL import Image
sys.path.insert(0, 'scripts')
from suit_pieces import T
from layout import LAY, S, centroid

REPO = '.'
OUT = f'{REPO}/public/media/suit'
os.makedirs(OUT, exist_ok=True)

def smooth_path(pts):
    """Closed Catmull-Rom through the traced points, as cubic Béziers."""
    n = len(pts); d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
    for i in range(n):
        p0, p1, p2, p3 = pts[(i - 1) % n], pts[i], pts[(i + 1) % n], pts[(i + 2) % n]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f'C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    return d + 'Z'

LABEL = {'frontL': 'Front', 'frontR': 'Front', 'sleeveL': 'Sleeve', 'sleeveR': 'Sleeve', 'vestL': 'Waistcoat', 'vestR': 'Waistcoat', 'trouserL': 'Trouser', 'trouserR': 'Trouser'}
pieces = []
for k, pts in T.items():
    cx, cy = centroid(pts)
    local = [(x - cx, y - cy) for x, y in pts]
    ys = [y for _, y in local]
    lx, ly, rot = LAY[k]
    pieces.append({
        'id': k, 'label': LABEL[k],
        'path': smooth_path(local),
        'home': [round(cx, 1), round(cy, 1)],
        'lay': [lx, ly, rot],
        'grain': [round(min(ys) * 0.55, 1), round(max(ys) * 0.55, 1)],
    })
json.dump({'layScale': S, 'pieces': pieces}, open(f'{REPO}/src/suit.json', 'w'), indent=1)

# the cloth, 1800px square
Image.open('raw/cloth_sq.png').convert('RGB').save(f'{OUT}/cloth.webp', 'WEBP', quality=86, method=6)
# the finished suit: fade the top edge (chin) and the bottom (trousers run out of frame)
s = np.asarray(Image.open('raw/suit_cut.png')).astype(np.float32)
H = s.shape[0]
y = np.arange(H)[:, None]
fade = np.clip(y / (H * 0.035), 0, 1) * np.clip((H - y) / (H * 0.14), 0, 1)
s[..., 3] *= fade
Image.fromarray(s.astype(np.uint8), 'RGBA').save(f'{OUT}/suit.webp', 'WEBP', quality=88, method=6)
print([p['id'] for p in pieces])
