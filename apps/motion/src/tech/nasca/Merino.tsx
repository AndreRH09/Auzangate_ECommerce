import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cl, H, NascaFrame, rnd, W } from "./frame";

// NASCA · MERINO 87 % (AN02): corte lateral macro en un día de calor. Abajo la piel suda (gotas con brillo
// especular); el tejido de punto toca las gotas y las bebe: cada una sube como un hilo húmedo por la fibra rizada
// hasta la cara exterior y ahí se va como vapor que el aire caliente ondula. Distinto del merino de Caral
// (vapor que la fibra retiene): aquí el protagonista es el sudor líquido que la fibra saca de la piel.
const SKIN = 860;
const TOP = 560; // cara exterior del punto
const BOT = 830; // cara interior, casi sobre la piel
const ROWS = 5;
const DROPS = [0, 1, 2, 3, 4, 5, 6].map((i) => ({
  x: 470 + i * 132 + (rnd(i) - 0.5) * 40,
  born: 0.3 + rnd(i + 10) * 0.6,
  wick: 1.4 + i * 0.28 + rnd(i + 20) * 0.2, // la fibra la toca y empieza a subirla
}));
const RISE = 0.9; // lo que tarda la humedad en cruzar el punto

const rowY = (j: number) => TOP + 26 + (j * (BOT - TOP - 52)) / (ROWS - 1);
// recorrido de la humedad: sube ondulando suave por los rizos de la fibra, de abajo hacia arriba
const path = (x: number) => Array.from({ length: 41 }, (_, k) => `${(x + 9 * Math.sin(k * 0.55 + x)).toFixed(1)},${(BOT - (k * (BOT - TOP)) / 40).toFixed(1)}`).join(" ");
const PATH_LEN = 300;

export const Merino = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const warm = interpolate(s, [0.4, 1.4], [0, 1], cl);

  return (
    <NascaFrame title="MERINO 87% · SWEAT LEAVES AS VAPOR" s={s} frame={frame}>
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5E4334" />
          <stop offset="1" stopColor="#1C1410" />
        </linearGradient>
        <radialGradient id="drop" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.3} />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity={0.06} />
        </radialGradient>
        {/* aire caliente: ondulación que desplaza el vapor */}
        <filter id="haze" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="turbulence" baseFrequency="0.012 0.04" numOctaves={2} seed={Math.floor(s * 8)} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={18} />
        </filter>
        <linearGradient id="air" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#FFE6C4" stopOpacity={0.07} />
          <stop offset="1" stopColor="#FFE6C4" stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* aire caliente sobre la tela */}
      <rect x={0} y={0} width={W} height={TOP} fill="url(#air)" opacity={warm} />

      {/* piel */}
      <rect x={0} y={SKIN} width={W} height={H - SKIN} fill="url(#skin)" />
      <path d={`M0 ${SKIN} H${W}`} stroke="#8A6A57" strokeWidth={1.2} opacity={0.5} />

      {/* tejido de punto: filas de mallas rizadas, en relieve */}
      <rect x={0} y={TOP} width={W} height={BOT - TOP} fill="#0F0E0E" />
      {Array.from({ length: ROWS }, (_, j) => {
        const pts = Array.from({ length: 92 }, (_, k) => `${-20 + k * 20},${(rowY(j) + 12 * Math.sin(k * 0.95 + j * 1.7)).toFixed(1)}`).join(" ");
        return (
          <g key={j} fill="none" strokeLinecap="round" filter="url(#relief)">
            <polyline points={pts} stroke="#2E2B29" strokeWidth={20} />
            <polyline points={pts} stroke="#5A5550" strokeWidth={5} transform="translate(-2 -4)" />
          </g>
        );
      })}

      {DROPS.map((d, i) => {
        const grow = interpolate(s, [d.born, d.born + 0.6], [0, 1], { ...cl, easing: Easing.out(Easing.quad) });
        const drink = interpolate(s, [d.wick, d.wick + 0.5], [1, 0], cl); // la gota se vacía hacia la fibra
        const rr = 20 * grow * drink;
        const up = interpolate(s, [d.wick, d.wick + RISE], [0, 1], { ...cl, easing: Easing.inOut(Easing.quad) });
        const wet = interpolate(s, [d.wick, d.wick + 0.2, d.wick + RISE + 0.6, d.wick + RISE + 1.4], [0, 1, 1, 0], cl);
        const out = d.wick + RISE;
        return (
          <g key={i}>
            {/* gota de sudor: domo sobre la piel con reflejo */}
            {rr > 0.5 && (
              <g>
                <path d={`M${d.x - rr} ${SKIN} A ${rr} ${rr * 0.8} 0 0 1 ${d.x + rr} ${SKIN} Z`} fill="#3A2B23" />
                <path d={`M${d.x - rr} ${SKIN} A ${rr} ${rr * 0.8} 0 0 1 ${d.x + rr} ${SKIN} Z`} fill="url(#drop)" />
              </g>
            )}
            {/* hilo húmedo que sube por la fibra */}
            {up > 0 && (
              <g opacity={wet}>
                <polyline points={path(d.x)} fill="none" stroke="#FFFFFF" strokeWidth={8} opacity={0.35} filter="url(#soft)" strokeDasharray={`${PATH_LEN * up} ${PATH_LEN}`} />
                <polyline points={path(d.x)} fill="none" stroke="#FFFFFF" strokeWidth={2} strokeDasharray={`${PATH_LEN * up} ${PATH_LEN}`} />
              </g>
            )}
            {/* vapor: tres volutas que suben, se abren y se desvían con el viento */}
            {s > out && (
              <g filter="url(#haze)">
                {[0, 0.35, 0.7].map((dl, k) => {
                  const w = interpolate(s, [out + dl, out + dl + 1.6], [0, 1], cl);
                  if (w <= 0 || w >= 1) return null;
                  const y = TOP - 10 - 300 * w;
                  const x = d.x + 60 * w * w + (k - 1) * 10;
                  const a = 18 + 30 * w;
                  return <path key={k} d={`M${x} ${y + 60} c ${-a} -20 ${a} -40 0 -60 s ${-a} -40 0 -60`} fill="none" stroke="#FFFFFF" strokeWidth={2.2 - w} strokeLinecap="round" opacity={0.7 * Math.sin(Math.PI * w)} />;
                })}
              </g>
            )}
          </g>
        );
      })}
    </NascaFrame>
  );
};
