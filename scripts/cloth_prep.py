import numpy as np, cv2
from PIL import Image
im = np.asarray(Image.open('raw/cloth.jpg').convert('RGB')).copy()
r, g, b = [im[..., i].astype(int) for i in range(3)]
# the selvedge lettering is yellow/gold on a dark band: paint it out
ink = ((r > 120) & (g > 95) & (b < 110) & (r - b > 55)).astype(np.uint8) * 255
ink = cv2.dilate(ink, np.ones((9, 9), np.uint8))
print('ink px', int((ink > 0).sum()))
clean = cv2.inpaint(im, ink, 9, cv2.INPAINT_TELEA)
H, W = clean.shape[:2]
x0 = (W - H) // 2
sq = Image.fromarray(clean[:, x0:x0 + H])
sq.resize((1800, 1800), Image.LANCZOS).save('raw/cloth_sq.png')


