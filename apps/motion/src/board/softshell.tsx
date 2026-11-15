import { theme } from "../theme";
import { Arrow, Box, Callout, CYAN, Crop, Frame, Graph, H0, KEY, P, pts, quad, Rig, tension, Timeline, Weave, Z } from "./kit";

// SOFTSHELL 3 CAPAS (AV01): el laminado se separa en vista explosionada y vuelve a pegarse.
const BEATS = [
  { t: 0.5, name: "LAMINADO", note: "Swatch laminado de 3 capas · el viento choca contra la cara y se desvía" },
  { t: 3.0, name: "EXPLOSIÓN", note: "Capas separadas Δz 110mm · cara, membrana y backer identificados · vapor sale" },
  { t: 4.3, name: "RE-LAMINADO", note: "Las capas se cierran en 0.6s con prensa · micro-asentamiento" },
] as const;

const TH = 8; // grosor de capa

export const Softshell = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const e = tension(B.t);
  const zB = Z + 4;
  const zM = zB + TH + 2 + 110 * e;
  const zF = zM + TH + 2 + 110 * e;
  const top = zF + TH;
  const pores = [...Array(9).keys()].flatMap((i) => [...Array(9).keys()].map((j) => [-H0 + 16 + i * 31, -H0 + 16 + j * 31]));
  const vapor = [[-60, 40], [30, -50], [70, 60], [-20, -10], [100, -90]];

  return (
    <Frame title="SOFTSHELL 3 CAPAS" beat={beat} B={B}>
      {/* backer de forro polar en rejilla */}
      <Box x={0} y={0} z={zB} w={2 * H0} d={2 * H0} h={TH} c={["#2A2A2E", "#202023", "#18181B"]} />
      <g stroke="#3C3C42" strokeWidth={1}>
        {[...Array(13).keys()].map((i) => {
          const v = -H0 + (i * 2 * H0) / 12;
          const [a, b, c, d] = [P(v, -H0, zB + TH), P(v, H0, zB + TH), P(-H0, v, zB + TH), P(H0, v, zB + TH)];
          return (
            <g key={i}>
              <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />
              <line x1={c[0]} y1={c[1]} x2={d[0]} y2={d[1]} />
            </g>
          );
        })}
      </g>

      {/* membrana translúcida con microporos */}
      <Box x={0} y={0} z={zM} w={2 * H0} d={2 * H0} h={TH * 0.6} c={["#9FEAFF33", "#9FEAFF22", "#9FEAFF18"]} />
      <polygon points={quad(H0, zM + TH * 0.6)} fill="none" stroke={CYAN} strokeWidth={1.2} opacity={0.7} />
      <g fill={CYAN} opacity={0.5}>
        {pores.map(([x, y]) => {
          const p = P(x, y, zM + TH * 0.6);
          return <circle key={`${x}${y}`} cx={p[0]} cy={p[1]} r={1.6} />;
        })}
      </g>

      {/* cara exterior: tejido stretch con DWR */}
      <Box x={0} y={0} z={zF} w={2 * H0} d={2 * H0} h={TH} c={["#38373C", "#2C2B2F", "#222125"]} />
      <Weave z={top} n={12} />

      {/* vapor saliendo a través de las capas */}
      {beat === 1 &&
        vapor.map(([x, y], i) => {
          const zs = [zB + 30, zM + 40, top + 50 + i * 6];
          return (
            <g key={i}>
              {zs.map((z) => {
                const p = P(x, y, z);
                return <circle key={z} cx={p[0]} cy={p[1]} r={4} fill="none" stroke={theme.nieve} strokeWidth={1.4} opacity={0.75} />;
              })}
              <Arrow a={[x, y, top + 20]} b={[x, y, top + 110]} w={2} o={0.7} c={theme.nieve} />
            </g>
          );
        })}

      {/* viento: choca con la cara y se desvía */}
      {beat !== 2 &&
        [-80, 0, 80].map((y) => (
          <g key={y}>
            <Arrow a={[-H0 - 230, y, top + 14]} b={[-H0 - 30, y, top + 14]} o={beat === 0 ? 1 : 0.5} />
            <Arrow a={[-H0 - 26, y, top + 18]} b={[-H0 + 10, y, top + 90]} o={beat === 0 ? 0.6 : 0.3} w={2} />
          </g>
        ))}

      {/* prensa de re-laminado */}
      {beat === 2 &&
        [[-70, -70], [70, 70], [-70, 70], [70, -70]].map(([x, y]) => (
          <Arrow key={`${x}${y}`} a={[x, y, top + 170]} b={[x, y, top + 40]} o={0.85} />
        ))}
      {beat === 2 && <polygon points={quad(H0, Z + 4 + 3 * (TH + 2) + 220)} fill="none" stroke={CYAN} strokeDasharray="8 8" opacity={0.4} />}

      <polygon points={pts(KEY, P(H0, -H0, top), P(H0, H0, top), P(-H0 * 0.2, H0, top))} fill="url(#cone)" />
      <Rig cam="side" aim={(zB + top) / 2} />
      <Crop at={P(0, 0, (zB + top) / 2)} r={beat === 1 ? 230 : 170} />

      <Callout from={P(232, -60, Z + 240)} to={[1000, 230]} text="85mm // 3/4 ELEVATION" />
      <Callout from={P(-H0, H0, top)} to={[330, 430]} text="FACE · STRETCH WOVEN + DWR" c={beat === 1 ? CYAN : undefined} />
      <Callout from={P(-H0, H0, zM + TH * 0.6)} to={[330, 600]} text="MEMBRANA · WINDPROOF / MVTR" c={beat === 1 ? CYAN : undefined} />
      <Callout from={P(-H0, H0, zB + TH)} to={[330, 780]} text="BACKER · GRID FLEECE" c={beat === 1 ? CYAN : undefined} />
      <Callout from={P(-H0 - 140, 80, top + 14)} to={[560, 300]} text={beat === 2 ? "BONDED 3L" : "WIND BLOCK"} />

      <Graph s={B.t} f={tension} title="EXPLODE / RE-LAMINATE" hi="Δz 110mm" lo="0" handles={[1, 2.8]} />
      <Timeline s={B.t} segs={[[0, 1, "LAMINADO"], [1, 2.8, "EXPLODE EASE-IN-OUT"], [2.8, 3.6, "HOLD · LAYER ID"], [3.6, 4.2, "RE-LAMINATE"], [4.2, 6, "SETTLE → LOOP"]]} />
    </Frame>
  );
};
