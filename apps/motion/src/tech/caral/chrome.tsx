import { AbsoluteFill } from "remotion";
import { WOOL } from "../../board/kit";
import { theme } from "../../theme";

// Marco común de los planos finales CARAL: viñeta, crop, etiquetas de datos, curva en miniatura y grano.
export const W = 1080;
export const H = 1188;
export const rnd = (i: number) => { const v = Math.sin(i * 12.9898) * 43758.5453; return v - Math.floor(v); };

type Props = {
  title: string; lens: string; readout: string; s: number;
  curve: (s: number) => number; ghost?: (s: number) => number; curveTitle: string;
  fade?: number; children: React.ReactNode;
};

export const Chrome = ({ title, lens, readout, s, curve, ghost, curveTitle, fade = 0, children }: Props) => {
  const crop = 380;
  const L = 60;
  const line = (f: (s: number) => number) => [...Array(121).keys()].map((i) => `${(i / 120) * 300},${70 - f((i / 120) * 6) * 60}`).join(" ");
  return (
    <AbsoluteFill style={{ backgroundColor: "#060607" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={-5} dy={7} stdDeviation={5} floodColor="#000" floodOpacity={0.7} />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <linearGradient id="rake" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFE9CF" stopOpacity={0.13} />
            <stop offset="0.55" stopColor="#FFE9CF" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.75} />
          </radialGradient>
          <linearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#060607" stopOpacity={0} />
            <stop offset="0.45" stopColor="#060607" stopOpacity={0.8} />
            <stop offset="1" stopColor="#060607" stopOpacity={0.92} />
          </linearGradient>
          <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#5E636A" />
            <stop offset="0.5" stopColor="#C9CDD2" />
            <stop offset="1" stopColor="#5E636A" />
          </linearGradient>
        </defs>

        {children}

        <rect width={W} height={H} fill="url(#rake)" />
        <rect width={W} height={H} fill="url(#vig)" />
        <rect y={H - 300} width={W} height={300} fill="url(#scrim)" />

        <g stroke={theme.nieve} strokeWidth={2} fill="none" opacity={0.85}>
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
            const [cx, cy] = [W / 2, H / 2];
            return <polyline key={`${sx}${sy}`} points={`${cx + sx * crop},${cy + sy * (crop - L)} ${cx + sx * crop},${cy + sy * crop} ${cx + sx * (crop - L)},${cy + sy * crop}`} />;
          })}
        </g>

        <g fontFamily={theme.mono} letterSpacing={2} fill={theme.lineaTenue} fontSize={22}>
          <text x={56} y={76} fill={theme.nieve} fontSize={24}>{`CARAL · ${title}`}</text>
          <text x={W - 56} y={76} textAnchor="end">{lens}</text>
          <text x={56} y={H - 60} fill={WOOL}>{readout}</text>
          <text x={W - 56} y={H - 60} textAnchor="end">{`LOOP 0s - 6s · ${s.toFixed(1)}s`}</text>
        </g>

        <g transform={`translate(56 ${H - 190})`} opacity={0.9}>
          <text x={0} y={-12} fontFamily={theme.mono} fontSize={15} letterSpacing={2} fill={theme.pizarra}>{curveTitle}</text>
          <line x1={0} y1={70} x2={300} y2={70} stroke={theme.pizarra} strokeDasharray="3 4" />
          {ghost && <polyline points={line(ghost)} fill="none" stroke={theme.pizarra} strokeWidth={2} strokeDasharray="6 5" />}
          <polyline points={line(curve)} fill="none" stroke={theme.lineaTenue} strokeWidth={2} />
          <circle cx={(s / 6) * 300} cy={70 - curve(s) * 60} r={6} fill={WOOL} filter="url(#glow)" />
        </g>

        <rect width={W} height={H} filter="url(#grain)" opacity={0.06} />
        {fade > 0 && <rect width={W} height={H} fill="#060607" opacity={fade} />}
      </svg>
    </AbsoluteFill>
  );
};
