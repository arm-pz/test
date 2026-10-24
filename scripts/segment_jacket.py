# Run from the repo root: python3 scripts/segment_jacket.py  (needs raw/jacket.jpg and raw/u2net.onnx)
import numpy as np, onnxruntime as ort
from PIL import Image, ImageFilter
CROP = (640, 1180, 2700, 3860)   # jacket region in the 3000x4500 original
im = Image.open('raw/jacket.jpg').convert('RGB').crop(CROP)
sess = ort.InferenceSession('raw/u2net.onnx', providers=['CPUExecutionProvider'])
def run(img):
    x = np.asarray(img.resize((320, 320), Image.LANCZOS), dtype=np.float32) / 255.0
    x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
    m = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
    m = (m - m.min()) / (m.max() - m.min())
    return np.asarray(Image.fromarray((m * 255).astype(np.uint8)).resize(img.size, Image.BICUBIC), dtype=np.float32) / 255
m = run(im)
# tile pass: four overlapping quadrants at higher effective resolution, max-blended
W, H = im.size
acc = np.zeros_like(m); wsum = np.zeros_like(m)
for (x0, y0) in [(0, 0), (W // 2 - 200, 0), (0, H // 2 - 200), (W // 2 - 200, H // 2 - 200)]:
    x1, y1 = min(W, x0 + W // 2 + 200), min(H, y0 + H // 2 + 200)
    t = run(im.crop((x0, y0, x1, y1)))
    acc[y0:y1, x0:x1] += t; wsum[y0:y1, x0:x1] += 1
tiles = acc / np.maximum(wsum, 1)
core = np.minimum(m, np.maximum(tiles, m * 0.6))
# luminance refinement in the uncertain band: wool is near-black, the wood behind is lighter
L = np.asarray(im.convert('L'), dtype=np.float32)
hard = core > 0.5
band = np.asarray(Image.fromarray((hard * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(15)), dtype=bool) & ~np.asarray(Image.fromarray((hard * 255).astype(np.uint8)).filter(ImageFilter.MinFilter(15)), dtype=bool)
lum_alpha = np.clip((120 - L) / 60, 0, 1)
alpha = hard.astype(np.float32)
alpha[band] = np.clip(0.5 * core[band] + 0.5 * lum_alpha[band] * (core[band] > 0.15), 0, 1)
a = Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.8))
np.save('raw/alpha.npy', np.asarray(a))
rgba = im.copy(); rgba.putalpha(a); rgba.save('raw/jacket_cutout.png')
prev = Image.new('RGB', im.size, (233, 228, 218)); prev.paste(im, mask=a); prev.save('raw/jacket_preview.jpg', quality=90)
# zoomed edge check

print(im.size)
