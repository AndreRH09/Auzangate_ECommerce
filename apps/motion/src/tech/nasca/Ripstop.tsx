import { Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { cl, H, NascaFrame, rnd, W } from "./frame";

// NASCA · RIPSTOP 40D (AN01): macro cenital de la tela liviana bajo sol rasante de desierto. Una espina engancha el
// centro de una celda, la tela se tensa, el rasgón corre hacia los dos lados y choca con los hilos de refuerzo:
// se frena en seco y el contorno de esa celda se enciende, el daño queda encerrado en ella. La cámara se aleja y
// muestra la retícula repetida (es una tela fina, casi sin peso); una banda de sol la recorre y funde a negro.
const C = { x: W / 2, y: H / 2 };
const P = 300; // paso de la retícula: la celda del enganche va de C ± 150
const L = C.x - P / 2;
const R = C.x + P / 2;
const SNAG = 0.7;
const RUN = 1.1;
const HIT = 2.5;
const SEG = 18;
const PTS = Array.from({ length: Math.round(P / SEG) + 1 }, (_, i) => ({ x: L + i * SEG, y: C.y + (i % 2 ? 5 : -5) + (rnd(i) - 0.5) * 7 }));

export const Ripstop = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = frame / fps;

  // frente: acelera desde el enganche y se detiene a 4 px del refuerzo, con un micro-rebote
  const u = Math.max(0, Math.min(1, (s - RUN) / (HIT - RUN)));
  const back = s > HIT ? Math.exp(-8 * (s - HIT)) * Math.sin(2 * Math.PI * 2.4 * (s - HIT)) * 4 : 0;
  const reach = (P / 2 - 4) * u * u - back;
  const l = C.x - reach;
  const r = C.x + reach;
  const hole = interpolate(s, [SNAG, RUN], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const open = (x: number) => (x < l || x > r ? 0 : Math.min(9, Math.min(x - l, r - x) * 0.07) * hole);
  const live = [{ x: l, y: C.y }, ...PTS.filter((q) => q.x > l && q.x < r), { x: r, y: C.y }];
  const top = live.map((q) => `${q.x.toFixed(1)},${(q.y - open(q.x)).toFixed(1)}`).join(" ");
  const bot = [...live].reverse().map((q) => `${q.x.toFixed(1)},${(q.y + open(q.x)).toFixed(1)}`).join(" ");

  // contorno de la celda: se traza desde los dos puntos de choque hacia arriba y abajo hasta cerrarse
  const trace = interpolate(s, [HIT, HIT + 0.9], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
  const cellGlow = interpolate(s, [HIT, HIT + 0.2, 4.6, 5.3], [0, 1, 0.55, 0], cl);
  const half = 2 * P; // medio perímetro de la celda
  // tensión: la tela se frunce hacia la espina antes de ceder; se suelta cuando el rasgón queda encerrado
  const pull = interpolate(s, [0.4, SNAG, HIT, HIT + 0.4], [0, 1, 1, 0], cl);

  // cámara: macro cerrado sobre la celda → se aleja y deja ver la retícula repetida
  const zoom = interpolate(s, [0, HIT], [1.5, 1.6], cl) - interpolate(s, [HIT + 0.4, 5.0], [0, 0.82], { ...cl, easing: Easing.inOut(Easing.sin) });
  const shake = s > HIT ? Math.exp(-10 * (s - HIT)) * Math.sin(s * 90) * 2 : 0;
  const sweep = interpolate(s, [4.2, 5.4], [-0.3, 1.3], { ...cl, easing: Easing.inOut(Easing.sin) });

  const lines = Array.from({ length: 13 }, (_, i) => (i - 6) * P);
  const yarn = (x1: number, y1: number, x2: number, y2: number, k: string) => (
    <g key={k} filter="url(#relief)">
      {/* refuerzo 40D: dos hilos gruesos paralelos, con brillo del sol en el borde superior izquierdo */}
      {[-3, 3].map((d) => {
        const dx = x1 === x2 ? d : 0;
        const dy = y1 === y2 ? d : 0;
        return (
          <g key={d}>
            <line x1={x1 + dx} y1={y1 + dy} x2={x2 + dx} y2={y2 + dy} stroke="#36363A" strokeWidth={4.5} />
            <line x1={x1 + dx - 1} y1={y1 + dy - 1} x2={x2 + dx - 1} y2={y2 + dy - 1} stroke="#8F8A82" strokeWidth={1} opacity={0.55} />
          </g>
        );
      })}
    </g>
  );

  return (
    <NascaFrame title="40D RIPSTOP · THE TEAR STOPS AT THE GRID" s={s} frame={frame}>
      <defs>
        {/* tafetán 40D: hilo fino, cruces con un brillo mínimo */}
        <pattern id="weave" width="5" height="5" patternUnits="userSpaceOnUse">
          <rect width="5" height="5" fill="#19191B" />
          <path d="M0 1.2 H5" stroke="#26262A" strokeWidth="1.1" />
          <path d="M3.8 0 V5" stroke="#212125" strokeWidth="1" />
          <rect x="0" y="0.8" width="1.6" height="0.7" fill="#34343A" />
        </pattern>
        <linearGradient id="band" x1="0" y1="0" x2="1" y2="0.3">
          <stop offset={Math.max(0, sweep - 0.12)} stopColor="#FFE6C4" stopOpacity="0" />
          <stop offset={Math.min(1, Math.max(0, sweep))} stopColor="#FFE6C4" stopOpacity="0.12" />
          <stop offset={Math.min(1, sweep + 0.12)} stopColor="#FFE6C4" stopOpacity="0" />
        </linearGradient>
      </defs>

      <g transform={`translate(${C.x + shake} ${C.y}) scale(${zoom}) translate(${-C.x} ${-C.y})`}>
        <rect x={-W} y={-H} width={3 * W} height={3 * H} fill="url(#weave)" />

        {/* fruncido de tensión hacia la espina */}
        {pull > 0 && [-60, -34, -14, 14, 34, 60].map((d) => (
          <path key={d} d={`M${L + 10} ${C.y + d} Q ${C.x} ${C.y + d * (1 - 0.35 * pull)} ${R - 10} ${C.y + d}`} fill="none" stroke="#4A4A50" strokeWidth={1.2} opacity={0.5 * pull} />
        ))}

        {/* rasgón: vacío negro con labios que toman el sol y fibras sueltas */}
        {hole > 0 && (
          <g>
            <polygon points={`${top} ${bot}`} fill="#000" />
            <polyline points={top} fill="none" stroke="#7A766F" strokeWidth={1.3} />
            <polyline points={bot} fill="none" stroke="#3A3A3E" strokeWidth={1.1} />
            {live.map((q, i) => {
              const o = open(q.x);
              if (o < 3 || i % 2) return null;
              const up = (i / 2) % 2 === 0;
              const len = 7 + rnd(q.x) * 12;
              const sway = Math.sin(s * 3 + q.x * 0.07) * 2.5; // el viento mueve las fibras
              return <path key={q.x} d={`M${q.x} ${up ? q.y - o : q.y + o} q ${sway} ${(up ? len : -len) * 0.5} ${sway * 2} ${up ? len : -len}`} fill="none" stroke="#A9A39A" strokeWidth={0.8} opacity={0.75} />;
            })}
          </g>
        )}

        {/* retícula de refuerzo */}
        {lines.map((d) => yarn(-W, C.y - P / 2 + d, 2 * W, C.y - P / 2 + d, `h${d}`))}
        {lines.map((d) => yarn(L + d, -H, L + d, 2 * H, `v${d}`))}

        {/* la celda que encierra el daño: se traza desde los dos choques */}
        {trace > 0 && (
          <g fill="none" stroke="#FFFFFF" opacity={cellGlow}>
            {[L, R].map((x) => [-1, 1].map((dir) => {
              // desde (x, C.y) recorre medio lado vertical, el lado horizontal y se junta con el otro trazo
              const d = `M${x} ${C.y} V${C.y + dir * (P / 2)} H${C.x}`;
              return (
                <g key={`${x}${dir}`}>
                  <path d={d} strokeWidth={10} opacity={0.5} filter="url(#soft)" strokeDasharray={`${half / 2} ${half}`} strokeDashoffset={(half / 2) * (1 - trace)} />
                  <path d={d} strokeWidth={2.4} strokeDasharray={`${half / 2} ${half}`} strokeDashoffset={(half / 2) * (1 - trace)} />
                </g>
              );
            }))}
          </g>
        )}

        {/* espina: punto de enganche y onda de impacto; los frentes brillan mientras corren */}
        {s > 0.5 && s < HIT + 0.2 && <circle cx={C.x} cy={C.y} r={4} fill="#FFFFFF" opacity={interpolate(s, [0.5, SNAG, HIT, HIT + 0.2], [0, 1, 1, 0], cl)} />}
        {(() => {
          const p = interpolate(s, [SNAG, SNAG + 0.7], [0, 1], { ...cl, easing: Easing.out(Easing.cubic) });
          return p > 0 && p < 1 ? <circle cx={C.x} cy={C.y} r={120 * p} fill="none" stroke="#FFFFFF" strokeWidth={1.4} opacity={1 - p} /> : null;
        })()}
        {s > RUN && s < HIT + 0.12 && [l, r].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={C.y} r={9} fill="#FFFFFF" opacity={0.5} filter="url(#soft)" />
            <circle cx={x} cy={C.y} r={3} fill="#FFFFFF" />
          </g>
        ))}

        <rect x={-W} y={-H} width={3 * W} height={3 * H} fill="url(#band)" />
      </g>
    </NascaFrame>
  );
};
