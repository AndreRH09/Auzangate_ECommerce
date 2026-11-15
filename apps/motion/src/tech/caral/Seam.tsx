import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { textSafe, theme } from "../../theme";

// CARAL · COSTURA PLANA: estilo lab (render técnico 2.5D). Dos paneles de punto merino se juntan, la aguja
// cose un flatlock de 4 hilos a lo largo de la unión, la cámara entra al macro y una prueba de tensión
// abre la costura y la suelta. Spec del artboard Caral: 8 s; único texto, esquina superior izquierda.

export const SEAM = { width: 1080, height: 1080, fps: 30, seconds: 8.5 } as const; // 7.7–8.1 s fundido; 8.1–8.5 s negro total

const cl = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ease = Easing.inOut(Easing.cubic);
const ROT = (-32 * Math.PI) / 180;
const SY = 0.58; // aplastado vertical = inclinación de cámara
const [OX, OY] = [540, 600];
const HALF = 330; // medio largo de la costura (eje y del plano)
const PITCH = 11; // paso de puntada

// plano → pantalla (misma transformación que el <g> del plano)
const S = (x: number, y: number) => [OX + x * Math.cos(ROT) - y * Math.sin(ROT), OY + (x * Math.sin(ROT) + y * Math.cos(ROT)) * SY] as const;
const planeT = `translate(${OX} ${OY}) scale(1 ${SY}) rotate(-32)`;

// prueba de tensión: abre, hold corto, suelta con micro-rebote
const pullAt = (s: number) => {
  if (s < 6.2) return 0;
  if (s < 6.7) return interpolate(s, [6.2, 6.7], [0, 1], { easing: ease });
  if (s < 6.9) return 1;
  if (s < 7.1) return interpolate(s, [6.9, 7.1], [1, 0], { easing: Easing.in(Easing.quad) });
  const u = s - 7.1;
  return -0.12 * Math.exp(-5 * u) * Math.sin(2 * Math.PI * 2.2 * u);
};

