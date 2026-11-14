import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";

// PLUMA 650 (versión render): corte transversal de una cámara de pluma. Una línea con tirador barre de izquierda a derecha:
// todo lo que queda a su izquierda se comprime (las telas se juntan, la pluma se aplasta y pierde el brillo cálido,
// el aire caliente sale en partículas naranjas); al volver, la pluma rebota y el aire vuelve a quedar atrapado.
// down-expanded.png = render 1408×768 de la cámara expandida. La compresión se arma cortándolo en franjas verticales:
// cada franja separa tela superior / pluma / tela inferior y mueve o escala cada parte.
const BG = "#222224"; // fondo del render: sin costuras alrededor de la imagen
const IMG = { w: 1408, h: 768 };
const Y_TOP = 226; // borde inferior de la tela superior (px del render)
const Y_BOT = 550; // borde superior de la tela inferior
const SQUEEZE = 105; // cuánto baja / sube cada tela con compresión total (la pluma queda en ~35 % de su alto)
const SLICE = 4; // ancho de franja: con la rampa de 280 px cada escalón es de ~1.5 px
const RAMP = 280; // ancho de la zona de transición a la izquierda de la línea
const LINE_MIN = 60;
const LINE_MAX = 780;
const CORE_MID = (Y_TOP + Y_BOT) / 2;

