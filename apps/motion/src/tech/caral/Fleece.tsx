import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { tension, WOOL } from "../../board/kit";
import { loft } from "../../board/fleece";
import { theme } from "../../theme";
import { Chrome, rnd, W } from "./chrome";

// CARAL · POLAR 300: plano final del CaralBoard. Corte macro del pelo: una prensa lo aplasta a −70%, el aire
// caliente sale por los lados y al soltar el pelo recupera el loft con micro-rebote (curva = kit.tension).

const BASE = 960; // backer del polar
const LOFT = 430;
const N = 62;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const FIB = [...Array(N).keys()].map((i) => ({ x: 14 + i * ((W - 28) / (N - 1)) + (rnd(i) - 0.5) * 10, h: 0.82 + 0.18 * rnd(i + 50), ph: rnd(i + 90) * 6 }));
const AIR = [...Array(34).keys()].map((i) => ({ x: 60 + rnd(i + 200) * (W - 120), f: 0.1 + 0.8 * rnd(i + 300) }));

export const Fleece = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const k = loft(s);
  const t = Math.max(tension(s), 0);
  const hL = LOFT * k;
  const amp = 7 + 30 * (1 - Math.min(k, 1)); // al comprimir el pelo se riza más
  const gap = interpolate(s, [0.2, 1, 4.2, 5.2], [170, 0, 0, 170], cl);
  const plate = BASE - hL - gap; // borde inferior de la prensa

  return (
    <Chrome title="POLAR 300 g/m²" lens="85mm MACRO // CROSS-SECTION" readout={`LOFT ${Math.round(100 * k)}%`} s={s} curve={loft} curveTitle="LOFT · COMPRESIÓN / RECUPERACIÓN">
      <defs>
        <linearGradient id="plateHeat" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#6A4836" />
          <stop offset="1" stopColor="#2A1D17" />
        </linearGradient>
      </defs>
      {/* placa térmica + backer */}
      <rect x={0} y={BASE + 34} width={W} height={260} fill="url(#plateHeat)" />
      <rect x={0} y={BASE} width={W} height={34} fill="#3A3734" />

      {/* aire caliente atrapado: sale por los lados al comprimir y vuelve en el rebote */}
      {AIR.map((a, i) => {
        const side = a.x < W / 2 ? -1 : 1;
        const x = a.x + side * t * (700 + 200 * a.f);
        const y = BASE - 20 - a.f * (hL - 40);
        return <circle key={i} cx={x} cy={y} r={6 + 3 * Math.sin(s * 3 + i)} fill={WOOL} opacity={0.75 * (1 - 0.8 * t)} filter="url(#glow)" />;
      })}

      {/* pelo */}
      <g fill="none" strokeLinecap="round" filter="url(#shadow)">
        {FIB.map((f, i) => {
          const top = hL * f.h;
          const pts = [...Array(25).keys()].map((q) => {
            const u = q / 24;
            return `${f.x + amp * Math.sin(u * 7 + f.ph) * u},${BASE - u * top}`;
          }).join(" ");
          return (
            <g key={i}>
              <polyline points={pts} stroke="#5C5852" strokeWidth={9} />
              <polyline points={pts} stroke="#A39E96" strokeWidth={2.5} transform="translate(2 -2)" opacity={0.8} />
            </g>
          );
        })}
      </g>

      {/* prensa */}
      <rect x={-20} y={plate - 70} width={W + 40} height={70} fill="url(#steel)" opacity={0.95} />
      <line x1={-20} y1={plate} x2={W + 20} y2={plate} stroke={theme.nieve} strokeWidth={2} opacity={0.6} />

      <g fontFamily={theme.mono} fontSize={16} letterSpacing={2} fill={theme.pizarra}>
        <text x={W - 56} y={BASE + 74} textAnchor="end">PLACA 34 °C</text>
        <text x={W - 56} y={plate - 90} textAnchor="end" opacity={interpolate(s, [1.2, 1.6, 3.6, 4], [0, 1, 1, 0], cl)} fill={WOOL}>AIRE EXPULSADO</text>
      </g>
    </Chrome>
  );
};
