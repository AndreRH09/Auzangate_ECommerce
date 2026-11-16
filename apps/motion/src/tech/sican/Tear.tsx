import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { PATCH } from "./Patch";

// SICÁN · ACABADOS 02 y 03: comparación A/B de la misma rasgadura (estilo "tech lab": macro de tela con luz rasante
// + capa 2D fina de tensión, impacto y frentes). Misma cámara, mismo enganche y mismo ritmo hasta 4.2 s:
//   ripstop=false → tela común: el frente sigue de largo, sale del cuadro y la abertura se agranda.
//   ripstop=true  → ripstop fino: el frente choca con el hilo de refuerzo, se frena en seco y la tensión se reparte por la retícula.
// Sin texto. Misma duración que el bordado (PATCH); funde a negro puro.
export const TEAR = PATCH;

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const C = 540; // enganche, centrado entre los dos refuerzos
const LEFT = 360;
const RIGHT = 720;
const Y0 = 540;
const RUN0 = 1.3; // empieza a correr
const HIT = 4.2; // llega a los refuerzos
const SEG = 30; // largo de cada tramo del zigzag
const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

// zigzag del tafetán abriéndose hilo a hilo (de -120 a 1200 para que en la tela común salga del cuadro)
const PTS = Array.from({ length: Math.round(1320 / SEG) + 1 }, (_, i) => {
  const x = -120 + i * SEG;
  return { x, y: Y0 + (i % 2 ? 9 : -9) + (rnd(i) - 0.5) * 12 };
});

