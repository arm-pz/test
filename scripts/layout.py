import sys, json, math
sys.path.insert(0, 'scripts')
from suit_pieces import T
from PIL import Image, ImageDraw
S = 0.52  # pieces are drawn at this scale on the cloth
# centre (box units), rotation degrees; straight-grain panel = upright, folded panel = turned to its check
LAY = {
  'frontL':  (612, 262, 0),
  'frontR':  (706, 268, 180),
  'sleeveL': (806, 190, 0),
  'sleeveR': (902, 200, 180),
  'vestL':   (862, 640, 0),
  'vestR':   (938, 652, 180),
  'trouserL':(170, 520, -37),
  'trouserR':(318, 820, -37),
}
def centroid(p):
    xs=[a for a,b in p]; ys=[b for a,b in p]
    return (min(xs)+max(xs))/2,(min(ys)+max(ys))/2
def place(p, cx, cy, deg):
    c=centroid(p); r=math.radians(deg)
    out=[]
    for x,y in p:
        lx,ly=(x-c[0])*S,(y-c[1])*S
        out.append((cx+lx*math.cos(r)-ly*math.sin(r), cy+lx*math.sin(r)+ly*math.cos(r)))
    return out
if __name__ == '__main__':
    im=Image.open('raw/cloth_sq.png').convert('RGB').resize((1000,1000)); d=ImageDraw.Draw(im)
    for k,(cx,cy,deg) in LAY.items():
        q=place(T[k],cx,cy,deg); d.line(q+[q[0]],fill=(240,236,226),width=3); d.text((cx-20,cy),k,fill=(255,255,255))
    im.save('raw/layout_preview.jpg')
