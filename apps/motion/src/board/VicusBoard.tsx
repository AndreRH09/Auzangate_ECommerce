import { theme } from "../theme";
import { Arrow, Box, Callout, CYAN, Crop, Frame, Graph, H0, KEY, P, pts, quad, Rig, tension, Timeline, Weave, Z } from "./kit";

export { tension };
import { Dwr } from "./dwr";
import { Softshell } from "./softshell";
import { Upf } from "./upf";

// VICUS BOARD: storyboard previo de las piezas tech VICÚS. Un panel por beat del loop 0–6s.

export const BEATS = [
  { t: 0, name: "REPOSO", note: "Tejido en reposo · clamps sin carga · rig y luz fijados" },
  { t: 3.0, name: "TENSIÓN", note: "Pull biaxial ease-in-out hasta +35% · hold · celdas abiertas · elastano visible" },
  { t: 4.3, name: "SNAP-BACK", note: "Suelta 3.6s · recuperación rápida · overshoot y micro-bounce" },
] as const;

// Malla de distorsión punteada sobre el domo central.
const Dome = ({ k, t }: { k: number; t: number }) => {
  const h = H0 * k * 0.62;
  const bulge = (x: number, y: number) => 26 * Math.abs(t) * Math.exp(-(x * x + y * y) / (2 * (h * 0.5) ** 2));
  const lines: string[] = [];
  for (let i = 0; i <= 8; i++) {
    const v = -h + (i * 2 * h) / 8;
    const a: string[] = [];
    const b: string[] = [];
    for (let s = 0; s <= 24; s++) {
      const u = -h + (s * 2 * h) / 24;
      a.push(P(v, u, Z + 2 + bulge(v, u)).join(","));
      b.push(P(u, v, Z + 2 + bulge(u, v)).join(","));
    }
    lines.push(a.join(" "), b.join(" "));
  }
  return (
    <g fill="none" stroke={CYAN} strokeWidth={1} strokeDasharray="4 5" opacity={0.15 + 0.25 * Math.abs(t)}>
      {lines.map((l, i) => <polyline key={i} points={l} />)}
    </g>
  );
};

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

const StretchBoard = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const t = tension(B.t);
  const h = H0 * (1 + 0.35 * t);
  const center = P(0, 0, Z);
  const lens = P(0, 0, 360);
  return (
    <Frame title="4-WAY STRETCH" beat={beat} B={B}>
      {beat === 2 && <polygon points={quad(H0 * 1.35, Z)} fill="none" stroke={CYAN} strokeDasharray="8 8" opacity={0.45} />}
      <Weave k={1 + 0.35 * t} open={Math.max(t, 0)} elastane={0.15 + 0.5 * Math.max(t, 0)} />
      <Dome k={1 + 0.35 * t} t={beat === 0 ? 0.15 : t || 0.3} />
      <Box x={0} y={-h - 14} z={Z} w={110} d={28} h={22} />
      <Box x={-h - 14} y={0} z={Z} w={28} d={110} h={22} />
      <Box x={h + 14} y={0} z={Z} w={28} d={110} h={22} />
      <Box x={0} y={h + 14} z={Z} w={110} d={28} h={22} />
      {beat === 1 && DIRS.map(([dx, dy]) => <Arrow key={`${dx}${dy}`} a={[dx * (h + 40), dy * (h + 40), Z + 6]} b={[dx * (h + 150), dy * (h + 150), Z + 6]} />)}
      {beat === 2 && DIRS.map(([dx, dy]) => <Arrow key={`${dx}${dy}`} a={[dx * (H0 * 1.35 + 60), dy * (H0 * 1.35 + 60), Z + 6]} b={[dx * (H0 * 1.35 - 10), dy * (H0 * 1.35 - 10), Z + 6]} o={0.75} />)}
      {beat === 0 &&
        DIRS.map(([dx, dy]) => {
          const [a, b] = [P(dx * (h + 40), dy * (h + 40), Z + 6), P(dx * (h + 90), dy * (h + 90), Z + 6)];
          return <line key={`${dx}${dy}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={CYAN} strokeWidth={2} strokeDasharray="4 6" opacity={0.4} />;
        })}
      <polygon points={pts(KEY, P(h, -h, Z), P(h, h, Z), P(-h * 0.2, h, Z))} fill="url(#cone)" />
      <Rig cam="top" />
      <Crop at={center} />
      <Callout from={P(h + 150, 0, Z + 6)} to={[1180, 820]} text={`BIAXIAL PULL ${t < 0 ? "−" : "+"}${Math.abs(Math.round(35 * t))}%`} c={beat === 1 ? CYAN : theme.lineaTenue} />
      <Callout from={[lens[0] + 30, lens[1] - 40]} to={[1000, 230]} text="100mm MACRO // TOP-DOWN" />
      <Callout from={P(-h - 28, 0, Z + 22)} to={[330, 560]} text="AL MICRO-CLAMP ×4" />
      <Callout from={P(-h * 0.4, h * 0.4, Z)} to={[360, 820]} text={t > 0.5 ? "CELDAS ABIERTAS · ELASTANO" : "TAFETÁN 4-WAY #262527"} />
      <Graph s={B.t} f={tension} title="SNAP-BACK / MICRO-BOUNCE" hi="+35%" lo="0" handles={[1, 2.8]} />
      <Timeline s={B.t} segs={[[0, 1, "REST"], [1, 2.8, "PULL EASE-IN-OUT"], [2.8, 3.6, "HOLD"], [3.6, 4.2, "SNAP"], [4.2, 6, "MICRO-BOUNCE → LOOP"]]} />
    </Frame>
  );
};

const PIECES = { stretch: StretchBoard, softshell: Softshell, dwr: Dwr, upf: Upf };
export type Piece = keyof typeof PIECES;

export const VicusBoard = ({ piece, beat }: { piece: Piece; beat: 0 | 1 | 2 }) => {
  const Board = PIECES[piece];
  return <Board beat={beat} />;
};
