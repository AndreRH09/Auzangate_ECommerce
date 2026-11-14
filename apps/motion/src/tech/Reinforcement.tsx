import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { breathe } from "./breathe";

// REFUERZOS: el contorno del pantalón se dibuja y luego se marcan rodillas y bajos con rayado.
const OUTLINE = "M145 70 L255 70 L270 380 L215 380 L200 170 L185 380 L130 380 Z";
const ZONES = [
  "M138 220 L190 220 L188 260 L136 260 Z",
  "M210 220 L262 220 L264 260 L212 260 Z",
  "M131 355 L186 355 L185 380 L130 380 Z",
  "M214 355 L269 355 L270 380 L215 380 Z",
];

export const Reinforcement = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = breathe(frame, fps);
  const draw = interpolate(p, [0, 0.6], [0, 1], { extrapolateRight: "clamp" });
  const zones = interpolate(p, [0.6, 1], [0, 1], { extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: theme.granito }}>
      <svg viewBox="0 0 400 440" width="100%" height="100%">
        <defs>
          <pattern id="hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <path d="M0 0 L0 6" stroke={theme.nieve} strokeWidth={1.5} />
          </pattern>
        </defs>
        <path d={OUTLINE} fill="none" stroke={theme.nieve} strokeWidth={1.5} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        {ZONES.map((d) => (
          <path key={d} d={d} fill="url(#hatch)" opacity={zones} />
        ))}
        <g fill={theme.lineaTenue} fontFamily={theme.mono} fontSize={11} letterSpacing={1} opacity={zones}>
          <text x={280} y={244}>RODILLAS</text>
          <text x={280} y={372}>BAJOS</text>
        </g>
        <path d="M266 240 L276 240 M272 368 L276 368" stroke={theme.pizarra} opacity={zones} />
      </svg>
    </AbsoluteFill>
  );
};
