# Prepara el macro de rodilla AW04: recorta 3 granos como sprites (alfa por luminancia) y tapa su sitio con relieve limpio.
# Uso (desde apps/motion): uv run --no-project --with opencv-python-headless --with pillow --with numpy python scripts/prep-knee-macro.py
import numpy as np, cv2
from PIL import Image
im = np.array(Image.open('public/ref/aw04-knee-macro.png').convert('RGB')).astype(np.float32)
L = im.mean(2); H, W = L.shape
GRAINS = [(842, 490, 17), (927, 385, 16), (815, 577, 13)]  # (cx, cy, r) en px del render
grit = L > 170  # gravilla = píxeles claros; los brillos del relieve quedan por debajo
out = im.copy()
for i, (x, y, r) in enumerate(GRAINS):
    R = r + 6
    yy, xx = np.mgrid[-R:R, -R:R]; d = np.sqrt(xx**2 + yy**2)
    crop = im[y-R:y+R, x-R:x+R]
    # máscara del grano: zona clara + cierre + relleno de huecos (la cara en sombra queda dentro), solo la mancha central
    m = ((crop.mean(2) > 112) & (d < r + 1)).astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    n, lab = cv2.connectedComponents(m); m = (lab == lab[R, R]).astype(np.uint8) if lab[R, R] else (lab == np.bincount(lab.ravel())[1:].argmax() + 1).astype(np.uint8)
    cnt, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE); m = cv2.drawContours(np.zeros_like(m), cnt, -1, 1, -1)
    a = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)
    Image.fromarray(np.dstack([crop, a * 255]).astype(np.uint8)).save(f'public/ref/grit-{i}.png')
    # parche limpio más parecido en el anillo exterior, buscando alrededor (sin gravilla dentro)
    ring = (d > r + 2) & (d < R); hole = d <= r + 3
    best = None
    S = (120, 120, 70)[i]  # el 3.º busca cerca: más lejos el relieve cambia de escala con la perspectiva
    for dy in range(-S, S + 1, 2):
        for dx in range(-S, S + 1, 2):
            sx, sy = x + dx, y + dy
            if dx*dx + dy*dy < (2*R)**2 or sx-R < 0 or sy-R < 0 or sx+R > W or sy+R > H: continue
            if grit[sy-R:sy+R, sx-R:sx+R][d < R].any(): continue
            src = im[sy-R:sy+R, sx-R:sx+R]
            c = ((src[ring] - crop[ring])**2).sum()
            if best is None or c < best[0]: best = (c, sx, sy)
    _, sx, sy = best
    al = np.clip((r + 5 - d) / 3, 0, 1)[..., None]
    src = im[sy-R:sy+R, sx-R:sx+R]
    src = src + (crop[ring].mean(0) - src[ring].mean(0))  # mismo brillo que el entorno
    out[y-R:y+R, x-R:x+R] = src * al + out[y-R:y+R, x-R:x+R] * (1 - al)
    print(i, (x, y), '<-', (sx, sy))
Image.fromarray(out.astype(np.uint8)).save('public/ref/aw04-knee-dry.png')
