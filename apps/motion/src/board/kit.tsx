import { AbsoluteFill, Easing, interpolate } from "remotion";
import { theme } from "../theme";

// Kit del VICUS BOARD: plató isométrico, rig, key, gráfica, timeline y etiquetas compartidos por todas las piezas.

export const SLATE = "#141416";
export const CYAN = "#9FEAFF";
export const WOOL = "#F2C28B"; // acento CARAL
export const ALU = ["#C9CDD2", "#8E949B", "#5E636A"]; // top / lado claro / lado oscuro
const RIG = ["#3A3B40", "#2A2B2F", "#1E1F22"];

export type Pt = readonly [number, number];
export type Beat = { t: number; name: string; note: string };
export type Seg = [number, number, string];

// Envolvente pull → hold → snap-back con micro-rebote (0..1). La usan la tela, la gráfica y el plano final.
export const tension = (s: number) => {
  if (s < 1) return 0;
  if (s < 2.8) return interpolate(s, [1, 2.8], [0, 1], { easing: Easing.inOut(Easing.cubic) });
  if (s < 3.6) return 1;
  if (s < 4.2) return interpolate(s, [3.6, 4.2], [1, 0], { easing: Easing.in(Easing.quad) });
  const u = s - 4.2;
  return -0.1 * Math.exp(-2.6 * u) * Math.sin(2 * Math.PI * 1.5 * u);
};

// Proyección isométrica: mundo (x, y, z) → pantalla.
export const C = { x: 800, y: 660, s: 0.78 };
export const P = (x: number, y: number, z = 0): Pt => [C.x + (x - y) * 0.866 * C.s, C.y + (x + y) * 0.5 * C.s - z * C.s];
export const pts = (...p: Pt[]) => p.map((q) => q.join(",")).join(" ");
export const quad = (h: number, z: number, x = 0, y = 0) => pts(P(x - h, y - h, z), P(x + h, y - h, z), P(x + h, y + h, z), P(x - h, y + h, z));

export const H0 = 140; // medio lado del swatch
export const Z = 22; // altura del plató
export const S = 300; // medio lado del plató
export const KEY: Pt = [1260, 120];

export const Box = ({ x, y, z, w, d, h, c = ALU, o = 1 }: { x: number; y: number; z: number; w: number; d: number; h: number; c?: string[]; o?: number }) => {
  const [x0, x1, y0, y1, z1] = [x - w / 2, x + w / 2, y - d / 2, y + d / 2, z + h];
  return (
    <g strokeWidth={0.6} stroke="#00000055" opacity={o}>
      <polygon points={pts(P(x1, y0, z), P(x1, y1, z), P(x1, y1, z1), P(x1, y0, z1))} fill={c[1]} />
      <polygon points={pts(P(x0, y1, z), P(x1, y1, z), P(x1, y1, z1), P(x0, y1, z1))} fill={c[2]} />
      <polygon points={pts(P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1))} fill={c[0]} />
    </g>
  );
};

