import { Easing, interpolate } from "remotion";
import { theme } from "../theme";
import { Arrow, C, Callout, CYAN, Crop, Frame, Graph, H0, KEY, P, pts, Rig, Timeline, Weave, Z } from "./kit";

// DWR SIN PFC (AV01): gotas caen, perlan con ángulo de contacto ~150° y ruedan fuera sin mojar el tejido.
const BEATS = [
  { t: 0.6, name: "IMPACTO", note: "Gotas en caída libre hacia el swatch · objetivos de impacto marcados" },
  { t: 2.2, name: "PERLADO", note: "Gotas esféricas sobre la cara · θ ≈ 150° · el tejido sigue seco" },
  { t: 4.2, name: "ROLL-OFF", note: "Inclinación 12° · las perlas ruedan y salen limpias · sin mancha" },
] as const;

const DROPS = [[-60, -40, 18], [50, 20, 15], [-10, 80, 20], [85, -75, 14], [-95, 55, 13], [20, -105, 16]] as const;

// Altura de la gota i (mundo) y desplazamiento de rodadura en el instante s.
const dropZ = (s: number, i: number) => {
  const hit = 1 + i * 0.05;
  if (s >= hit) return 0;
  const u = Math.max(0, (s - (hit - 0.9)) / 0.9);
  return 320 * (1 - u * u);
};
const roll = (s: number) => interpolate(s, [3.2, 5], [0, 340], { easing: Easing.in(Easing.quad), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// Mojado superficial: con DWR casi nulo; tejido sin tratar como referencia.
const wetDwr = (s: number) => (s > 1 && s < 1.6 ? 0.04 * Math.sin(((s - 1) / 0.6) * Math.PI) : 0);
const wetRaw = (s: number) => interpolate(s, [1, 3], [0, 1], { easing: Easing.out(Easing.cubic), extrapolateLeft: "clamp", extrapolateRight: "clamp" });

export const Dwr = ({ beat }: { beat: 0 | 1 | 2 }) => {
  const B = BEATS[beat];
  const s = B.t;
  const dx = roll(s);
  const c0 = P(DROPS[0][0], DROPS[0][1], Z);

  return (
    <Frame title="DWR SIN PFC" beat={beat} B={B}>
      <Weave n={12} />
      <polygon points={pts(KEY, P(H0, -H0, Z), P(H0, H0, Z), P(-H0 * 0.2, H0, Z))} fill="url(#cone)" />

      {DROPS.map(([x, y, r], i) => {
        const z = dropZ(s, i);
        const xr = x + dx;
        const gone = xr - r > H0 + 40;
        const o = interpolate(xr, [H0, H0 + 60], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
        if (gone) return null;
        const base = P(xr, y, Z);
        const ctr = P(xr, y, Z + z + r * 0.9);
        const R = r * C.s * 1.25;
        return (
          <g key={i} opacity={o}>
            {z > 0 && beat === 0 && (
              <g stroke={CYAN} fill="none" opacity={0.5}>
                <ellipse cx={base[0]} cy={base[1]} rx={R * 1.4} ry={R * 0.7} strokeDasharray="4 4" />
                <line x1={base[0] - R * 1.8} y1={base[1]} x2={base[0] + R * 1.8} y2={base[1]} strokeWidth={0.8} />
              </g>
            )}
            <ellipse cx={base[0]} cy={base[1]} rx={R * (z > 0 ? 0.6 : 0.95)} ry={R * (z > 0 ? 0.3 : 0.42)} fill="#000" opacity={z > 0 ? 0.3 : 0.6} />
            {z > 0 && <line x1={ctr[0]} y1={ctr[1] - R} x2={ctr[0]} y2={ctr[1] - R - 90} stroke={CYAN} strokeWidth={2} strokeDasharray="10 6" opacity={0.6} />}
            {dx > 0 && <line x1={P(x, y, Z)[0]} y1={P(x, y, Z)[1]} x2={base[0]} y2={base[1]} stroke={CYAN} strokeWidth={2} strokeDasharray="3 7" opacity={0.6} />}
            {z > 0 ? (
              <ellipse cx={ctr[0]} cy={ctr[1]} rx={R * 0.82} ry={R * 1.12} fill="url(#drop)" stroke="#CFF6FF" strokeWidth={1} />
            ) : (
              <ellipse cx={ctr[0]} cy={ctr[1] + R * 0.06} rx={R} ry={R * 0.94} fill="url(#drop)" stroke="#CFF6FF" strokeWidth={1} />
            )}
          </g>
        );
      })}

      {/* ángulo de contacto sobre la gota 0 */}
      {beat === 1 && (
        <g stroke={theme.nieve} fill="none">
          <line x1={c0[0] - 70} y1={c0[1]} x2={c0[0] + 70} y2={c0[1]} strokeWidth={1.2} />
          <line x1={c0[0] + 9} y1={c0[1]} x2={c0[0] + 9 - 40 * Math.cos(Math.PI / 6)} y2={c0[1] - 40 * Math.sin(Math.PI / 6)} strokeWidth={1.6} />
          <path d={`M ${c0[0] + 39} ${c0[1]} A 30 30 0 0 0 ${c0[0] + 9 - 30 * Math.cos(Math.PI / 6)} ${c0[1] - 15}`} stroke={CYAN} strokeWidth={2} />
        </g>
      )}

      {beat === 2 && <Arrow a={[-H0, 150, Z + 10]} b={[H0 + 80, 150, Z + 10]} />}

      <Rig cam="side" />
      <Crop at={P(0, 0, Z + 20)} />

      <Callout from={P(232, -60, Z + 240)} to={[1000, 230]} text="100mm MACRO // 240fps HIGH-SPEED" />
      <Callout from={P(-H0, H0, Z)} to={[330, 820]} text="CARA STRETCH · DWR SIN PFC" />
      {beat === 0 && <Callout from={P(-60, -40, Z + 200)} to={[330, 420]} text="CAÍDA LIBRE · 6 GOTAS" />}
      {beat === 1 && <Callout from={[c0[0] - 30, c0[1] - 18]} to={[330, 520]} text="θ CONTACTO ≈ 150°" c={CYAN} />}
      {beat === 2 && <Callout from={P(40, 150, Z + 10)} to={[330, 600]} text="TILT 12° · ROLL-OFF · SECO" c={CYAN} />}

      <Graph s={s} f={wetDwr} ghost={wetRaw} title="MOJADO SUPERFICIAL · DWR vs SIN TRATAR" hi="100%" lo="0%" />
      <Timeline s={s} segs={[[0, 1, "FALL"], [1, 1.4, "IMPACT"], [1.4, 3.2, "BEAD · θ 150°"], [3.2, 5, "TILT · ROLL-OFF"], [5, 6, "DRY → LOOP"]]} />
    </Frame>
  );
};
