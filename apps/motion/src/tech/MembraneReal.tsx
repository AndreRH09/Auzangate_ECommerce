import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// MEMBRANA 20K (versión render): el render de las tres capas se recorta en piezas y se anima de verdad (sin crossfade):
// cerrado y seco → se abre en vista explosionada → caen gotas, hacen perla sobre el nylon y ruedan fuera →
// el vapor sube desde el forro y atraviesa las capas → se cierra (vuelve al primer frame).
// membrane-dry.png = el render sin sus gotas (inpainting); las perlas son sprites recortados de las gotas reales del render.
// Coordenadas en px del render (1024×1024). Las partes ocultas de cada capa contienen píxeles de la de encima,
// pero siempre quedan tapadas: los desplazamientos de cierre (85 / 105 px) son menores que el margen entre bordes traseros.
const BG = "#191D1E"; // fondo del render: así los recortes no dejan costura
type Pt = [number, number];
const TOP: Pt[] = [[148, 398], [500, 238], [868, 382], [516, 578]]; // izq, fondo, der, frente
const MID: Pt[] = [[151, 497], [505, 332], [864, 490], [507, 694]];
const BOT: Pt[] = [[154, 616], [501, 444], [858, 600], [512, 806]];
const CLOSE = { top: 85, bot: -105 }; // desplazamiento en estado cerrado (relativo a la membrana, que no se mueve)
const SPRITES = [21, 20, 21, 18]; // radio (px) de public/ref/drop-N.png

const clip = (q: Pt[]) => `polygon(${q.map(([x, y]) => `${x}px ${y}px`).join(",")})`;
// punto dentro del cuadrilátero (u: izq→der, v: fondo→frente)
const inQuad = ([l, t, r, b]: Pt[], u: number, v: number): Pt => {
  const a: Pt = [t[0] + (r[0] - t[0]) * u, t[1] + (r[1] - t[1]) * u];
  const c: Pt = [l[0] + (b[0] - l[0]) * u, l[1] + (b[1] - l[1]) * u];
  return [a[0] + (c[0] - a[0]) * v, a[1] + (c[1] - a[1]) * v];
};
const inside = (q: Pt[], [x, y]: Pt) =>
  q.every((a, i) => {
    const b = q[(i + 1) % q.length];
    return (b[0] - a[0]) * (y - a[1]) - (b[1] - a[1]) * (x - a[0]) >= 0;
  });

// gotas: impacto → perla → reposo → rueda hacia el borde frontal acelerando → cae y se va. Todas fuera antes del cierre (185).
const FALL = 14;
const DOWN: Pt = [(TOP[3][0] - TOP[1][0]) / 336, (TOP[3][1] - TOP[1][1]) / 336]; // dirección fondo→frente del nylon
const DROPS = Array.from({ length: 8 }, (_, i) => {
  const hit = 80 + i * 6 + Math.floor(random(`da${i}`) * 4);
  const p = inQuad(TOP, 0.2 + random(`du${i}`) * 0.6, 0.15 + random(`dv${i}`) * 0.45);
  const ang = (random(`dg${i}`) - 0.5) * 0.7; // cada perla rueda con un ángulo algo distinto
  const dir: Pt = [DOWN[0] * Math.cos(ang) - DOWN[1] * Math.sin(ang), DOWN[0] * Math.sin(ang) + DOWN[1] * Math.cos(ang)];
  let dist = 0;
  while (inside(TOP, [p[0] + dir[0] * dist, p[1] + dir[1] * dist])) dist++; // distancia hasta el borde
  const roll = hit + 12 + Math.floor(random(`dw${i}`) * 10);
  const exit = 168 + Math.floor(random(`de${i}`) * 10); // sale por el borde aquí
  return { hit, p, dir, dist, roll, exit, sprite: i % 4, size: 0.45 + random(`ds${i}`) * 0.45 };
});