// Flecha cinética entre dos puntos del mundo, con ecos de motion-blur detrás.
type V3 = readonly [number, number, number];
export const Arrow = ({ a, b, o = 1, c = CYAN, w = 5 }: { a: V3; b: V3; o?: number; c?: string; w?: number }) => {
  const at = (k: number) => P(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  const [p, q] = [at(0), at(1)];
  const ang = Math.atan2(q[1] - p[1], q[0] - p[0]);
  const head = (da: number) => [q[0] - 22 * Math.cos(ang + da), q[1] - 22 * Math.sin(ang + da)].join(",");
  return (
    <g opacity={o} strokeLinecap="round">
      {[3, 2, 1].map((e) => {
        const [m, n] = [at(-e * 0.12), at(1 - e * 0.12)];
        return <line key={e} x1={m[0]} y1={m[1]} x2={n[0]} y2={n[1]} stroke={c} strokeWidth={2} opacity={0.12 * (4 - e)} />;
      })}
      <line x1={p[0]} y1={p[1]} x2={q[0]} y2={q[1]} stroke={c} strokeWidth={w} filter="url(#glow)" />
      <polygon points={`${q.join(",")} ${head(0.45)} ${head(-0.45)}`} fill={c} filter="url(#glow)" />
    </g>
  );
};

export const Label = ({ x, y, children, c = theme.lineaTenue, size = 15, anchor }: { x: number; y: number; children: React.ReactNode; c?: string; size?: number; anchor?: "start" | "end" | "middle" }) => (
  <text x={x} y={y} fill={c} fontFamily={theme.mono} fontSize={size} letterSpacing={1.6} textAnchor={anchor}>
    {children}
  </text>
);

export const Callout = ({ from, to, text, c }: { from: Pt; to: Pt; text: string; c?: string }) => {
  const right = to[0] > from[0];
  return (
    <g>
      <circle cx={from[0]} cy={from[1]} r={3.5} fill={c ?? theme.nieve} />
      <polyline points={pts(from, to, [to[0] + (right ? 24 : -24), to[1]])} fill="none" stroke={theme.pizarra} strokeWidth={1.2} />
      <Label x={right ? to[0] + 32 : to[0] - 32} y={to[1] + 5} c={c} anchor={right ? "start" : "end"}>{text}</Label>
    </g>
  );
};

// Swatch de tafetán (urdimbre/trama con cruce alterno). k = escala, open = apertura de celda 0..1.
export const Weave = ({ k = 1, open = 0, z = Z, n = 10, elastane = 0 }: { k?: number; open?: number; z?: number; n?: number; elastane?: number }) => {
  const h = H0 * k;
  const pitch = (2 * h) / n;
  const w = ((2 * H0) / n) * (0.84 - 0.12 * open);
  const c = (i: number) => -h + (i + 0.5) * pitch;
  const warp = (i: number) => pts(P(c(i) - w / 2, -h, z), P(c(i) + w / 2, -h, z), P(c(i) + w / 2, h, z), P(c(i) - w / 2, h, z));
  const weft = (j: number, x0 = -h, x1 = h) => pts(P(x0, c(j) - w / 2, z), P(x1, c(j) - w / 2, z), P(x1, c(j) + w / 2, z), P(x0, c(j) + w / 2, z));
  const idx = [...Array(n).keys()];
  return (
    <g>
      <polygon points={quad(h, z)} fill="#060607" />
      {idx.map((j) => <polygon key={`f${j}`} points={weft(j)} fill="#2C2B2F" />)}
      {idx.map((i) => <polygon key={`w${i}`} points={warp(i)} fill="#38373C" stroke="#4A494F" strokeWidth={0.5} />)}
      {idx.flatMap((j) =>
        idx.filter((i) => (i + j) % 2 === 0).map((i) => (
          <polygon key={`o${i}-${j}`} points={weft(j, c(i) - w / 2 - 1, c(i) + w / 2 + 1)} fill="#424147" stroke="#5A5960" strokeWidth={0.5} />
        )),
      )}
      {elastane > 0 && (
        <g stroke={CYAN} strokeWidth={1} opacity={elastane} strokeDasharray="5 4">
          {idx.map((i) => {
            const [a, b] = [P(c(i), -h, z + 0.5), P(c(i), h, z + 0.5)];
            return <line key={`e${i}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
          })}
          {idx.map((j) => {
            const [a, b] = [P(-h, c(j), z + 0.5), P(h, c(j), z + 0.5)];
            return <line key={`g${j}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} />;
          })}
        </g>
      )}
      <polyline points={pts(P(h, -h, z), P(h, h, z))} stroke="#D8F6FF" strokeWidth={2} opacity={0.6} />
    </g>
  );
};

// Rig de cámara: "top" = poste + brazo cenital; "side" = trípode a 3/4 desde la derecha.
export const Rig = ({ cam, aim = Z }: { cam: "top" | "side"; aim?: number }) => {
  const center = P(0, 0, aim);
  if (cam === "top") {
    const lens = P(0, 0, 360);
    return (
      <g>
        <Box x={-S + 30} y={0} z={Z} w={16} d={16} h={430} c={RIG} />
        <Box x={(-S + 30) / 2} y={0} z={Z + 430} w={S - 30} d={12} h={10} c={RIG} />
        <Box x={0} y={0} z={Z + 380} w={70} d={70} h={50} c={["#4A4B50", "#36373B", "#26272A"]} />
        <Box x={0} y={0} z={Z + 330} w={44} d={44} h={50} c={["#2E2F33", "#222326", "#18191B"]} />
        <line x1={lens[0]} y1={lens[1] + 4} x2={center[0]} y2={center[1]} stroke={theme.nieve} strokeDasharray="2 7" opacity={0.6} />
      </g>
    );
  }
  const lens = P(232, -60, Z + 215);
  return (
    <g>
      <Box x={290} y={-60} z={Z} w={14} d={14} h={190} c={RIG} />
      <Box x={290} y={-60} z={Z + 190} w={60} d={60} h={48} c={["#4A4B50", "#36373B", "#26272A"]} />
      <Box x={246} y={-60} z={Z + 196} w={34} d={38} h={36} c={["#2E2F33", "#222326", "#18191B"]} />
      <line x1={lens[0]} y1={lens[1]} x2={center[0]} y2={center[1]} stroke={theme.nieve} strokeDasharray="2 7" opacity={0.6} />
    </g>
  );
};

export const Crop = ({ at, r = 170 }: { at: Pt; r?: number }) => (
  <g stroke={theme.nieve} strokeWidth={2} fill="none" opacity={0.8}>
    {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
      const l = 34;
      return <polyline key={`${sx}${sy}`} points={pts([at[0] + sx * r, at[1] + sy * (r - l)], [at[0] + sx * r, at[1] + sy * r], [at[0] + sx * (r - l), at[1] + sy * r])} />;
    })}
  </g>
);