export const Seam = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  const gap = interpolate(s, [0.2, 1.6], [240, 0], { ...cl, easing: ease }); // los paneles llegan
  const needleY = interpolate(s, [1.8, 5], [-HALF, HALF], { ...cl, easing: Easing.inOut(Easing.sin) });
  const sewing = s > 1.7 && s < 5.1;
  const pull = pullAt(s);
  const open = 16 * pull; // cada panel se separa
  const zoom = interpolate(s, [5, 6, 7.4, 7.9], [1, 2.1, 2.1, 1], { ...cl, easing: ease });
  const fade = interpolate(s, [0, 0.3, 7.7, 8.1], [1, 0, 0, 1], cl);
  const amp = 20 + open; // ancho del flatlock: se abre con la tensión

  const zig: string[] = [];
  for (let y = -HALF; y <= needleY; y += PITCH) zig.push(`${((Math.round((y + HALF) / PITCH) % 2) * 2 - 1) * amp},${y}`);
  zig.push(`${0},${needleY}`);
  const lineTo = (x: number) => `M ${x} ${-HALF} L ${x} ${needleY}`;

  const panel = (side: -1 | 1) => {
    const x0 = side * (gap / 2 + open);
    const x = side < 0 ? x0 - 560 : x0;
    return { x, w: 560 };
  };
  const [L, R] = [panel(-1), panel(1)];
  const [nx, ny] = S(0, needleY);

  return (
    <AbsoluteFill style={{ backgroundColor: "#1D1C1E" }}>
      <svg viewBox="0 0 1080 1080" width="100%" height="100%">
        <defs>
          <pattern id="knit" width={16} height={13} patternUnits="userSpaceOnUse">
            <rect width={16} height={13} fill="#2C2B2E" />
            <path d="M0 0 L8 11 L16 0" fill="none" stroke="#3F3E43" strokeWidth={3.4} strokeLinejoin="round" />
            <path d="M0 0 L8 11 L16 0" fill="none" stroke="#56555B" strokeWidth={1} transform="translate(0.8 -1)" />
          </pattern>
          <linearGradient id="key" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.16} />
            <stop offset="0.6" stopColor="#FFFFFF" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vig" cx="0.5" cy="0.52" r="0.72">
            <stop offset="0.5" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.8} />
          </radialGradient>
          <radialGradient id="floor" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#000" stopOpacity={0.55} />
            <stop offset="1" stopColor="#000" stopOpacity={0} />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={2.5} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        <g transform={`translate(540 600) scale(${zoom}) translate(-540 -600)`}>
          <ellipse cx={OX} cy={OY + 40} rx={560} ry={240} fill="url(#floor)" />

          {/* canto de los paneles (grosor) */}
          <g transform="translate(0 16)">
            <g transform={planeT}>
              {[L, R].map((p, i) => <rect key={i} x={p.x} y={-HALF} width={p.w} height={2 * HALF} rx={6} fill="#141315" />)}
            </g>
          </g>

          {/* cara de los paneles + doblez del margen de costura */}
          <g transform={planeT}>
            {[L, R].map((p, i) => (
              <g key={i}>
                <rect x={p.x} y={-HALF} width={p.w} height={2 * HALF} rx={6} fill="url(#knit)" />
                <line x1={i ? p.x + 3 : p.x + p.w - 3} y1={-HALF} x2={i ? p.x + 3 : p.x + p.w - 3} y2={HALF} stroke="#6A696F" strokeWidth={2} opacity={0.7} />
              </g>
            ))}

            {/* flatlock: 2 agujas rectas + zigzag del looper, cosido hasta la aguja */}
            {s > 1.8 && (
              <g fill="none" strokeLinecap="round" strokeLinejoin="round">
                <polyline points={zig.join(" ")} stroke="#000" strokeWidth={4.5} opacity={0.45} transform="translate(2 3)" />
                <polyline points={zig.join(" ")} stroke={theme.nieve} strokeWidth={2.4} />
                {[-amp - 4, amp + 4].map((x) => (
                  <g key={x}>
                    <path d={lineTo(x)} stroke="#000" strokeWidth={4} strokeDasharray="7 4" opacity={0.45} transform="translate(2 3)" />
                    <path d={lineTo(x)} stroke={theme.nieve} strokeWidth={2.6} strokeDasharray="7 4" />
                  </g>
                ))}
              </g>
            )}
          </g>

          {/* aguja y prensatelas (en pantalla, sobre la costura) */}
          {sewing && (
            <g>
              <rect x={nx - 34} y={ny - 210} width={68} height={70} rx={6} fill="#3A393D" />
              <rect x={nx - 22} y={ny - 140} width={44} height={110} rx={4} fill="#2C2B2E" />
              <line x1={nx} y1={ny - 30} x2={nx} y2={ny - 4 - 10 * Math.abs(Math.sin(s * 40))} stroke="#C9CDD2" strokeWidth={3} strokeLinecap="round" />
              <circle cx={nx} cy={ny} r={5} fill={theme.nieve} filter="url(#glow)" />
            </g>
          )}

          {/* vectores de la prueba de tensión */}
          {pull > 0.05 &&
            [-1, 1].map((side) => {
              const a = S(side * (60 + open * 2), 0);
              const b = S(side * (160 + open * 3), 0);
              const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
              const hd = (d: number) => `${b[0] - 14 * Math.cos(ang + d)},${b[1] - 14 * Math.sin(ang + d)}`;
              return (
                <g key={side} stroke={theme.nieve} fill={theme.nieve} opacity={pull} filter="url(#glow)">
                  <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} strokeWidth={3} strokeLinecap="round" />
                  <polygon points={`${b[0]},${b[1]} ${hd(0.45)} ${hd(-0.45)}`} stroke="none" />
                </g>
              );
            })}
        </g>

        <rect width={1080} height={1080} fill="url(#key)" />
        <rect width={1080} height={1080} fill="url(#vig)" />

        {/* único texto: arriba a la izquierda de la zona segura (theme.textSafe) */}
        <g fontFamily={theme.mono} letterSpacing={2}>
          <text x={textSafe(1080, 1080, 56).x} y={textSafe(1080, 1080, 56).y + 24} fill={theme.nieve} fontSize={24}>CARAL · FLAT SEAM</text>
          <text x={textSafe(1080, 1080, 56).x} y={textSafe(1080, 1080, 56).y + 56} fill={theme.lineaTenue} fontSize={16}>4-THREAD FLATLOCK · NO CHAFING</text>
        </g>

        <rect width={1080} height={1080} filter="url(#grain)" opacity={0.06} />
        <rect width={1080} height={1080} fill="#000" opacity={fade} />
      </svg>
    </AbsoluteFill>
  );
};
