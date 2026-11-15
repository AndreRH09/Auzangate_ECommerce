import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WOOL } from "../../board/kit";
import { held, rhMerino, rhSynth } from "../../board/merino";
import { theme } from "../../theme";
import { Chrome, rnd, W } from "./chrome";

// CARAL · MERINO: plano final del CaralBoard. Corte macro: el vapor sube de la piel, entra en la fibra rizada
// (brilla cálida mientras la retiene) y sale gradual por la cara. Empieza y termina vacío: loop limpio.

const SKIN = 960; // borde superior de la piel
const TOP = 500; // cara exterior del tejido
const BOT = 700; // cara interior
const ROWS = 6;
const N = 40;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const VAPOR = [...Array(N).keys()].map((i) => ({
  x: 70 + rnd(i) * (W - 140),
  e: 0.2 + rnd(i + 100) * 2.2, // sale de la piel
  r: 3.3 + rnd(i + 200) * 1.7, // la fibra lo libera (termina antes de 6s)
  d: rnd(i + 300), // profundidad dentro del tejido
}));

export const Merino = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const h = held(s);
  const rowY = (j: number) => TOP + 22 + (j * (BOT - TOP - 44)) / (ROWS - 1);

  return (
    <Chrome title="MERINO" lens="85mm MACRO // CROSS-SECTION" readout={`VAPOR EN FIBRA ${Math.round(30 * h)}% PESO`} s={s} curve={rhMerino} ghost={rhSynth} curveTitle="HUMEDAD EN PIEL · MERINO vs SINTÉTICO">
      {/* piel */}
      <defs>
        <linearGradient id="skin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A4836" />
          <stop offset="1" stopColor="#2A1D17" />
        </linearGradient>
      </defs>
      <rect x={0} y={SKIN} width={W} height={260} fill="url(#skin)" />
      <line x1={0} y1={SKIN} x2={W} y2={SKIN} stroke={WOOL} strokeWidth={1.5} strokeDasharray="6 8" opacity={0.4} />

      {/* tejido: filas de fibra rizada */}
      <rect x={0} y={TOP} width={W} height={BOT - TOP} fill="#0E0D0D" />
      {[...Array(ROWS).keys()].map((j) => {
        const pts = [...Array(56).keys()].map((k) => `${-20 + k * 20},${rowY(j) + 11 * Math.sin(k * 0.95 + j * 1.7)}`).join(" ");
        return (
          <g key={j} fill="none" strokeLinecap="round" filter="url(#shadow)">
            <polyline points={pts} stroke="#2E2B29" strokeWidth={18} />
            <polyline points={pts} stroke="#4A4642" strokeWidth={6} transform="translate(2 -4)" />
            <polyline points={pts} stroke={WOOL} strokeWidth={3} opacity={0.08 + 0.4 * h} filter="url(#glow)" />
          </g>
        );
      })}

      {/* vapor: sube → retenido en la fibra → sale por la cara */}
      {VAPOR.map((v, i) => {
        if (s < v.e) return null;
        const u = (s - v.e) / 0.9;
        if (u < 1) {
          const y = interpolate(u, [0, 1], [SKIN - 10, BOT + 8]);
          return <circle key={i} cx={v.x + 8 * Math.sin(u * 5 + i)} cy={y} r={7} fill="none" stroke={theme.nieve} strokeWidth={2} opacity={0.8 * Math.min(u * 4, 1)} />;
        }
        if (s < v.r) {
          const y = BOT - 24 - v.d * (BOT - TOP - 48);
          const pulse = 0.7 + 0.3 * Math.sin(s * 4 + i);
          return <circle key={i} cx={v.x} cy={y} r={7 * pulse} fill={WOOL} opacity={0.85} filter="url(#glow)" />;
        }
        const w = (s - v.r) / 1.0;
        if (w >= 1) return null;
        const y = interpolate(w, [0, 1], [TOP - 8, TOP - 360]);
        return <circle key={i} cx={v.x + 14 * Math.sin(w * 4 + i)} cy={y} r={7 + 6 * w} fill="none" stroke={theme.nieve} strokeWidth={2} opacity={0.8 * (1 - w)} />;
      })}

      <g fontFamily={theme.mono} fontSize={16} letterSpacing={2} fill={theme.pizarra}>
        <text x={W - 56} y={SKIN + 40} textAnchor="end">PIEL 34 °C</text>
        <text x={W - 56} y={TOP - 18} textAnchor="end" opacity={interpolate(s, [3.2, 3.6, 5.6, 6], [0, 1, 1, 0], cl)}>SALIDA GRADUAL · CARA SECA</text>
      </g>
    </Chrome>
  );
};