// Gráfica del loop: curva principal (cian) y opcional de referencia (gris punteada).
export const Graph = ({ s, f, ghost, title, hi, lo, handles, c = CYAN }: { s: number; f: (s: number) => number; ghost?: (s: number) => number; title: string; hi: string; lo: string; handles?: [number, number]; c?: string }) => {
  const [x0, y0, W, Hh] = [1340, 330, 500, 250];
  const X = (t: number) => x0 + (t / 6) * W;
  const Y = (v: number) => y0 + Hh * 0.82 - v * Hh * 0.64;
  const line = (g: (s: number) => number) => [...Array(241).keys()].map((i) => `${X(i / 40)},${Y(g(i / 40))}`).join(" ");
  return (
    <g>
      <rect x={x0 - 30} y={y0 - 70} width={W + 60} height={Hh + 130} rx={10} fill="#1B1B1E" stroke="#2C2C31" />
      <Label x={x0} y={y0 - 34} c={theme.nieve} size={17}>{title}</Label>
      <line x1={x0} y1={Y(0)} x2={x0 + W} y2={Y(0)} stroke={theme.pizarra} strokeDasharray="3 4" />
      <line x1={x0} y1={Y(1)} x2={x0 + W} y2={Y(1)} stroke="#2E2E33" strokeDasharray="3 4" />
      <Label x={x0 + W + 8} y={Y(1) + 5} size={12}>{hi}</Label>
      <Label x={x0 + W + 8} y={Y(0) + 5} size={12}>{lo}</Label>
      {handles && (
        <g>
          <g stroke={theme.pizarra} strokeWidth={1}>
            <line x1={X(handles[0])} y1={Y(f(handles[0]))} x2={X((handles[0] + handles[1]) / 2)} y2={Y(f(handles[0]))} />
            <line x1={X(handles[1])} y1={Y(f(handles[1]))} x2={X((handles[0] + handles[1]) / 2)} y2={Y(f(handles[1]))} />
          </g>
          <circle cx={X((handles[0] + handles[1]) / 2)} cy={Y(f(handles[0]))} r={4} fill={SLATE} stroke={theme.lineaTenue} />
          <circle cx={X((handles[0] + handles[1]) / 2)} cy={Y(f(handles[1]))} r={4} fill={SLATE} stroke={theme.lineaTenue} />
        </g>
      )}
      {ghost && <polyline points={line(ghost)} fill="none" stroke={theme.pizarra} strokeWidth={2} strokeDasharray="6 5" />}
      <polyline points={line(f)} fill="none" stroke={c} strokeWidth={2.5} />
      <line x1={X(s)} y1={y0 - 10} x2={X(s)} y2={y0 + Hh} stroke={theme.nieve} strokeWidth={1} />
      <circle cx={X(s)} cy={Y(f(s))} r={7} fill={theme.nieve} filter="url(#glow)" />
      {[0, 1, 2, 3, 4, 5, 6].map((t) => <Label key={t} x={X(t) - 6} y={y0 + Hh + 30} size={12}>{`${t}s`}</Label>)}
    </g>
  );
};

