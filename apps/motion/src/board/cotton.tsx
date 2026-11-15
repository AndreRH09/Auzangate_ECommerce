import { interpolate } from "remotion";
import { Arrow, Box, Callout, Crop, Frame, Graph, H0, KEY, P, pts, quad, Rig, Timeline, WOOL, Z } from "./kit";

// ALGODÓN PEINADO 180 g/m² (AC04): un peine cruza la mecha, quita la fibra corta y alinea la larga en un hilo liso.
const BEATS = [
  { t: 0.6, name: "FIBRA CRUDA", note: "Mecha cardada · fibras cortas y largas en todas direcciones" },
  { t: 2.4, name: "PEINADO", note: "El peine cruza la mecha · retira la fibra corta · detrás quedan fibras paralelas" },
  { t: 4.6, name: "HILO", note: "Las fibras alineadas se tuercen en un hilo liso · menos pilling · tacto suave" },
] as const;

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const combX = (s: number) => interpolate(s, [1, 3.6], [-H0 - 40, H0 + 40], cl);
// alineación de fibras (0..1): peinado vs solo cardado (referencia)
export const align = (s: number) => interpolate(s, [0, 1, 3.6, 6], [0.3, 0.3, 0.95, 0.95], cl);
export const carded = (s: number) => interpolate(s, [0, 1, 3.6, 6], [0.3, 0.3, 0.6, 0.6], cl);

const r = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };
const FIBERS = [...Array(90).keys()].map((i) => ({ x: (r(i) - 0.5) * 2 * H0 * 0.92, y: (r(i + 200) - 0.5) * 2 * H0 * 0.92, a: (r(i + 400) - 0.5) * Math.PI, short: r(i + 600) < 0.3 }));

export const Cotton = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const s = B.t;
  const cx = combX(s);
  const zf = Z + 6;

  return (
    <Frame series="CARAL" title="ALGODÓN PEINADO" beat={beat} B={B} keyTo="KEY 25° · WARM RAKE">
      <polygon points={quad(H0, zf)} fill="#0A0A0B" />

      {/* fibras: delante del peine desordenadas; detrás alineadas y sin la fibra corta */}
      {FIBERS.map((f, i) => {
        const done = f.x < cx;
        if (done && f.short) return null;
        const a = done ? 0 : f.a;
        const L = f.short ? 9 : 22;
        const [p, q] = [P(f.x - L * Math.cos(a), f.y - L * Math.sin(a), zf), P(f.x + L * Math.cos(a), f.y + L * Math.sin(a), zf)];
        return <line key={i} x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={done ? "#E9E3D6" : "#9C978E"} strokeWidth={done ? 1.6 : 1.3} strokeLinecap="round" opacity={0.85} />;
      })}

      {/* peine */}
      {beat === 1 && (
        <g>
          <Box x={cx} y={0} z={zf + 30} w={14} d={2 * H0 + 40} h={18} />
          {[...Array(15).keys()].map((j) => <Box key={j} x={cx} y={-H0 + j * 20} z={zf} w={4} d={4} h={30} c={["#C9CDD2", "#8E949B", "#5E636A"]} />)}
          <Arrow a={[cx + 30, -H0 - 60, zf + 40]} b={[cx + 150, -H0 - 60, zf + 40]} c={WOOL} />
          {/* fibra corta retirada, delante del peine */}
          {FIBERS.filter((f) => f.short && f.x < cx).slice(0, 10).map((f, i) => {
            const p = P(cx - 10, f.y, zf + 40 + (i % 4) * 8);
            return <circle key={i} cx={p[0]} cy={p[1]} r={2.5} fill="#9C978E" />;
          })}
        </g>
      )}

      {/* hilo torcido saliendo hacia la derecha */}
      {beat === 2 &&
        [-60, 0, 60].map((y) => {
          const line = [...Array(41).keys()].map((k) => P(H0 + k * 6, y + 6 * Math.sin(k * 0.9), zf + 6 * Math.cos(k * 0.9)).join(",")).join(" ");
          const line2 = [...Array(41).keys()].map((k) => P(H0 + k * 6, y - 6 * Math.sin(k * 0.9), zf - 6 * Math.cos(k * 0.9)).join(",")).join(" ");
          return (
            <g key={y} fill="none" strokeWidth={2.2}>
              <polyline points={line2} stroke="#9C978E" />
              <polyline points={line} stroke={WOOL} filter="url(#glow)" />
            </g>
          );
        })}
      {beat === 2 && <Arrow a={[H0 + 40, 120, zf + 10]} b={[H0 + 230, 120, zf + 10]} c={WOOL} />}

      <polygon points={pts(KEY, P(H0, -H0, zf), P(H0, H0, zf), P(-H0 * 0.2, H0, zf))} fill="url(#cone)" />
      <Rig cam="top" />
      <Crop at={P(beat === 2 ? 90 : 0, 0, zf)} />

      <Callout from={[P(0, 0, 360)[0] + 30, P(0, 0, 360)[1] - 40]} to={[1000, 230]} text="100mm MACRO // TOP-DOWN" />
      <Callout from={P(-H0 * 0.6, H0 * 0.6, zf)} to={[330, 820]} text={beat === 0 ? "MECHA CARDADA · FIBRA MIXTA" : "FIBRA LARGA ALINEADA"} c={beat === 0 ? undefined : WOOL} />
      {beat === 1 && <Callout from={P(cx, -H0, zf + 40)} to={[330, 430]} text="PEINE · RETIRA FIBRA CORTA" c={WOOL} />}
      {beat === 2 && <Callout from={P(H0 + 120, 60, zf)} to={[1180, 820]} text="HILO PEINADO · JERSEY 180 g/m²" c={WOOL} />}

      <Graph s={s} f={align} ghost={carded} title="ALINEACIÓN DE FIBRA · PEINADO vs CARDADO" hi="100%" lo="0%" c={WOOL} />
      <Timeline s={s} segs={[[0, 1, "RAW"], [1, 3.6, "COMB PASS"], [3.6, 5.4, "TWIST · YARN"], [5.4, 6, "LOOP"]]} c={WOOL} />
    </Frame>
  );
};
