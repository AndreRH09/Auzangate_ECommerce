import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe, cycle } from "./breathe";

// MEMBRANA 20K: tres capas (nylon 2 capas, membrana, forro) que se separan en vista explosionada.
// Las gotas rebotan en la capa exterior; el vapor sube y atraviesa las tres.
// capas más angostas que el lienzo: las etiquetas van a la derecha del vértice, sin pisar el trazo
const layer = (y: number) => `M40 ${y} L200 ${y - 36} L280 ${y} L120 ${y + 36} Z`;
const LABELS = ["NYLON 2 CAPAS", "MEMBRANA 20K", "FORRO"];

export const Membrane = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = breathe(frame, fps);
  const gap = interpolate(p, [0, 1], [10, 80]);
  const ys = [230 - gap, 230, 230 + gap];

  return (
    <AbsoluteFill style={{ backgroundColor: theme.granito }}>
      <svg viewBox="0 0 400 440" width="100%" height="100%">
        {ys.map((y, i) => (
          <path key={i} d={layer(y)} fill={theme.granito} stroke={theme.nieve} strokeWidth={1.5} strokeDasharray={i === 1 ? "4 4" : undefined} />
        ))}
        {/* gotas: caen, tocan la capa exterior y salen despedidas hacia fuera */}
        {[0, 27, 54].map((offset, i) => {
          const t = cycle(frame, 80, offset);
          const x = 130 + i * 35;
          const hit = ys[0] - 36 + (x - 120) * 0.225;
          const fall = t < 0.6;
          const y = fall ? interpolate(t, [0, 0.6], [20, hit]) : hit - interpolate(t, [0.6, 1], [0, 30]);
          const dx = fall ? 0 : interpolate(t, [0.6, 1], [0, i % 2 ? 30 : -30]);
          const opacity = fall ? interpolate(t, [0, 0.1], [0, 1], { extrapolateRight: "clamp" }) : interpolate(t, [0.6, 1], [1, 0]);
          return <circle key={i} cx={x + dx} cy={y} r={4} fill={theme.nieve} opacity={opacity} />;
        })}
        {/* vapor: puntos tenues que suben desde el forro y atraviesan las capas */}
        {[0, 40, 80].map((offset, i) => {
          const t = cycle(frame, 120, offset);
          return <circle key={i} cx={100 + i * 50} cy={interpolate(t, [0, 1], [400, 60])} r={2.5} fill={theme.lineaTenue} opacity={Math.sin(t * Math.PI) * 0.8} />;
        })}
        <g fill={theme.lineaTenue} fontFamily={theme.mono} fontSize={11} letterSpacing={1} opacity={p}>
          {LABELS.map((label, i) => (
            <text key={label} x={290} y={ys[i] + 4}>{label}</text>
          ))}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
