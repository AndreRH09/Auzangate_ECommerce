import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cl, H, NascaFrame, W } from "./frame";

// NASCA · UPF 50 (AN03): corte lateral del cuello bajo el sol del mediodía. El sol queda fuera de cuadro arriba a la
// derecha (destello y fantasmas de lente sobre la diagonal); 50 rayos finos caen en diagonal y mueren en la tela,
// que flamea con el viento y se calienta donde la tocan. Uno solo, tenue y punteado, la cruza y apenas marca la
// piel en sombra: 1 de 50 = 98 % bloqueado. Distinto del UPF de Vicús (isométrico): aquí es luz física de desierto.
const SUN = { x: 1640, y: -260 };
const N = 50;
const PASS = 31;
const SKIN = 900;
const X0 = 330;
const X1 = 1400;
const fabricY = (x: number, s: number) => 560 + 16 * Math.sin(x * 0.006 + s * 1.7) + 6 * Math.sin(x * 0.017 - s * 2.3);

export const Upf = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const off = interpolate(s, [4.6, 5.2], [1, 0], cl);
  const warm = interpolate(s, [1.4, 3.0], [0, 1], cl) * off;

  const band = Array.from({ length: 81 }, (_, i) => {
    const x = 160 + (i * (W - 320)) / 80;
    return [x, fabricY(x, s)] as const;
  });
  const topEdge = band.map(([x, y]) => `${x.toFixed(1)},${(y - 13).toFixed(1)}`).join(" ");
  const botEdge = [...band].reverse().map(([x, y]) => `${x.toFixed(1)},${(y + 13).toFixed(1)}`).join(" ");

  return (
    <NascaFrame title="UPF 50 · BLOCKS 98% OF UV" s={s} frame={frame}>
      <defs>
        <radialGradient id="flare" cx={SUN.x / W} cy="0" r="0.6">
          <stop offset="0" stopColor="#FFF4E2" stopOpacity={0.35} />
          <stop offset="0.4" stopColor="#FFE6C4" stopOpacity={0.08} />
          <stop offset="1" stopColor="#FFE6C4" stopOpacity={0} />
        </radialGradient>
        <linearGradient id="skinShade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3E2D24" />
          <stop offset="1" stopColor="#120D0A" />
        </linearGradient>
        <pattern id="knit" width="10" height="8" patternUnits="userSpaceOnUse">
          <rect width="10" height="8" fill="#232326" />
          <path d="M0 4 q 2.5 -4 5 0 t 5 0" fill="none" stroke="#323236" strokeWidth="1.4" />
        </pattern>
      </defs>

      <rect width={W} height={H} fill="url(#flare)" />
      {/* fantasmas de lente sobre la diagonal sol → centro */}
      {[0.35, 0.55, 0.8].map((k, i) => (
        <polygon
          key={k}
          points={Array.from({ length: 6 }, (_, j) => {
            const cx = SUN.x + (W / 2 - SUN.x) * k * 1.4;
            const cy = SUN.y + (H / 2 - SUN.y) * k * 1.4;
            const r = 26 + i * 18;
            return `${cx + r * Math.cos((j * Math.PI) / 3)},${cy + r * Math.sin((j * Math.PI) / 3)}`;
          }).join(" ")}
          fill="#FFFFFF"
          opacity={0.02 + 0.01 * i}
        />
      ))}

      {/* piel en sombra bajo el cuello */}
      <rect x={0} y={SKIN} width={W} height={H - SKIN} fill="url(#skinShade)" />

      {/* rayos: bajan desde el sol, mueren en la tela con un punto de impacto */}
      <g strokeLinecap="round">
        {Array.from({ length: N }, (_, i) => {
          const x = X0 + (i * (X1 - X0)) / (N - 1);
          const y = fabricY(x, s) - 13;
          // sol lejano: todos los rayos llegan paralelos (misma dirección), no en abanico
          const dx = (X1 - SUN.x) * 0.9;
          const dy = 560 - SUN.y;
          const t0 = 0.6 + (1 - i / N) * 0.9; // primero llegan los de la derecha, más cerca del sol
          const head = interpolate(s, [t0, t0 + 0.7], [0, 1], { ...cl, easing: Easing.in(Easing.quad) });
          if (head <= 0) return null;
          const a = 0.6; // largo visible del rayo (fracción de la diagonal sol → tela): entran desde fuera de cuadro
          const sx = x - dx * a;
          const sy = y - dy * a;
          const hit = head >= 1;
          return (
            <g key={i} opacity={off}>
              <line x1={sx} y1={sy} x2={sx + dx * a * head} y2={sy + dy * a * head} stroke="#FFFFFF" strokeWidth={1.3} opacity={0.32} />
              {hit && <circle cx={x} cy={y} r={i === PASS ? 2.5 : 5} fill="#FFFFFF" opacity={0.75} filter="url(#glow)" />}
              {hit && i === PASS && (() => {
                // el único que cruza: sigue la misma dirección, tenue y punteado, hasta la piel
                const k = (SKIN - y) / dy;
                const go = interpolate(s, [t0 + 0.7, t0 + 1.3], [0, 1], cl);
                return (
                  <g>
                    <line x1={x} y1={y + 26} x2={x + dx * k * go} y2={y + 26 + (SKIN - y - 26) * go} stroke="#FFFFFF" strokeWidth={1.2} strokeDasharray="5 7" opacity={0.55} />
                    {go >= 1 && <circle cx={x + dx * k} cy={SKIN} r={3} fill="#FFFFFF" opacity={0.6} filter="url(#glow)" />}
                  </g>
                );
              })()}
            </g>
          );
        })}
      </g>

      {/* tela del cuello: punto fino que flamea; se calienta donde la toca el sol */}
      <g filter="url(#relief)">
        <polygon points={`${topEdge} ${botEdge}`} fill="url(#knit)" />
        <polygon points={`${topEdge} ${botEdge}`} fill="#FFE6C4" opacity={0.08 * warm} />
        <polyline points={topEdge} fill="none" stroke="#B5ADA2" strokeWidth={1.6} opacity={0.5 + 0.4 * warm} />
        <polyline points={botEdge} fill="none" stroke="#2C2C30" strokeWidth={1.2} />
      </g>
    </NascaFrame>
  );
};
