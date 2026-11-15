import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Box, H0, P, quad, Weave, Z } from "../board/kit";
import { theme } from "../theme";
import { FinalFrame } from "./frame";

// VICÚS · UPF 50: plano final del board. Haces UV desde arriba-derecha, la cara absorbe y solo 1 de 50 llega
// al sensor. Loop: emite, absorbe, lee la dosis y se apaga antes de volver a empezar.
const ZS = Z + 170;
const D = [0.42, -0.62, 1] as const;
const L = 220;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const W = theme.nieve;

// Dosis bajo el tejido (0..1 del 2 %) para la mini-curva y el contador; vuelve a 0 al cerrar el loop.
const dose = (s: number) => interpolate(s, [1.6, 4.6, 5.4, 6], [0, 1, 1, 0], cl);

export const Upf = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const off = interpolate(s, [5.2, 5.8], [1, 0], cl); // apagado del array antes del loop
  const f1 = interpolate(s, [0.3, 1.4], [0, 1], cl);
  const f2 = interpolate(s, [1.5, 2.0], [0, 1], cl);
  const hits = [...Array(5).keys()].flatMap((i) => [...Array(5).keys()].map((j) => [-H0 + 28 + i * 56, -H0 + 28 + j * 56] as const));
  const pass = 12;
  const zT = (ZS - Z - 8) / D[2];
  const land = [hits[pass][0] - D[0] * zT, hits[pass][1] - D[1] * zT] as const;

  return (
    <FinalFrame title="UPF 50 · BLOCKS 98% OF UV RAYS">
      <ellipse cx={P(0, 0, 0)[0]} cy={P(0, 0, 0)[1] + 30} rx={300} ry={110} fill="#000" opacity={0.6} filter="url(#glow)" />
      <Box x={0} y={0} z={Z} w={2 * H0 + 40} d={2 * H0 + 40} h={8} c={["#1E1E22", "#17171A", "#111113"]} />
      <polygon points={quad(H0, Z + 8)} fill="none" stroke={theme.pizarra} strokeDasharray="4 4" />
      <polygon points={quad(40, Z + 8, land[0], land[1])} fill={W} opacity={0.25 * dose(s)} filter="url(#glow)" />

      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => (
        <Box key={`${sx}${sy}`} x={sx * (H0 - 6)} y={sy * (H0 - 6)} z={Z + 8} w={8} d={8} h={ZS - Z - 8} c={["#3A3B40", "#2A2B2F", "#1E1F22"]} />
      ))}
      <Weave z={ZS} n={12} />

      <g strokeLinecap="round" opacity={off}>
        {hits.map(([x, y], i) => {
          const a = P(x + D[0] * L, y + D[1] * L, ZS + D[2] * L);
          const b = P(x + D[0] * L * (1 - f1), y + D[1] * L * (1 - f1), ZS + D[2] * L * (1 - f1));
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={W} strokeWidth={1.4} opacity={0.4} />;
        })}
      </g>
      {f1 >= 1 && (
        <g fill={W} opacity={0.55 * off}>
          {hits.map(([x, y], i) => {
            const p = P(x, y, ZS + 1);
            return <circle key={i} cx={p[0]} cy={p[1]} r={i === pass ? 2 : 5} filter="url(#glow)" />;
          })}
        </g>
      )}
      {f2 > 0 && (() => {
        const [x, y] = hits[pass];
        const a = P(x, y, ZS);
        const b = P(x - D[0] * zT * f2, y - D[1] * zT * f2, ZS - D[2] * zT * f2);
        return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={W} strokeWidth={1.6} strokeDasharray="6 5" opacity={off} filter="url(#glow)" />;
      })()}
    </FinalFrame>
  );
};