const ease = Easing.bezier(0.65, 0, 0.35, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// posición de la línea (px del cuadro): reposo → comprime → sostiene → libera → reposo (loop limpio)
const linePos = (f: number) => interpolate(f, [24, 120, 150, 225], [LINE_MIN, LINE_MAX, LINE_MAX, LINE_MIN], { ...clamp, easing: ease });
// compresión 0..1 de una columna en x (px del cuadro) para una línea en L
const squeezeAt = (x: number, L: number) => {
  const t = Math.min(1, Math.max(0, (L - x) / RAMP));
  return t * t * (3 - 2 * t);
};
// primer frame en [from, to) en que la condición se cumple (las curvas son fijas: se calcula una vez)
const firstFrame = (from: number, to: number, ok: (f: number) => boolean) => {
  for (let f = from; f < to; f++) if (ok(f)) return f;
  return Infinity;
};
const releaseCache = new Map<number, number>(); // x de columna → frame en que la línea la suelta
const releaseOf = (fx: number) => {
  if (!releaseCache.has(fx)) releaseCache.set(fx, firstFrame(150, 300, (f) => squeezeAt(fx, linePos(f)) < 0.02));
  return releaseCache.get(fx)!;
};

export const DownReal = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const S = 1; // escala del render: la cámara cruza todo el ancho y los extremos se recortan
  const ox = (width - IMG.w * S) / 2;
  const oy = height / 2 - CORE_MID * S - 20;
  const L = linePos(frame);

  // rebote al liberar: cada columna, desde que la línea la suelta, pasa un poco de su altura y se asienta
  const squeeze = (imgX: number) => {
    const fx = ox + imgX * S;
    const c = squeezeAt(fx, L);
    const tr = releaseOf(fx);
    const k = frame - tr;
    const bounce = k > 0 && Number.isFinite(tr) ? -0.09 * Math.exp(-k / 9) * Math.sin(k * 0.32) : 0;
    return c + bounce;
  };

  const slices = Array.from({ length: Math.ceil(IMG.w / SLICE) }, (_, i) => {
    const x0 = i * SLICE;
    const c = squeeze(x0 + SLICE / 2);
    const d = SQUEEZE * c;
    const s = (Y_BOT - Y_TOP - 2 * d) / (Y_BOT - Y_TOP);
    const img = (top: number) => (
      <Img src={staticFile("ref/down-expanded.png")} style={{ position: "absolute", left: -x0, top: -top, width: IMG.w, height: IMG.h }} />
    );
    const cut = { position: "absolute", left: 0, width: SLICE + 1, overflow: "hidden" } as const;
    const cc = Math.max(0, c);
    return (
      <div key={i} style={{ position: "absolute", left: x0, top: 0, width: SLICE + 1, height: IMG.h }}>
        <div style={{ ...cut, top: 0, height: Y_TOP, transform: `translateY(${d}px)` }}>{img(0)}</div>
        <div
          style={{
            ...cut, top: Y_TOP, height: Y_BOT - Y_TOP, transformOrigin: "50% 0", transform: `translateY(${d}px) scaleY(${s})`,
            filter: `saturate(${1 - 0.75 * cc}) brightness(${1 - 0.1 * cc})`, // sin aire caliente: la pluma queda blanca y densa
          }}
        >
          {img(Y_TOP)}
        </div>
        <div style={{ ...cut, top: Y_BOT, height: IMG.h - Y_BOT, transform: `translateY(${-d}px)` }}>{img(Y_BOT)}</div>
      </div>
    );
  });

  // aire caliente atrapado: partículas naranjas dentro de la pluma. Al comprimirse su columna salen expulsadas
  // a través de la tela (arriba o abajo, derivando a la izquierda) y se apagan; al liberarse vuelven a encenderse.
  const particles = PARTICLES.map((p, i) => {
    const fx = ox + p.x * S;
    const tc = firstFrame(24, 150, (f) => squeezeAt(fx, linePos(f)) > 0.45);
    const tr = firstFrame(150, 300, (f) => squeezeAt(fx, linePos(f)) < 0.3);
    const drift = Math.sin((frame / 270) * Math.PI * 2 * p.k + p.phase) * 4;
    const c = Math.max(0, squeeze(p.x));
    const d = SQUEEZE * c;
    const s = (Y_BOT - Y_TOP - 2 * d) / (Y_BOT - Y_TOP);
    let x = p.x + drift;
    let y = Y_TOP + d + (p.y - Y_TOP) * s + Math.cos((frame / 270) * Math.PI * 2 * p.k + p.phase) * 3;
    let o = 1;
    if (frame >= tc && frame < tr) {
      const a = frame - tc; // edad desde la expulsión
      const up = p.y < CORE_MID ? -1 : 1;
      x += -p.vx * a;
      y += up * (p.vy * a + 0.04 * a * a);
      o = interpolate(a, [0, 6, 40], [1, 1, 0], clamp);
    } else if (frame >= tr) {
      o = interpolate(frame - tr, [0, 24], [0, 1], clamp);
    }
    if (o <= 0) return null;
    return (
      <g key={i} opacity={o * p.peak}>
        <circle cx={x} cy={y} r={p.r * 3.2} fill="#FF8A2B" opacity={0.18} />
        <circle cx={x} cy={y} r={p.r} fill="#FFB26B" />
      </g>
    );
  });

  // texto mínimo y en inglés (sirve igual en /es y /en): cada lado de la línea se nombra; el izquierdo aparece cuando hay zona comprimida que leer
  const leftOn = interpolate(L, [260, 420], [0, 1], clamp);
  const arrowX = Math.max(LINE_MIN, (ox + 120 + (L - RAMP)) / 2);
  const arrowC = squeezeAt(arrowX, L);
  const bandTop = oy + 118 * S; // tope de la tela superior en reposo
  const tipY = bandTop + SQUEEZE * S * arrowC - 14;
  const label = (size: number, color: string, weight = 400) => ({ fontFamily: theme.mono, fontSize: size, color, fontWeight: weight, letterSpacing: "0.06em", margin: 0 });

  return (
    <AbsoluteFill style={{ backgroundColor: BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", left: ox, top: oy, width: IMG.w, height: IMG.h, transform: `scale(${S})`, transformOrigin: "0 0" }}>
        {slices}
        <svg width={IMG.w} height={IMG.h} style={{ position: "absolute", overflow: "visible" }}>{particles}</svg>
      </div>

      {/* encabezado */}
      <div style={{ position: "absolute", left: 64, top: 64, display: "flex", flexDirection: "column", gap: 10 }}>
        <p style={label(20, theme.nieve, 500)}>650 FP</p>
      </div>

      {/* presión: flecha que baja sobre la zona comprimida */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: leftOn }}>
        <g stroke={theme.nieve} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${arrowX} ${tipY - 110} L${arrowX} ${tipY}`} />
          <path d={`M${arrowX - 16} ${tipY - 18} L${arrowX} ${tipY} L${arrowX + 16} ${tipY - 18}`} />
        </g>
        <text x={arrowX + 26} y={tipY - 80} fill={theme.lineaTenue} fontFamily={theme.mono} fontSize={16} letterSpacing="1.5">PRESSURE</text>
      </svg>

      {/* línea divisoria con tirador */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0 }}>
        <path d={`M${L} 210 L${L} ${height - 330}`} stroke={theme.nieve} strokeWidth={4} />
        <circle cx={L} cy={oy + CORE_MID * S} r={30} fill={BG} stroke={theme.nieve} strokeWidth={3} />
        <g stroke={theme.nieve} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${L - 7} ${oy + CORE_MID * S - 9} L${L - 15} ${oy + CORE_MID * S} L${L - 7} ${oy + CORE_MID * S + 9}`} />
          <path d={`M${L + 7} ${oy + CORE_MID * S - 9} L${L + 15} ${oy + CORE_MID * S} L${L + 7} ${oy + CORE_MID * S + 9}`} />
        </g>
      </svg>

      {/* leyendas a cada lado */}
      <div style={{ position: "absolute", left: 64, top: 940, maxWidth: 420, display: "flex", flexDirection: "column", gap: 12, opacity: leftOn }}>
        <p style={label(28, theme.nieve, 500)}>COMPRESSED</p>
      </div>
      <div style={{ position: "absolute", right: 64, top: 940, maxWidth: 420, display: "flex", flexDirection: "column", gap: 12, textAlign: "right" }}>
        <p style={label(28, theme.nieve, 500)}>EXPANDED</p>
      </div>

      {/* grano fino de cámara */}
      <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: 0.06, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};

// posiciones en px del render, dentro de la pluma y del tramo visible del cuadro
const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  x: 190 + random(`px${i}`) * 1030,
  y: Y_TOP + 30 + random(`py${i}`) * (Y_BOT - Y_TOP - 60),
  r: 1.6 + random(`pr${i}`) * 2.2,
  peak: 0.55 + random(`po${i}`) * 0.45,
  k: 1 + Math.floor(random(`pk${i}`) * 2), // 1 o 2 vueltas por loop: deriva periódica, loop limpio
  phase: random(`pp${i}`) * Math.PI * 2,
  vx: 0.6 + random(`pvx${i}`) * 1.4,
  vy: 1.8 + random(`pvy${i}`) * 2,
}));
