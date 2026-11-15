import { interpolate } from "remotion";
import { theme } from "../theme";
import { Arrow, Box, Callout, Crop, Frame, Graph, H0, KEY, P, pts, Rig, Timeline, Weave, WOOL, Z } from "./kit";

// MERINO (AC01/AC03): el vapor de la piel entra en la fibra, la cara queda seca y el vapor sale de a pocos.
const BEATS = [
  { t: 0.8, name: "SUDOR", note: "Placa térmica simula piel a 34 °C · el vapor sube hacia el tejido" },
  { t: 2.6, name: "ABSORCIÓN", note: "La fibra rizada guarda el vapor dentro · hasta 30% de su peso · tacto seco" },
  { t: 4.6, name: "LIBERACIÓN", note: "El vapor sale gradual por la cara · la humedad en la piel se mantiene baja" },
] as const;

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ZS = Z + 110; // altura del swatch sobre la placa
export const held = (s: number) => (s < 3.4 ? interpolate(s, [0.8, 3], [0, 1], cl) : interpolate(s, [3.4, 5.6], [1, 0.35], cl));
// humedad relativa en la piel: merino vs sintético sin tratar (referencia)
export const rhMerino = (s: number) => interpolate(s, [0, 1.6, 3, 6], [0.1, 0.38, 0.3, 0.22], cl);
export const rhSynth = (s: number) => interpolate(s, [0, 1.6, 3.4, 6], [0.1, 0.55, 0.85, 0.9], cl);

const r = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
const VAPOR = [...Array(14).keys()].map((i) => [(r(i) - 0.5) * 2 * H0 * 0.85, (r(i + 40) - 0.5) * 2 * H0 * 0.85] as const);

export const Merino = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const s = B.t;
  const h = held(s);
  const top = ZS + 8;

  return (
    <Frame series="CARAL" title="MERINO" beat={beat} B={B} keyTo="KEY 25° · WARM RAKE">
      {/* placa térmica = piel */}
      <Box x={0} y={0} z={Z} w={2 * H0 + 60} d={2 * H0 + 60} h={10} c={["#5A3E2E", "#42302A", "#2E2420"]} />
      <polygon points={pts(P(-H0 - 30, -H0 - 30, Z + 10), P(H0 + 30, -H0 - 30, Z + 10), P(H0 + 30, H0 + 30, Z + 10), P(-H0 - 30, H0 + 30, Z + 10))} fill="none" stroke={WOOL} strokeDasharray="6 6" opacity={0.35} />

      {/* postes que elevan el swatch */}
      {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => <Box key={`${sx}${sy}`} x={sx * (H0 - 6)} y={sy * (H0 - 6)} z={Z + 10} w={8} d={8} h={ZS - Z - 10} />)}

      {/* vapor subiendo bajo el tejido (se dibuja antes: queda detrás del swatch) */}
      {beat === 0 &&
        VAPOR.map(([x, y], i) => {
          const p = P(x, y, Z + 20 + ((i * 23) % (ZS - Z - 30)));
          return <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="none" stroke={theme.nieve} strokeWidth={1.4} opacity={0.8} />;
        })}
      {beat === 0 && [-70, 0, 70].map((x) => <Arrow key={x} a={[x, 0, Z + 20]} b={[x, 0, ZS - 14]} c={theme.nieve} w={2} o={0.7} />)}

      {/* swatch de punto merino con rizo de fibra (translúcido en el panel 1 para ver el vapor) */}
      <g opacity={beat === 0 ? 0.6 : 1}>
      <Box x={0} y={0} z={ZS} w={2 * H0} d={2 * H0} h={8} c={["#3A3633", "#2E2B29", "#24211F"]} />
      <Weave z={top} n={14} />
      <g fill="none" stroke={WOOL} strokeWidth={1} opacity={0.25 + 0.5 * h}>
        {[...Array(9).keys()].map((j) => {
          const y = -H0 + 16 + j * 31;
          return <polyline key={j} points={[...Array(29).keys()].map((k) => P(-H0 + k * 10, y + 5 * Math.sin(k * 1.3), top + 0.5).join(",")).join(" ")} />;
        })}
      </g>
      </g>

      {/* vapor: sube (0) · retenido en la fibra (1) · sale por la cara (2) */}
      {VAPOR.map(([x, y], i) => {
        if (beat === 0) return null;
        if (beat === 1 || i % 3 === 0) {
          const p = P(x, y, top + 1);
          return <circle key={i} cx={p[0]} cy={p[1]} r={5} fill={WOOL} opacity={0.75} filter="url(#glow)" />;
        }
        const p = P(x, y, top + 40 + ((i * 17) % 90));
        return <circle key={i} cx={p[0]} cy={p[1]} r={4} fill="none" stroke={theme.nieve} strokeWidth={1.4} opacity={0.7} />;
      })}
      {beat === 2 && [-80, 20, 90].map((x) => <Arrow key={x} a={[x, -30, top + 20]} b={[x, -30, top + 150]} c={theme.nieve} w={2} o={0.7} />)}

      <polygon points={pts(KEY, P(H0, -H0, top), P(H0, H0, top), P(-H0 * 0.2, H0, top))} fill="url(#cone)" />
      <Rig cam="side" aim={(Z + top) / 2} />
      <Crop at={P(0, 0, (Z + top) / 2)} r={200} />

      <Callout from={P(232, -60, Z + 240)} to={[1000, 230]} text="85mm // 3/4 ELEVATION · 60fps" />
      <Callout from={P(-H0, H0, top)} to={[420, 430]} text="MERINO 200 g/m² · 18.5 µm" c={beat === 1 ? WOOL : undefined} />
      <Callout from={P(-H0 - 30, H0 + 30, Z + 10)} to={[330, 800]} text="PLACA PIEL 34 °C" />
      {beat === 1 && <Callout from={P(VAPOR[1][0], VAPOR[1][1], top)} to={[560, 300]} text={`VAPOR EN FIBRA ${Math.round(30 * h)}% PESO`} c={WOOL} />}
      {beat === 2 && <Callout from={P(20, -30, top + 150)} to={[560, 300]} text="SALIDA GRADUAL · CARA SECA" />}

      <Graph s={s} f={rhMerino} ghost={rhSynth} title="HUMEDAD EN PIEL · MERINO vs SINTÉTICO" hi="100%" lo="0%" c={WOOL} />
      <Timeline s={s} segs={[[0, 1.6, "SWEAT"], [1.6, 3.4, "ABSORB · FIBER"], [3.4, 5.6, "RELEASE"], [5.6, 6, "LOOP"]]} c={WOOL} />
    </Frame>
  );
};
