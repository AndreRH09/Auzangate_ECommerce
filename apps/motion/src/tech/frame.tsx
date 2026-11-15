import { AbsoluteFill } from "remotion";
import { CYAN } from "../board/kit";
import { textSafe, theme } from "../theme";

// Marco de los planos finales VICÚS que reutilizan la geometría isométrica del VICUS BOARD:
// encuadre horizontal recortado sobre el swatch (panel de tecnología del maquetado), viñeta, grano y
// una sola etiqueta arriba a la izquierda, en inglés, con lo que muestra el motion. Solo tinta blanca.
const VB = { x: 400, y: 296, w: 800, h: 484 }; // proporción 1600 × 968

export const VTECH = { width: 1600, height: 968, fps: 30 } as const;

export const FinalFrame = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <AbsoluteFill style={{ backgroundColor: "#060607" }}>
    <svg viewBox={`${VB.x} ${VB.y} ${VB.w} ${VB.h}`} width="100%" height="100%">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={3} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
          <stop offset="0.5" stopColor="#000" stopOpacity={0} />
          <stop offset="1" stopColor="#000" stopOpacity={0.8} />
        </radialGradient>
        <linearGradient id="rake" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DCEFFF" stopOpacity={0.12} />
          <stop offset="0.5" stopColor="#DCEFFF" stopOpacity={0} />
        </linearGradient>
        <radialGradient id="drop" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.3" stopColor="#FFFFFF" stopOpacity={0.35} />
          <stop offset="1" stopColor={CYAN} stopOpacity={0.12} />
        </radialGradient>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency={1.2} numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      {children}

      <g transform={`translate(${VB.x} ${VB.y})`}>
        <rect width={VB.w} height={VB.h} fill="url(#rake)" />
        <rect width={VB.w} height={VB.h} fill="url(#vig)" />
        <text x={textSafe(VB.w, VB.h, 20).x} y={textSafe(VB.w, VB.h, 20).y + 12} fontFamily={theme.mono} letterSpacing={1.2} fill={theme.nieve} fontSize={11}>{title}</text>
        <rect width={VB.w} height={VB.h} filter="url(#grain)" opacity={0.06} />
      </g>
    </svg>
  </AbsoluteFill>
);
