import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { C, P, quad, Weave, Z } from "../board/kit";
import { theme } from "../theme";
import { FinalFrame } from "./frame";

// VICÚS · DWR SIN PFC: plano final del board. Las gotas caen, perlan sobre la cara sin mojarla y ruedan fuera.
// Loop 0–6s: a los 5s el tejido queda seco y las gotas vuelven a caer desde fuera de cuadro.
const DROPS = [[-60, -40, 18], [50, 20, 15], [-10, 80, 20], [85, -75, 14], [-95, 55, 13], [20, -105, 16]] as const;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = theme.nieve;

const dropZ = (s: number, i: number) => {
  const hit = 1 + i * 0.05;
  if (s >= hit) return 0;
  const u = Math.max(0, (s - (hit - 0.9)) / 0.9);
  return 330 * (1 - u * u);
};
const roll = (s: number) => interpolate(s, [3.2, 5], [0, 360], { ...cl, easing: Easing.in(Easing.quad) });

export const Dwr = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const dx = roll(s);

  return (
    <FinalFrame title="PFC-FREE DWR · WATER BEADS AND ROLLS OFF">
      <ellipse cx={P(0, 0, 0)[0]} cy={P(0, 0, 0)[1] + 30} rx={300} ry={110} fill="#000" opacity={0.6} filter="url(#glow)" />
      <polygon points={quad(180, Z - 2)} fill="#0F0F11" />
      <Weave n={12} />

      {DROPS.map(([x, y, r], i) => {
        const z = dropZ(s, i);
        const xr = x + dx;
        const o = interpolate(xr, [140, 200], [1, 0], cl);
        if (o <= 0) return null;
        const base = P(xr, y, Z);
        const ctr = P(xr, y, Z + z + r * 0.9);
        const R = r * C.s * 1.25;
        const falling = z > 0;
        return (
          <g key={i} opacity={o}>
            <ellipse cx={base[0]} cy={base[1]} rx={R * (falling ? 0.6 : 0.95)} ry={R * (falling ? 0.3 : 0.42)} fill="#000" opacity={falling ? 0.3 : 0.6} />
            {falling && <line x1={ctr[0]} y1={ctr[1] - R} x2={ctr[0]} y2={ctr[1] - R - 50} stroke={W} strokeWidth={1.4} strokeDasharray="8 6" opacity={0.5} />}
            {dx > 0 && <line x1={P(x, y, Z)[0]} y1={P(x, y, Z)[1]} x2={base[0]} y2={base[1]} stroke={W} strokeWidth={1.4} strokeDasharray="3 7" opacity={0.45} />}
            <ellipse cx={ctr[0]} cy={ctr[1]} rx={R * (falling ? 0.82 : 1)} ry={R * (falling ? 1.12 : 0.94)} fill="url(#drop)" stroke={W} strokeWidth={1} strokeOpacity={0.7} />
          </g>
        );
      })}
    </FinalFrame>
  );
};
