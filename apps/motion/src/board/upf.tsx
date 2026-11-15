import { Easing, interpolate } from "remotion";
import { theme } from "../theme";
import { Box, Callout, CYAN, Crop, Frame, Graph, H0, KEY, P, pts, quad, Rig, Timeline, Weave, Z } from "./kit";

// UPF 50 (AV02): haz UV desde arriba-derecha; el tejido absorbe el 98% y el sensor bajo él lee la dosis.
const BEATS = [
  { t: 0.9, name: "EMISIÓN", note: "Array UV-A/B dispara haces paralelos hacia el swatch elevado" },
  { t: 2.4, name: "ABSORCIÓN", note: "La cara absorbe y dispersa · solo 1 de cada 50 haces atraviesa" },
  { t: 4.6, name: "LECTURA", note: "Sensor bajo el tejido acumula 2% de dosis · UPF 50 · 98% bloqueado" },
] as const;

const UV = "#B9A4FF";
const ZS = Z + 170; // altura del swatch sobre el sensor
const D = [0.42, -0.62, 1] as const; // dirección hacia la fuente
const L = 280;
const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const dose = (s: number) => interpolate(s, [1.6, 5.4], [0, 0.02], cl);
const doseRaw = (s: number) => interpolate(s, [1.6, 5.4], [0, 1], { ...cl, easing: Easing.out(Easing.quad) });

export const Upf = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const s = B.t;
  const zT = (ZS - Z - 8) / D[2]; // recorrido del haz transmitido hasta el sensor
  const f1 = interpolate(s, [0.4, 1.5], [0, 1], cl);
  const f2 = interpolate(s, [1.6, 2.1], [0, 1], cl);
  const hits = [...Array(5).keys()].flatMap((i) => [...Array(5).keys()].map((j) => [-H0 + 28 + i * 56, -H0 + 28 + j * 56] as const));
  const pass = 12; // índice del haz que atraviesa (el central)

  return (
    <Frame title="UPF 50" beat={beat} B={B} keyTo="UV-A/B ARRAY · 290–400nm">
      {/* sensor de dosis sobre el plató */}
      <Box x={0} y={0} z={Z} w={2 * H0 + 40} d={2 * H0 + 40} h={8} c={["#26262B", "#1C1C20", "#151518"]} />
      <polygon points={quad(H0, Z + 8)} fill="none" stroke={theme.pizarra} strokeDasharray="4 4" />
      {beat === 2 && <polygon points={quad(40, Z + 8, -D[0] * zT, -D[1] * zT)} fill={CYAN} opacity={0.3} filter="url(#glow)" />}

      {/* postes y swatch elevado */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => (
        <Box key={`${sx}${sy}`} x={sx * (H0 - 6)} y={sy * (H0 - 6)} z={Z + 8} w={8} d={8} h={ZS - Z - 8} c={["#3A3B40", "#2A2B2F", "#1E1F22"]} />
      ))}
      <Weave z={ZS} n={12} />

      {/* haces incidentes */}
      <g strokeLinecap="round">
        {hits.map(([x, y], i) => {
          const a = P(x + D[0] * L, y + D[1] * L, ZS + D[2] * L);
          const b = P(x + D[0] * L * (1 - f1), y + D[1] * L * (1 - f1), ZS + D[2] * L * (1 - f1));
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={UV} strokeWidth={2} opacity={0.55} filter="url(#glow)" />;
        })}
      </g>

      {/* absorción en la cara */}
      {f1 >= 1 && (
        <g fill={UV}>
          {hits.map(([x, y], i) => {
            const p = P(x, y, ZS + 1);
            return <circle key={i} cx={p[0]} cy={p[1]} r={i === pass ? 3 : 7} opacity={0.5} filter="url(#glow)" />;
          })}
        </g>
      )}

      {/* único haz transmitido hasta el sensor */}
      {f2 > 0 && (() => {
        const [x, y] = hits[pass];
        const a = P(x, y, ZS);
        const b = P(x - D[0] * zT * f2, y - D[1] * zT * f2, ZS - D[2] * zT * f2);
        return <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CYAN} strokeWidth={2} strokeDasharray="6 5" filter="url(#glow)" />;
      })()}

      <polygon points={pts(KEY, P(H0, -H0, ZS), P(H0, H0, ZS), P(-H0 * 0.2, H0, ZS))} fill="url(#cone)" opacity={0.6} />
      <Rig cam="side" aim={(ZS + Z) / 2} />
      <Crop at={P(0, 0, (ZS + Z) / 2)} r={210} />

      <Callout from={P(232, -60, Z + 240)} to={[1000, 230]} text="50mm // 3/4 ELEVATION" />
      <Callout from={P(-H0, H0, ZS)} to={[330, 470]} text="CARA STRETCH · UPF 50" />
      <Callout from={P(-H0 - 20, H0 + 20, Z + 8)} to={[330, 820]} text={beat === 2 ? "DOSIS 2% · 98% BLOQUEADO" : "SENSOR UV · DOSIS"} c={beat === 2 ? CYAN : undefined} />
      {beat === 1 && <Callout from={P(hits[pass][0], hits[pass][1], ZS - 60)} to={[330, 640]} text="TRANSMISIÓN 1/50 HACES" c={CYAN} />}

      <Graph s={s} f={dose} ghost={doseRaw} title="DOSIS UV · BAJO TEJIDO vs DIRECTA" hi="100%" lo="0%" />
      <Timeline s={s} segs={[[0, 0.4, "ARM"], [0.4, 1.5, "EMIT"], [1.5, 2.1, "IMPACT"], [2.1, 3.6, "ABSORB · 2% PASS"], [3.6, 6, "READOUT UPF 50 → LOOP"]]} />
    </Frame>
  );
};