export const Tear = ({ ripstop }: { ripstop: boolean }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const s = frame / fps;

  // frente: acelera (cuadrático) desde el enganche; en 4.2 s está justo en los refuerzos
  const u = Math.max(0, (s - RUN0) / (HIT - RUN0));
  const free = (RIGHT - 4 - C) * u * u;
  const back = ripstop && s > HIT ? Math.exp(-7 * (s - HIT)) * Math.sin(2 * Math.PI * 2.6 * (s - HIT)) * 6 : 0; // micro-rebote
  const reach = ripstop ? Math.min(free, RIGHT - 4 - C) - back : free;
  const r = C + reach;
  const l = C - reach;
  const moving = ripstop ? s > RUN0 && s < HIT + 0.15 : s > RUN0 && r < width + 140;

  const hole = interpolate(s, [0.8, 1.3], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const hit = ripstop ? interpolate(s, [HIT - 0.05, HIT + 0.1, 5.8], [0, 1, 0.3], cl) : 0;
  // abertura máxima: en la tela común la tela cede y se abre cada vez más
  const maxOpen = ripstop ? 13 : interpolate(s, [HIT, 7.6], [13, 34], { ...cl, easing: Easing.out(Easing.quad) });

  const open = (x: number) => {
    if (x < l || x > r) return 0;
    const fromTip = Math.min(x - l, r - x);
    return (Math.min(maxOpen, fromTip * 0.075) + (Math.abs(x - C) < 20 ? 5 : 0)) * hole;
  };
  // puntos vivos + los frentes exactos (para que el corte termine en punta donde está el frente)
  const live = [{ x: l, y: Y0 }, ...PTS.filter((q) => q.x > l && q.x < r), { x: r, y: Y0 }];
  const top = live.map((q) => `${q.x.toFixed(1)},${(q.y - open(q.x)).toFixed(1)}`).join(" ");
  const bot = [...live].reverse().map((q) => `${q.x.toFixed(1)},${(q.y + open(q.x)).toFixed(1)}`).join(" ");
  const lip = live.map((q) => `${q.x.toFixed(1)},${(q.y - open(q.x) - 2.2).toFixed(1)}`).join(" ");

  // cámara: igual en ambas hasta el choque; luego el ripstop se acerca al frente detenido y la tela común se abre de plano
  const zA = interpolate(s, [0, HIT], [1.0, 1.12], cl);
  const zoom = ripstop
    ? zA + interpolate(s, [HIT, 6.6], [0, 0.38], { ...cl, easing: Easing.inOut(Easing.sin) })
    : zA - interpolate(s, [HIT, 6.6], [0, 0.1], { ...cl, easing: Easing.inOut(Easing.sin) });
  const fx = ripstop ? interpolate(s, [HIT, 6.6], [540, 670], { ...cl, easing: Easing.inOut(Easing.sin) }) : 540;
  // micro-sacudida del encuadre en el impacto (solo ripstop)
  const shake = ripstop && s > HIT ? Math.exp(-10 * (s - HIT)) * Math.sin(s * 90) * 2.5 : 0;

  // luz de cierre: una banda rasante recorre la tela
  const sweep = interpolate(s, [6.0, 7.6], [-0.4, 1.4], { ...cl, easing: Easing.inOut(Easing.sin) });
  const fade = interpolate(s, [7.7, 8.1], [0, 1], cl);

  // capa 2D: líneas de tensión que se pinzan hacia el frente
  const tensionOn = interpolate(s, [1.2, 1.6], [0, 1], cl) * (ripstop ? interpolate(s, [HIT, HIT + 0.5], [1, 0], cl) : interpolate(s, [5.6, 6.6], [1, 0], cl));
  const tension = (base: number) => {
    const pts: string[] = [];
    for (let x = -200; x <= width + 200; x += 12) {
      const pinch = (tip: number) => Math.exp(-((x - tip) ** 2) / (2 * 70 ** 2));
      const k = 0.22 * Math.max(pinch(r), pinch(l)) * hole;
      pts.push(`${x},${(base + (Y0 - base) * k).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  const ring = (t0: number, max: number) => {
    const p = interpolate(s, [t0, t0 + 0.8], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
    return p > 0 && p < 1 ? <circle cx={C} cy={Y0} r={max * p} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={1 - p} /> : null;
  };

  const yarn = (x1: number, y1: number, x2: number, y2: number, key: string, glow = 0) => (
    <g key={key}>
      <line x1={x1 + 2} y1={y1 + 3} x2={x2 + 2} y2={y2 + 3} stroke="#000" strokeWidth={10} opacity={0.65} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#2B2C2F" strokeWidth={9} />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#yarnTwist)" strokeWidth={9} opacity={0.5} />
      <line x1={x1 - 2} y1={y1 - 2} x2={x2 - 2} y2={y2 - 2} stroke="#8A8C90" strokeWidth={1.6} opacity={0.5 + 0.5 * glow} />
      {glow > 0 && <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth={8} opacity={0.75 * glow} filter="url(#soft)" />}
    </g>
  );

  // pulsos de carga que viajan por los refuerzos desde el punto de choque
  const pulses = ripstop && s > HIT
    ? [LEFT, RIGHT].flatMap((x) => [0, 0.35].flatMap((d) => {
        const t = s - HIT - d;
        if (t < 0) return [];
        const y = 520 * t;
        const o = Math.exp(-1.6 * t);
        return [-1, 1].map((dir) => (
          <g key={`${x}${d}${dir}`} opacity={o}>
            <line x1={x} y1={Y0 + dir * y} x2={x} y2={Y0 + dir * (y + 110)} stroke="#FFFFFF" strokeWidth={14} opacity={0.7} filter="url(#soft)" />
            <line x1={x} y1={Y0 + dir * y} x2={x} y2={Y0 + dir * (y + 110)} stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" />
          </g>
        ));
      }))
    : null;

  const grid = [-360, 0, 360, 720, 1080, 1440];

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%">
        <defs>
          {/* tafetán fino: urdimbre y trama con un brillo mínimo en cada cruce */}
          <pattern id="weave" width="6" height="6" patternUnits="userSpaceOnUse">
            <rect width="6" height="6" fill="#121214" />
            <path d="M0 1.5 H6" stroke="#232327" strokeWidth="1.4" />
            <path d="M4.5 0 V6" stroke="#1C1C20" strokeWidth="1.2" />
            <rect x="0" y="1" width="2" height="0.8" fill="#2E2E33" />
          </pattern>
          <pattern id="yarnTwist" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
            <path d="M0 0 V8" stroke="#45464B" strokeWidth="2" />
          </pattern>
          <linearGradient id="rake" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
            <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0.35">
            <stop offset={Math.max(0, sweep - 0.12)} stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFFFFF" stopOpacity="0.1" />
            <stop offset={Math.min(1, sweep + 0.12)} stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.72">
            <stop offset="0.5" stopColor="#000" stopOpacity="0" />
            <stop offset="1" stopColor="#000" stopOpacity="0.85" />
          </radialGradient>
          {/* región en userSpace: con objectBoundingBox una línea recta (bbox de ancho 0) no se dibuja */}
          <filter id="soft" filterUnits="userSpaceOnUse" x={-500} y={-500} width={2100} height={2100}><feGaussianBlur stdDeviation="3" /></filter>
          <filter id="tipGlow"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        </defs>

        <g transform={`translate(${width / 2 + shake} ${height / 2}) scale(${zoom}) translate(${-fx} ${-height / 2})`}>
          <rect x={-400} y={-400} width={width + 800} height={height + 800} fill="url(#weave)" />

          {/* rasgadura: vacío negro, labio superior levantado que toma la luz, fibras sueltas que flotan */}
          {hole > 0 && (
            <g>
              <polygon points={`${top} ${bot}`} fill="#000" />
              <polyline points={lip} fill="none" stroke="#6E7075" strokeWidth={1.2} opacity={0.55} />
              <polyline points={top} fill="none" stroke="#55565A" strokeWidth={1.6} />
              <polyline points={bot} fill="none" stroke="#38393D" strokeWidth={1.3} />
              {live.map((q, i) => {
                const o = open(q.x);
                if (o < 3 || i % 2) return null;
                const up = (i / 2) % 2 === 0;
                const len = 10 + rnd(q.x) * 18;
                const sway = Math.sin(s * 2.2 + q.x * 0.05) * 3;
                const y = up ? q.y - o : q.y + o;
                return <path key={q.x} d={`M${q.x} ${y} q ${sway} ${(up ? len : -len) * 0.5} ${(rnd(q.x + 3) - 0.5) * 12 + sway} ${up ? len : -len}`} fill="none" stroke="#9A9CA0" strokeWidth={0.9} opacity={0.8} />;
              })}
            </g>
          )}

          {/* retícula de refuerzo (solo ripstop): hilos gruesos en relieve; los que frenan la rasgadura se encienden */}
          {ripstop && (
            <g>
              {grid.map((y) => yarn(-400, y, width + 400, y, `h${y}`))}
              {grid.map((x) => yarn(x, -400, x, height + 400, `v${x}`, x === LEFT || x === RIGHT ? hit : 0))}
              {pulses}
              {/* fruncido de tensión junto al refuerzo derecho */}
              {hit > 0 && [-1, 0, 1].map((k) => (
                <path key={k} d={`M${RIGHT - 10 - k * 7} ${Y0 - 40 + k * 4} q -6 40 0 80`} fill="none" stroke="#6E7075" strokeWidth={1} opacity={0.5 * hit} />
              ))}
            </g>
          )}

          {/* capa 2D: tensión, impacto y frentes */}
          <g opacity={tensionOn}>
            {[-180, -110, -55, 55, 110, 180].map((d) => (
              <polyline key={d} points={tension(Y0 + d)} fill="none" stroke="#FFFFFF" strokeWidth={1} opacity={0.22 - Math.abs(d) * 0.0006} />
            ))}
          </g>
          {ring(0.8, 110)}
          {ring(1.0, 170)}
          {ripstop && s > HIT && [LEFT, RIGHT].map((x) => {
            const p = interpolate(s, [HIT, HIT + 0.7], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
            return p < 1 ? <circle key={x} cx={x} cy={Y0} r={14 + 60 * p} fill="none" stroke="#FFFFFF" strokeWidth={1.5} opacity={1 - p} /> : null;
          })}
          {moving && [l, r].map((x, i) => (
            <g key={i}>
              <circle cx={x} cy={Y0} r={10} fill="#FFFFFF" opacity={0.5} filter="url(#tipGlow)" />
              <circle cx={x} cy={Y0} r={3.5} fill="#FFFFFF" />
            </g>
          ))}

          <rect x={-400} y={-400} width={width + 800} height={height + 800} fill="url(#rake)" />
          <rect x={-400} y={-400} width={width + 800} height={height + 800} fill="url(#sweep)" />
        </g>
        <rect width={width} height={height} fill="url(#vig)" />

        <rect width={width} height={height} filter="url(#grain)" opacity={0.07} />
        {fade > 0 && <rect width={width} height={height} fill="#000" opacity={fade} />}
      </svg>
    </AbsoluteFill>
  );
};
