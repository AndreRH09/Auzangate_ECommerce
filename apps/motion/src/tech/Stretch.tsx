import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { tension } from "../board/kit";
import { textSafe, theme } from "../theme";

// VICÚS · STRETCH 4-WAY: plano final del VicusBoard. Macro 100mm cenital sobre tafetán granito,
// tirón biaxial a +35% y snap-back con micro-rebote. Loop 0–6s (la curva vive en VicusBoard.tension).

const PITCH = 118; // paso del hilo en reposo (px)
const N = 17; // hilos por eje: cubren el lienzo horizontal en reposo y en overshoot

const pts = (p: number[][]) => p.map((q) => q.join(",")).join(" ");

export const Stretch = () => {
  const frame = useCurrentFrame();
  const { fps, width: W, height: H } = useVideoConfig();
  const [CX, CY] = [W / 2, H / 2];
  const s = frame / fps;
  const t = tension(s);
  const v = (tension(s + 0.05) - tension(s - 0.05)) / 0.1; // velocidad de la tensión (1/s)
  const k = 1 + 0.35 * t;
  const pitch = PITCH * k;
  const w = PITCH * (0.86 - 0.12 * Math.max(t, 0)); // el hilo adelgaza menos de lo que se abre la celda
  const c = (i: number) => (i - (N - 1) / 2) * pitch;
  const idx = [...Array(N).keys()];
  const el = Math.max(t, 0);

  // malla de distorsión: desplazamiento radial gaussiano en el domo central
  const bulge = (x: number, y: number) => {
    const r2 = x * x + y * y;
    const f = 1 + 0.18 * t * Math.exp(-r2 / (2 * 230 ** 2));
    return [CX + x * f, CY + y * f];
  };
  const mesh: string[] = [];
  for (let i = -6; i <= 6; i++) {
    const a: number[][] = [];
    const b: number[][] = [];
    for (let j = -24; j <= 24; j++) {
      a.push(bulge(i * 60, j * 15));
      b.push(bulge(j * 15, i * 60));
    }
    mesh.push(pts(a), pts(b));
  }

  // flechas: hacia fuera mientras tira, hacia dentro en el snap
  const dir = Math.sign(v);
  const ao = Math.min(Math.abs(v) / 1.2, 1);
  const arrows = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => {
    const r0 = 430 + (dir > 0 ? 0 : 90);
    const r1 = r0 + dir * 90;
    return { dx, dy, r0, r1 };
  });

  const crop = 380;
  const L = 60;

  return (
    <AbsoluteFill style={{ backgroundColor: "#060607" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          {/* volumen del hilo: sombra en los bordes, filo frío de la key rasante (arriba-derecha) */}
          <linearGradient id="warp" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#141315" />
            <stop offset="0.3" stopColor="#262527" />
            <stop offset="0.72" stopColor="#323135" />
            <stop offset="0.88" stopColor="#5C5D63" />
            <stop offset="1" stopColor="#161517" />
          </linearGradient>
          <linearGradient id="weft" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#121113" />
            <stop offset="0.3" stopColor="#232224" />
            <stop offset="0.72" stopColor="#2F2E32" />
            <stop offset="0.88" stopColor="#56575D" />
            <stop offset="1" stopColor="#141315" />
          </linearGradient>
          {/* estría de fibra a lo largo del hilo */}
          <pattern id="fibV" width={7} height={7} patternUnits="userSpaceOnUse">
            <path d="M3.5 0 L3.5 7" stroke="#000" strokeWidth={1.2} opacity={0.35} />
          </pattern>
          <pattern id="fibH" width={7} height={7} patternUnits="userSpaceOnUse">
            <path d="M0 3.5 L7 3.5" stroke="#000" strokeWidth={1.2} opacity={0.35} />
          </pattern>
          <linearGradient id="rake" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#DCEFFF" stopOpacity={0.14} />
            <stop offset="0.55" stopColor="#DCEFFF" stopOpacity={0} />
          </linearGradient>
          <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
            <stop offset="0.55" stopColor="#000" stopOpacity={0} />
            <stop offset="1" stopColor="#000" stopOpacity={0.75} />
          </radialGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation={3} result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx={-6} dy={8} stdDeviation={6} floodColor="#000" floodOpacity={0.7} />
          </filter>
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency={0.9} numOctaves={2} stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        <g transform={`translate(${CX} ${CY})`}>
          {/* trama (horizontal) */}
          {idx.map((j) => (
            <g key={`f${j}`}>
              <rect x={-W} y={c(j) - w / 2} width={2 * W} height={w} fill="url(#weft)" />
              <rect x={-W} y={c(j) - w / 2} width={2 * W} height={w} fill="url(#fibH)" />
            </g>
          ))}
          {/* urdimbre (vertical) */}
          {idx.map((i) => (
            <g key={`w${i}`} filter="url(#shadow)">
              <rect x={c(i) - w / 2} y={-H} width={w} height={2 * H} rx={w * 0.2} fill="url(#warp)" />
              <rect x={c(i) - w / 2} y={-H} width={w} height={2 * H} fill="url(#fibV)" />
            </g>
          ))}
          {/* tafetán: la trama sube por encima en celdas alternas */}
          {idx.flatMap((j) =>
            idx.filter((i) => (i + j) % 2 === 0).map((i) => (
              <g key={`o${i}-${j}`} filter="url(#shadow)">
                <rect x={c(i) - w / 2 - 6} y={c(j) - w / 2} width={w + 12} height={w} rx={w * 0.2} fill="url(#weft)" />
                <rect x={c(i) - w / 2 - 6} y={c(j) - w / 2} width={w + 12} height={w} fill="url(#fibH)" />
              </g>
            )),
          )}
          {/* núcleo de elastano: filamento translúcido que aparece al abrirse el tejido */}
          <g stroke="#EAF6FF" strokeWidth={1.4} opacity={0.08 + 0.42 * el} filter="url(#glow)">
            {idx.map((i) => <line key={`e${i}`} x1={c(i)} y1={-H} x2={c(i)} y2={H} strokeDasharray="22 10" />)}
            {idx.map((j) => <line key={`g${j}`} x1={-W} y1={c(j)} x2={W} y2={c(j)} strokeDasharray="22 10" />)}
          </g>
        </g>

        <rect width={W} height={H} fill="url(#rake)" />
        <rect width={W} height={H} fill="url(#vig)" />

        {/* motion graphics: malla de distorsión, vectores, crop 1:1 */}
        <g fill="none" stroke={theme.nieve} strokeWidth={1} strokeDasharray="4 6" opacity={0.1 + 0.3 * Math.abs(t)}>
          {mesh.map((m, i) => <polyline key={i} points={m} />)}
        </g>

        <g stroke={theme.nieve} strokeLinecap="round" opacity={ao}>
          {arrows.map(({ dx, dy, r0, r1 }) => {
            const [ax, ay, bx, by] = [CX + dx * r0, CY + dy * r0, CX + dx * r1, CY + dy * r1];
            const ang = Math.atan2(by - ay, bx - ax);
            const hd = (da: number) => `${bx - 20 * Math.cos(ang + da)},${by - 20 * Math.sin(ang + da)}`;
            return (
              <g key={`${dx}${dy}`}>
                {[1, 2, 3].map((e) => (
                  <line key={e} x1={ax - dx * dir * e * 16} y1={ay - dy * dir * e * 16} x2={bx - dx * dir * e * 16} y2={by - dy * dir * e * 16} strokeWidth={2} opacity={0.35 / e} />
                ))}
                <line x1={ax} y1={ay} x2={bx} y2={by} strokeWidth={4} filter="url(#glow)" />
                <polygon points={`${bx},${by} ${hd(0.45)} ${hd(-0.45)}`} fill={theme.nieve} stroke="none" filter="url(#glow)" />
              </g>
            );
          })}
        </g>

        <g stroke={theme.nieve} strokeWidth={2} fill="none" opacity={0.85}>
          {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => (
            <polyline key={`${sx}${sy}`} points={pts([[CX + sx * crop, CY + sy * (crop - L)], [CX + sx * crop, CY + sy * crop], [CX + sx * (crop - L), CY + sy * crop]])} />
          ))}
        </g>

        {/* solo la etiqueta superior izquierda: qué muestra el motion */}
        <text x={textSafe(W, H).x} y={textSafe(W, H).y + 24} fontFamily={theme.mono} letterSpacing={2} fill={theme.nieve} fontSize={22}>4-WAY STRETCH · STRETCHES +35% AND SNAPS BACK</text>

        <rect width={W} height={H} filter="url(#grain)" opacity={0.06} />
      </svg>
    </AbsoluteFill>
  );
};
