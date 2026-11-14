# Quita las gotas pintadas del render de la membrana (public/ref/membrane-render.png → membrane-dry.png) y recorta 4 gotas como sprites.
# Uso (desde apps/motion): uv run --no-project --with opencv-contrib-python-headless --with pillow --with numpy python scripts/clean-membrane-render.py
import numpy as np, cv2
from PIL import Image
im = np.array(Image.open('public/ref/membrane-render.png').convert('RGB'))
# (cx, cy, r): gotas sobre el nylon + rayas de salpicadura + la gota sobre la membrana
D = [(420,318,19),(326,360,15),(508,357,21),(585,365,19),(714,386,18),(415,401,19),(507,422,16),(553,425,16),
     (472,469,17),(640,432,9),(533,290,12),(548,309,9),(482,283,7),(502,294,7),(463,338,7),(647,355,6),
     (512,328,9),(634,406,10),(500,245,7),(670,522,9),
     (417,466,6),(505,312,9),(630,382,9),(377,431,4),(370,436,4),(358,440,4),(440,370,5),(357,636,6),(487,688,7)]
mask = np.zeros(im.shape[:2], np.uint8)
for x,y,r in D: cv2.circle(mask,(x+2,y+3),r+6,255,-1)  # incluye la sombra (abajo-derecha)
# base: FSR (respeta cinta/bordes, pero deja la trama algo blanda)
bgr = cv2.cvtColor(im, cv2.COLOR_RGB2BGR); fsr = np.zeros_like(bgr)
cv2.xphoto.inpaint(bgr, 255-mask, fsr, cv2.xphoto.INPAINT_FSR_BEST)
out = cv2.cvtColor(fsr, cv2.COLOR_BGR2RGB).astype(np.float32); img = im.astype(np.float32); H,W = mask.shape; done = set()
# encima: copia de parche con la trama real, solo donde todo (destino y origen) es tela azul de la capa superior
top = np.zeros((H,W),np.uint8); cv2.fillPoly(top,[np.array([[150,400],[500,240],[866,382],[516,576]])],1)
top = cv2.erode(top, np.ones((9,9),np.uint8))
gray = cv2.cvtColor(im, cv2.COLOR_RGB2GRAY)
arr = im.astype(np.int16); sat = arr.max(2)-arr.min(2)
blue = (top>0) & (sat>=26) & (mask==0)  # tela azul saturada; cinta y gotas son grises (sat<28)
blue = cv2.morphologyEx(blue.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((5,5),np.uint8)) > 0  # rellena líneas de trama
for x,y,r in D:
    cx,cy,R = x+2,y+3,r+6
    yy,xx = np.mgrid[-R-8:R+9,-R-8:R+9]; d = np.sqrt(xx**2+yy**2)
    ring = (d>R)&(d<=R+7); area = d<=R+7
    win = lambda X,Y,A: A[Y-R-8:Y+R+9, X-R-8:X+R+9]
    if cy-R-8<0 or cx-R-8<0 or cy+R+9>H or cx+R+9>W or win(cx,cy,blue)[ring].mean() < 0.75: continue  # junto a cinta/borde: queda FSR
    tgt = win(cx,cy,img); best=None
    for dy in range(-90,91,1):
        for dx in range(-90,91,1):
            sx,sy = cx+dx, cy+dy
            if dx*dx+dy*dy < (2*R)**2 or sx-R-8<0 or sy-R-8<0 or sx+R+9>W or sy+R+9>H: continue
            if win(sx,sy,blue)[area].mean() < 0.95: continue
            cost = ((win(sx,sy,img)[ring]-tgt[ring])**2).sum()
            if best is None or cost<best[0]: best=(cost,sx,sy)
    if best is None: continue
    _,sx,sy = best
    al = np.clip((R+3-d)/4,0,1)[...,None]
    o = win(cx,cy,out); o[:] = win(sx,sy,img)*al + o*(1-al)
    print('patch', (x,y), '<-', (sx,sy)); done.add((x,y))
# gotas en el borde de una cinta: el parche se busca desplazándose en paralelo a las cintas (bordes de la capa),
# así el borde cinta/tela queda en el mismo sitio. El cruce de cintas queda con FSR.
V = [np.array([0.931,0.364]), np.array([0.910,-0.414])]
inner = (top>0) & (mask==0)
hp = img - cv2.GaussianBlur(img, (0,0), 2.0)  # solo textura fina (trama), sin color
for x,y,r in D:
    if (x,y) in done or (x,y) in ((508,357),(420,318)) or not top[y,x]: continue  # cruce y la gota junto al borde trasero: solo FSR
    cx,cy,R = x+2,y+3,r+6
    yy,xx = np.mgrid[-R-8:R+9,-R-8:R+9]; d = np.sqrt(xx**2+yy**2)
    ring = (d>R)&(d<=R+7); area = d<=R+7
    win = lambda X,Y,A: A[Y-R-8:Y+R+9, X-R-8:X+R+9]
    tgt = win(cx,cy,img); best=None
    for v in V:
        for t in list(range(2*R,130)) + list(range(-130,-2*R)):
            for perp in (-2,-1,0,1,2):
                sx = int(round(cx + v[0]*t - v[1]*perp)); sy = int(round(cy + v[1]*t + v[0]*perp))
                if sx-R-8<0 or sy-R-8<0 or sx+R+9>W or sy+R+9>H: continue
                if win(sx,sy,inner)[area].mean() < 0.97: continue
                cost = ((win(sx,sy,img)[ring]-tgt[ring])**2).sum()
                if best is None or cost<best[0]: best=(cost,sx,sy)
    if best is None: continue
    _,sx,sy = best
    al = np.clip((R+3-d)/4,0,1)[...,None]
    o = win(cx,cy,out); o[:] = o + win(sx,sy,hp)*al  # FSR conserva color/borde de cinta; se le suma la trama
    print('tape-patch', (x,y), '<-', (sx,sy))
out = out.astype(np.uint8)
Image.fromarray(out).save('public/ref/membrane-dry.png')
# sprites de gota (con su sombra y la tela refractada), máscara circular suave
for i,(x,y,r) in enumerate([(420,318,19),(714,386,18),(585,365,19),(553,425,16)]):
    R = r+2; crop = im[y-R:y+R, x-R:x+R]
    yy,xx = np.mgrid[-R:R,-R:R]; d = np.sqrt(xx**2+yy**2)
    a = np.clip((r - d)/2.5 + 0.5, 0, 1)*255
    Image.fromarray(np.dstack([crop, a.astype(np.uint8)])).save(f'public/ref/drop-{i}.png')
