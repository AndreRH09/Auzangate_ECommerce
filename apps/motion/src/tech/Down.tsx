import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe } from "./breathe";

// PLUMA 650: la cámara se llena de pluma (las esferas crecen) y el indicador sube hasta 650 de poder de relleno.
const PUFFS = [
  { cx: 140, cy: 200, r: 22 },
  { cx: 190, cy: 185, r: 28 },
  { cx: 245, cy: 205, r: 24 },
  { cx: 170, cy: 235, r: 18 },
  { cx: 225, cy: 245, r: 16 },
];

export const Down = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = breathe(frame, fps);

  return (
    <AbsoluteFill style={{ backgroundColor: theme.granito }}>
      <svg viewBox="0 0 400 440" width="100%" height="100%">
        <rect x={80} y={130} width={240} height={150} rx={40} fill="none" stroke={theme.nieve} strokeWidth={1.5} />
        {PUFFS.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r * interpolate(p, [0, 1], [0.35, 1])} fill="none" stroke={theme.nieve} strokeWidth={1.5} />
        ))}
        <line x1={80} y1={330} x2={320} y2={330} stroke={theme.pizarra} strokeWidth={1.5} />
        <line x1={80} y1={330} x2={80 + 188 * p} y2={330} stroke={theme.nieve} strokeWidth={3} />
        <text x={80} y={370} fill={theme.nieve} fontFamily={theme.mono} fontSize={34} fontWeight={500}>{Math.round(650 * p)}</text>
        <text x={160} y={370} fill={theme.lineaTenue} fontFamily={theme.mono} fontSize={11} letterSpacing={1}>PODER DE RELLENO</text>
      </svg>
    </AbsoluteFill>
  );
};
