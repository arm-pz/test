import numpy as np, cv2, onnxruntime as ort
from PIL import Image
im = Image.open('raw/suit.jpg').convert('RGB')
rgb = np.asarray(im).astype(np.float32)
H, W = rgb.shape[:2]
# 1) colour key against the flat grey backdrop
bg = np.median(np.concatenate([rgb[:, :200].reshape(-1, 3), rgb[:, -200:].reshape(-1, 3)]), axis=0)
dist = np.sqrt(((rgb - bg) ** 2).sum(2))
chroma = rgb.max(2) - rgb.min(2)
key = np.clip((np.maximum(dist - 18, 0) / 30) + np.clip((chroma - 14) / 20, 0, 1), 0, 1)
# 2) U2-Net as a second opinion, to keep grey-ish fabric highlights in
sess = ort.InferenceSession('raw/u2net.onnx', providers=['CPUExecutionProvider'])
x = np.asarray(im.resize((320, 320), Image.LANCZOS), dtype=np.float32) / 255.0
x = ((x - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]).transpose(2, 0, 1)[None].astype(np.float32)
m = sess.run(None, {sess.get_inputs()[0].name: x})[0][0, 0]
m = (m - m.min()) / (m.max() - m.min())
m = cv2.resize(m, (W, H), interpolation=cv2.INTER_CUBIC)
core = cv2.erode((m > 0.5).astype(np.uint8), np.ones((25, 25), np.uint8)).astype(np.float32)
alpha = np.clip(np.maximum(key * (m > 0.08), core), 0, 1)
# clean speckle in the backdrop, then a hairline feather
hard = (alpha > 0.5).astype(np.uint8)
n, lab, stats, _ = cv2.connectedComponentsWithStats(hard, 8)
keep = np.zeros_like(hard)
for i in range(1, n):
    if stats[i, cv2.CC_STAT_AREA] > 20000: keep[lab == i] = 1
alpha = alpha * cv2.dilate(keep, np.ones((5, 5), np.uint8))
alpha = cv2.GaussianBlur(alpha, (0, 0), 0.9)
# despill: pull grey backdrop out of semi-transparent edge pixels
a3 = alpha[..., None]
fg = np.where(a3 > 0.05, (rgb - (1 - a3) * bg) / np.maximum(a3, 0.05), rgb)
fg = np.clip(fg, 0, 255)
S = 1800
out = Image.fromarray(np.dstack([fg, alpha * 255]).astype(np.uint8), 'RGBA').resize((S, S), Image.LANCZOS)
out.save('raw/suit_cut.png')
prev = Image.new('RGB', (S, S), (231, 226, 216)); prev.paste(out, mask=out)
prev.resize((900, 900)).save('raw/suit_preview.jpg')

print('ok')