export const Timeline = ({ s, segs, c = CYAN }: { s: number; segs: Seg[]; c?: string }) => {
  const [x0, y0, W] = [120, 1000, 1680];
  const X = (t: number) => x0 + (t / 6) * W;
  return (
    <g>
      {segs.map(([a, b, n]) => (
        <g key={n}>
          <rect x={X(a) + 2} y={y0} width={X(b) - X(a) - 4} height={8} rx={4} fill={s >= a && s < b ? c : "#2A2A2F"} />
          <Label x={X(a) + 4} y={y0 - 12} size={12} c={s >= a && s < b ? theme.nieve : theme.pizarra}>{n}</Label>
        </g>
      ))}
      <polygon points={`${X(s)},${y0 + 12} ${X(s) - 8},${y0 + 26} ${X(s) + 8},${y0 + 26}`} fill={theme.nieve} />
      <Label x={x0} y={y0 + 40} size={13}>LOOP 0s - 6s</Label>
      <Label x={x0 + W} y={y0 + 40} size={13} anchor="end">{`t = ${s.toFixed(1)}s`}</Label>
    </g>
  );
};

// Marco del panel: defs, encabezado, plató mate, key, grano. Los hijos se dibujan sobre el plató.
export const Frame = ({ title, beat, B, children, keyTo, series = "VICUS" }: { title: string; beat: number; B: Beat; children: React.ReactNode; keyTo?: string; series?: string }) => (
  <AbsoluteFill style={{ backgroundColor: SLATE }}>
    <svg viewBox="0 0 1920 1080" width="100%" height="100%">
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation={4} result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <filter id="soft"><feGaussianBlur stdDeviation={18} /></filter>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency={0.85} numOctaves={2} stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <linearGradient id="cone" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DDF5FF" stopOpacity={0.22} />
          <stop offset="1" stopColor="#DDF5FF" stopOpacity={0.02} />
        </linearGradient>
        <radialGradient id="drop" cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity={0.95} />
          <stop offset="0.25" stopColor={CYAN} stopOpacity={0.55} />
          <stop offset="1" stopColor="#1C3A44" stopOpacity={0.5} />
        </radialGradient>
      </defs>

      <Label x={120} y={92} c={theme.nieve} size={22}>{`${series} BOARD · ${title} · PANEL 0${beat + 1}/03`}</Label>
      <Label x={120} y={126} size={16}>{`${B.t.toFixed(1)}s  ${B.name} — ${B.note}`}</Label>

      <ellipse cx={C.x} cy={C.y + 40} rx={520} ry={190} fill="#000" opacity={0.55} filter="url(#soft)" />
      <polygon points={pts(P(S, -S, 0), P(S, S, 0), P(S, S, -Z), P(S, -S, -Z))} fill="#141416" />
      <polygon points={pts(P(-S, S, 0), P(S, S, 0), P(S, S, -Z), P(-S, S, -Z))} fill="#0C0C0E" />
      <polygon points={quad(S, Z)} fill="#1D1D20" />
      <polygon points={pts(P(S, -S, 0), P(S, S, 0), P(S, S, Z), P(S, -S, Z))} fill="#18181B" />
      <polygon points={pts(P(-S, S, 0), P(S, S, 0), P(S, S, Z), P(-S, S, Z))} fill="#101012" />

      {children}

      <circle cx={KEY[0]} cy={KEY[1]} r={10} fill="#E6F8FF" filter="url(#glow)" />
      <Callout from={KEY} to={[1340, 180]} text={keyTo ?? "KEY 10° · COOL RAKE"} />
      <rect width={1920} height={1080} filter="url(#grain)" opacity={0.07} />
    </svg>
  </AbsoluteFill>
);
