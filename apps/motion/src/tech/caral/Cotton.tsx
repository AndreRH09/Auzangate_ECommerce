import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { WOOL } from "../../board/kit";
import { align, carded } from "../../board/cotton";
import { theme } from "../../theme";
import { Chrome, H, rnd, W } from "./chrome";

// CARAL · ALGODÓN PEINADO: plano final del CaralBoard. Macro cenital: el peine barre la mecha, retira la fibra
// corta y deja la larga paralela; después las fibras se juntan en tres hilos torcidos. Fundido a negro para el loop.

const N = 150;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const YARNS = [H / 2 - 210, H / 2, H / 2 + 210];

const FIB = [...Array(N).keys()].map((i) => ({
  x: -60 + rnd(i) * (W + 120),
  y: 170 + rnd(i + 400) * (H - 340),
  a: (rnd(i + 800) - 0.5) * Math.PI,
  short: rnd(i + 1200) < 0.3,
  curl: (rnd(i + 1600) - 0.5) * 40,
}));

export const Cotton = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;
  const comb = interpolate(s, [1, 3.6], [-80, W + 80], { ...cl, easing: Easing.inOut(Easing.sin) });
  const tw = interpolate(s, [3.6, 5.2], [0, 1], { ...cl, easing: Easing.inOut(Easing.cubic) });
  const fade = interpolate(s, [0, 0.35, 5.65, 6], [1, 0, 0, 1], cl);

  return (
    <Chrome title="ALGODÓN PEINADO" lens="100mm MACRO // TOP-DOWN" readout={`ALINEACIÓN ${Math.round(100 * align(s))}%`} s={s} curve={align} ghost={carded} curveTitle="ALINEACIÓN · PEINADO vs CARDADO" fade={fade}>
      {FIB.map((f, i) => {
        const behind = Math.min(Math.max((comb - f.x) / 180, 0), 1);
        if (f.short && comb - f.x > 0) {
          // fibra corta: el peine la arrastra y la saca de cuadro
          const d = comb - f.x;
          if (d > 260) return null;
          const p = [comb - 18 - (i % 5) * 4, f.y];
          return <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="#9C978E" opacity={1 - d / 260} />;
        }
        const a = f.a * (1 - behind);
        const L = f.short ? 34 : 105;
        const target = YARNS.reduce((b, y) => (Math.abs(y - f.y) < Math.abs(b - f.y) ? y : b));
        const y = f.y + (target - f.y) * tw * 0.88;
        const [dx, dy] = [L * Math.cos(a), L * Math.sin(a)];
        const curl = f.curl * (1 - behind);
        const bow = 0.3 * (1 - 0.85 * behind); // la fibra peinada queda casi recta
        const col = behind > 0.5 ? "#EDE7DA" : "#9C978E";
        return <path key={i} d={`M ${f.x - dx} ${y - dy} Q ${f.x - dy * bow + curl} ${y + dx * bow} ${f.x + dx} ${y + dy}`} fill="none" stroke={col} strokeWidth={2.6} strokeLinecap="round" opacity={0.9} filter="url(#shadow)" />;
      })}

      {/* torsión del hilo: rayas diagonales que corren a lo largo */}
      {tw > 0 &&
        YARNS.map((y) => (
          <g key={y} stroke={WOOL} strokeWidth={2.5} opacity={0.75 * tw} filter="url(#glow)">
            {[...Array(44).keys()].map((q) => {
              const x = ((q * 28 + s * 160) % (W + 56)) - 28;
              return <line key={q} x1={x - 9} y1={y + 22} x2={x + 9} y2={y - 22} />;
            })}
          </g>
        ))}

      {/* peine */}
      {s > 0.9 && s < 3.8 && (
        <g>
          {[...Array(Math.ceil(H / 26)).keys()].map((q) => <line key={q} x1={comb + 12} y1={q * 26 + 6} x2={comb + 52} y2={q * 26 + 6} stroke="#C9CDD2" strokeWidth={3} strokeLinecap="round" />)}
          <rect x={comb} y={0} width={18} height={H} fill="url(#steel)" filter="url(#shadow)" />
        </g>
      )}

      <text x={W - 56} y={124} textAnchor="end" fontFamily={theme.mono} fontSize={16} letterSpacing={2} fill={WOOL} opacity={interpolate(s, [1.2, 1.6, 3.4, 3.8], [0, 1, 1, 0], cl)}>PEINE · RETIRA FIBRA CORTA</text>
      <text x={W - 56} y={124} textAnchor="end" fontFamily={theme.mono} fontSize={16} letterSpacing={2} fill={WOOL} opacity={interpolate(s, [4, 4.4, 5.4, 5.7], [0, 1, 1, 0], cl)}>HILO PEINADO · JERSEY 180 g/m²</text>
    </Chrome>
  );
};
