import { AbsoluteFill, interpolate } from "remotion";
import { textSafe, theme } from "../../theme";

// Marco común de las piezas NASCA (maquetado: tres piezas horizontales 16:10, 6 s, una por producto).
// Sol de desierto bajo desde arriba a la izquierda (rasante cálido muy tenue), arena suspendida que cruza con el viento,
// viñeta, grano y una sola etiqueta arriba a la izquierda (en inglés, dentro de textSafe). Entra desde negro y
// termina en negro puro con unos cuadros negros: el loop empalma limpio.
export const NTECH = { width: 1728, height: 1080, fps: 30, seconds: 6 } as const;
export const W = NTECH.width;
export const H = NTECH.height;
export const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const rnd = (i: number) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return v - Math.floor(v); };

const SAND = Array.from({ length: 46 }, (_, i) => ({ y: rnd(i) * H, v: 260 + rnd(i + 50) * 420, x0: rnd(i + 90) * (W + 400), r: 0.8 + rnd(i + 130) * 1.6 }));

export const NascaFrame = ({ title, s, frame, children }: { title: string; s: number; frame: number; children: React.ReactNode }) => {
  const t = textSafe(W, H, 48);
  const fadeIn = interpolate(s, [0, 0.4], [1, 0], cl);
  const fadeOut = interpolate(s, [5.3, 5.7], [0, 1], cl);
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={4} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          {/* región en userSpace: con objectBoundingBox una línea recta (bbox de ancho 0) no se dibuja */}
          <filter id="soft" filterUnits="userSpaceOnUse" x={-500} y={-500} width={W + 1000} height={H + 1000}><feGaussianBlur stdDeviation={3} /></filter>
          <filter id="relief" x="-10%" y="-10%" width="120%" height="120%">
            {/* sol bajo a la izquierda: la sombra de cada hilo cae abajo a la derecha */}
            <feDropShadow dx={4} dy={5} stdDeviation={2.5} floodColor="#000" floodOpacity={0.85} />
          </filter>
          <linearGradient id="sun" x1="0" y1="0" x2="1" y2="0.8">
            <stop offset="0" stopColor="#FFE6C4" stopOpacity={0.16} />
            <stop offset="0.55" stopColor="#FFE6C4" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.5" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.85} />
          </radialGradient>
          <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} seed={frame % 97} /><feColorMatrix type="saturate" values="0" /></filter>
        </defs>

        {children}

        {/* arena en suspensión: granos con estela corta (obturador a 180°), cruzan con el viento de izquierda a derecha */}
        <g fill="#E9DFCF">
          {SAND.map((g, i) => {
            const x = ((g.x0 + g.v * s) % (W + 400)) - 200;
            return <rect key={i} x={x} y={g.y + Math.sin(s * 2 + i) * 6} width={g.v / 60} height={g.r} rx={g.r / 2} opacity={0.18 + 0.2 * rnd(i + 7)} />;
          })}
        </g>

        <rect width={W} height={H} fill="url(#sun)" />
        <rect width={W} height={H} fill="url(#vig)" />
        <text x={t.x} y={t.y + 22} fontFamily={theme.mono} fontSize={24} letterSpacing={2.4} fill={theme.nieve}>{title}</text>
        <rect width={W} height={H} filter="url(#grain)" opacity={0.07} />
        {fadeIn + fadeOut > 0 && <rect width={W} height={H} fill="#000" opacity={Math.max(fadeIn, fadeOut)} />}
      </svg>
    </AbsoluteFill>
  );
};