const STEAM = Array.from({ length: 110 }, (_, i) => ({
  born: 104 + Math.floor(random(`sb${i}`) * 56), // nace ≤160 y vive ≤70: todo el vapor se fue antes del frame 240 (loop limpio)
  life: 45 + Math.floor(random(`sl${i}`) * 25),
  p: inQuad(BOT, 0.1 + random(`su${i}`) * 0.8, 0.15 + random(`sv${i}`) * 0.7),
  speed: 4.5 + random(`ss${i}`) * 3.5,
  r: 0.8 + random(`sr${i}`) * 1.6,
  phase: random(`sp${i}`) * Math.PI * 2,
  peak: 0.45 + random(`so${i}`) * 0.45,
}));

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export const MembraneReal = () => {
  const frame = useCurrentFrame();
  const { width, height, durationInFrames } = useVideoConfig();

  // c: 0 cerrado, 1 abierto
  const c = interpolate(frame, [30, 75, 185, 230], [0, 1, 1, 0], { ...clamp, easing: ease });
  const float = (k: number) => Math.sin((frame / durationInFrames) * Math.PI * 2 * 2 + k) * 2.5 * c; // leve flotación con las capas abiertas
  const dy = { top: CLOSE.top * (1 - c) + float(0), mid: float(1.2), bot: CLOSE.bot * (1 - c) + float(2.4) };

  const s = height / 1024; // cubre el alto; los lados sobrantes se recortan
  const zoom = 1 + 0.035 * Math.sin((frame / durationInFrames) * Math.PI); // push-in lento que vuelve a 1 en el loop

  const layer = (q: Pt[], y: number) => (
    <Img
      src={staticFile("ref/membrane-dry.png")}
      style={{ position: "absolute", width: 1024, height: 1024, clipPath: clip(q), transform: `translateY(${y}px)` }}
    />
  );

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", width: 1024, height: 1024,
          left: width / 2 - 512, top: height / 2 - 470, // centro del bloque de capas en el centro del cuadro
          transform: `scale(${s * zoom})`, transformOrigin: "512px 470px",
        }}
      >
        {layer(BOT, dy.bot)}
        {layer(MID, dy.mid)}
        {layer(TOP, dy.top)}

        {/* perlas sobre el nylon: sprite real de gota del render */}
        {DROPS.map((d, i) => {
          if (frame < d.hit) return null;
          const t = frame - d.roll;
          const along = t <= 0 ? 0 : d.dist * Math.min(1, (t / (d.exit - d.roll)) ** 2); // aceleración constante
          const fallT = frame - d.exit; // tras salir del borde: cae y se desvanece
          if (fallT > 10) return null;
          const off = fallT > 0 ? 0.5 * 1.1 * fallT * fallT : 0;
          const x = d.p[0] + d.dir[0] * along;
          const y = d.p[1] + d.dir[1] * along + dy.top + off;
          // impacto: se aplasta y rebota hasta la perla
          const k = frame - d.hit;
          const sx = interpolate(k, [0, 3, 7, 11], [1.45, 0.9, 1.06, 1], clamp);
          const sy = interpolate(k, [0, 3, 7, 11], [0.5, 1.12, 0.96, 1], clamp);
          const R = SPRITES[d.sprite];
          return (
            <Img
              key={i}
              src={staticFile(`ref/drop-${d.sprite}.png`)}
              style={{
                position: "absolute", width: R * 2, height: R * 2, left: x - R, top: y - R,
                transform: `scale(${d.size * sx}, ${d.size * sy})`, transformOrigin: "50% 75%",
                opacity: fallT > 0 ? 1 - fallT / 10 : 1,
              }}
            />
          );
        })}

        <svg width={1024} height={1024} style={{ position: "absolute", overflow: "visible" }}>
          {/* vapor: partículas finas y nítidas que salen del forro, atraviesan la membrana y siguen subiendo */}
          {STEAM.map((p, i) => {
            const age = frame - p.born;
            if (age < 0 || age > p.life) return null;
            const o = p.peak * interpolate(age, [0, 8, p.life - 15, p.life], [0, 1, 1, 0], clamp);
            const x = p.p[0] + Math.sin(age * 0.09 + p.phase) * 7;
            const y = p.p[1] + dy.bot - age * p.speed;
            const r = p.r * (1 + (age / p.life) * 0.6);
            return (
              <g key={i} opacity={o}>
                <ellipse cx={x} cy={y} rx={r * 2.6} ry={r * 4} fill="#DCE4E8" opacity={0.12} />
                <ellipse cx={x} cy={y} rx={r} ry={r * 2.2} fill="#E8EEF1" />
              </g>
            );
          })}

          {/* gotas en el aire y salpicadura al impacto */}
          {DROPS.map((d, i) => {
            const t = frame - (d.hit - FALL);
            if (t < 0 || t > FALL + 12) return null;
            const [x, y0] = d.p;
            const y = y0 + dy.top;
            const r = 5 * d.size + 2;
            if (t < FALL) {
              const fy = interpolate(t, [0, FALL], [y - 460, y - r], { easing: Easing.in(Easing.quad) });
              return (
                <g key={i}>
                  <ellipse cx={x} cy={fy} rx={r * 0.8} ry={r * 1.5} fill="#C9D6DE" opacity={0.85} />
                  <circle cx={x - r * 0.25} cy={fy - r * 0.6} r={r * 0.28} fill="#FFF" />
                </g>
              );
            }
            const st = t - FALL;
            return (
              <g key={i} opacity={1 - st / 12}>
                {[0, 1, 2].map((k) => {
                  const vx = (k - 1) * (1.6 + random(`sx${i}${k}`)) + 0.3;
                  const vy = -2.6 - random(`sy${i}${k}`) * 1.5;
                  const sr = r * 0.3;
                  return <circle key={k} cx={x + vx * st} cy={y - r * 0.4 + vy * st + 0.35 * st * st} r={sr} fill="#D2DEE5" opacity={0.9} />;
                })}
              </g>
            );
          })}
        </svg>
      </div>

      {/* grano fino de cámara */}
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.06, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
