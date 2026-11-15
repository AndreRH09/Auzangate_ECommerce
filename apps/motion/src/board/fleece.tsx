import { theme } from "../theme";
import { Arrow, Box, Callout, Crop, Frame, Graph, H0, KEY, P, pts, quad, Rig, tension, Timeline, WOOL, Z } from "./kit";

// POLAR 300 g/m² (AC02): el pelo atrapa aire caliente; se comprime con una prensa y recupera el loft.
const BEATS = [
  { t: 0.5, name: "LOFT", note: "Polar en reposo · bolsas de aire caliente entre el pelo · calor de la placa retenido" },
  { t: 3.0, name: "COMPRESIÓN", note: "Prensa baja ease-in-out hasta −70% · el aire sale por los bordes · hold" },
  { t: 4.4, name: "REBOTE", note: "Suelta la prensa · el pelo recupera el loft con micro-rebote · el aire vuelve" },
] as const;

const LOFT = 70; // altura del polar en reposo
export const loft = (s: number) => 1 - 0.7 * tension(s);
const r = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
const TUFTS = [...Array(11).keys()].flatMap((i) => [...Array(11).keys()].map((j) => [-H0 + 13 + i * 25.4, -H0 + 13 + j * 25.4] as const));
const AIR = [...Array(18).keys()].map((i) => [(r(i) - 0.5) * 2 * H0 * 0.8, (r(i + 50) - 0.5) * 2 * H0 * 0.8, r(i + 99)] as const);

export const Fleece = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const s = B.t;
  const k = loft(s);
  const hL = LOFT * k;
  const zb = Z + 10;
  const top = zb + hL;
  const plate = top + (beat === 1 ? 4 : 160);

  return (
    <Frame series="CARAL" title="POLAR 300" beat={beat} B={B} keyTo="KEY 25° · WARM RAKE">
      {/* placa térmica */}
      <Box x={0} y={0} z={Z} w={2 * H0 + 60} d={2 * H0 + 60} h={10} c={["#5A3E2E", "#42302A", "#2E2420"]} />

      {/* cuerpo del polar */}
      <Box x={0} y={0} z={zb} w={2 * H0} d={2 * H0} h={hL} c={["#4A4743", "#3A3734", "#2C2A28"]} />

      {/* aire caliente atrapado (se ve a través del lado; menos al comprimir) */}
      {AIR.map(([x, y, f], i) => {
        if (beat === 1 && i % 3) return null;
        const p = P(H0, y, zb + 6 + f * (hL - 12));
        const q = P(x, H0, zb + 6 + f * (hL - 12));
        const at = i % 2 ? p : q;
        return <circle key={i} cx={at[0]} cy={at[1]} r={3 + 2 * k} fill={WOOL} opacity={0.6 * k + 0.1} filter="url(#glow)" />;
      })}

      {/* pelo en la cara */}
      <g stroke="#8E8A84" strokeWidth={1.4} strokeLinecap="round">
        {TUFTS.map(([x, y], i) => {
          const a = P(x, y, top);
          const b = P(x + (r(i) - 0.5) * 6, y + (r(i + 7) - 0.5) * 6, top + 6 + 8 * k * r(i + 3));
          return <line key={i} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} opacity={0.5 + 0.4 * k} />;
        })}
      </g>

      {/* prensa */}
      <Box x={0} y={0} z={plate} w={2 * H0 + 20} d={2 * H0 + 20} h={16} o={beat === 1 ? 1 : 0.55} />
      {beat === 1 && [-110, 110].flatMap((y) => [<Arrow key={`l${y}`} a={[-H0 + 10, y, zb + 10]} b={[-H0 - 120, y, zb + 10]} c={WOOL} w={3} o={0.8} />])}
      {beat === 1 && [[-70, -70], [70, 70]].map(([x, y]) => <Arrow key={`${x}${y}`} a={[x, y, plate + 150]} b={[x, y, plate + 30]} c={WOOL} />)}
      {beat === 2 && <polygon points={quad(H0, zb + LOFT)} fill="none" stroke={WOOL} strokeDasharray="8 8" opacity={0.5} />}
      {beat === 2 && [[-70, -70], [70, 70]].map(([x, y]) => <Arrow key={`${x}${y}`} a={[x, y, top + 10]} b={[x, y, top + 80]} c={WOOL} o={0.75} />)}
      {beat === 0 && [-60, 60].map((x) => <Arrow key={x} a={[x, 0, Z + 12]} b={[x, 0, top - 8]} c={WOOL} w={2} o={0.55} />)}

      <polygon points={pts(KEY, P(H0, -H0, top), P(H0, H0, top), P(-H0 * 0.2, H0, top))} fill="url(#cone)" />
      <Rig cam="side" aim={(Z + top) / 2} />
      <Crop at={P(0, 0, (Z + top) / 2)} r={190} />

      <Callout from={P(232, -60, Z + 240)} to={[1000, 230]} text="85mm // 3/4 ELEVATION" />
      <Callout from={P(-H0, H0, top)} to={[470, 430]} text="POLAR 300 g/m² · DOBLE CARA" />
      <Callout from={P(H0, 40, zb + hL / 2)} to={[1180, 820]} text={`LOFT ${Math.round(100 * k)}%`} c={beat === 1 ? WOOL : theme.lineaTenue} />
      <Callout from={P(-H0 - 30, H0 + 30, Z + 10)} to={[470, 800]} text="PLACA 34 °C · CALOR RETENIDO" />
      {beat === 1 && <Callout from={P(-H0 - 120, -110, zb + 10)} to={[560, 300]} text="AIRE EXPULSADO" c={WOOL} />}

      <Graph s={s} f={loft} title="LOFT · COMPRESIÓN / RECUPERACIÓN" hi="100%" lo="0" handles={[1, 2.8]} c={WOOL} />
      <Timeline s={s} segs={[[0, 1, "REST · LOFT"], [1, 2.8, "PRESS EASE-IN-OUT"], [2.8, 3.6, "HOLD −70%"], [3.6, 4.2, "RELEASE"], [4.2, 6, "REBOUND → LOOP"]]} c={WOOL} />
    </Frame>
  );
};
