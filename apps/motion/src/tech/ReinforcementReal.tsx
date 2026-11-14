import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// REFUERZOS (versión render, plan "extreme macro probe-lens tracking shot"): 7 s, loop sin corte.
// Ida (0–3.5 s): desde el ripstop y la costura doble del muslo, en eje de 35°, sobre el parche de relieve hasta la cremallera.
// Al pasar el lente, 3 granos de granito y unos cristales de hielo ruedan hacia la cremallera. Vuelta (3.5–7 s) por el mismo eje.
// aw04-knee-dry.png = el macro sin esos 3 granos (scripts/prep-knee-macro.py); los granos son sprites recortados del mismo render.
// Al inicio del loop los granos vuelven a su sitio fuera de cuadro (el encuadre inicial no llega a x > 698).
const IMG = 1024;
const SCALE = 1.55; // zoom sobre el render: la vista cubre ~697×766 px del original
const DIR: [number, number] = [Math.cos((35 * Math.PI) / 180), Math.sin((35 * Math.PI) / 180)];
const START: [number, number] = [350, 400]; // centro de cámara en px del render
const LENGTH = 398; // hasta (676, 628): el borde de la vista toca el borde del render
const LOOP = 210;

const GRAINS = [
  { src: "grit-0", x: 842, y: 490, r: 17, at: 52, dur: 46, dx: 0.32, dist: 170 },
  { src: "grit-1", x: 927, y: 385, r: 16, at: 60, dur: 50, dx: 0.18, dist: 190 },
  { src: "grit-2", x: 815, y: 577, r: 13, at: 66, dur: 42, dx: 0.4, dist: 150 },
];
const ICE = Array.from({ length: 4 }, (_, i) => ({
  x: 790 + random(`ix${i}`) * 130, y: 430 + random(`iy${i}`) * 140,
  s: 2.2 + random(`is${i}`) * 2, at: 55 + i * 5, dur: 38 + Math.floor(random(`id${i}`) * 12),
  dx: 0.2 + random(`iv${i}`) * 0.25, dist: 110 + random(`il${i}`) * 80, rot: random(`ir${i}`) * 360,
}));
const friction = Easing.bezier(0.35, 0, 0.3, 1); // arranca suave, frena por roce

export const ReinforcementReal = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const p = (1 - Math.cos((2 * Math.PI * frame) / LOOP)) / 2; // ida y vuelta, velocidad cero en los extremos
  const cx = START[0] + DIR[0] * LENGTH * p;
  const cy = START[1] + DIR[1] * LENGTH * p;

  const roll = (at: number, dur: number) => interpolate(frame, [at, at + dur], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: friction });

  const scene = (blur: boolean) => (
    <AbsoluteFill
      style={{
        transform: `translate(${width / 2 - cx * SCALE}px, ${height / 2 - cy * SCALE}px) scale(${SCALE})`,
        transformOrigin: "0 0",
        filter: blur ? "blur(5px) brightness(0.9)" : undefined,
      }}
    >
      <Img src={staticFile("ref/aw04-knee-dry.png")} style={{ position: "absolute", width: IMG, height: IMG }} />
      {GRAINS.map((g, i) => {
        const k = roll(g.at, g.dur);
        const n = Math.hypot(g.dx, 1);
        const d = g.dist * k;
        const x = g.x + (g.dx / n) * d;
        const y = g.y + (1 / n) * d;
        const R = g.r + 6;
        return (
          <div key={i} style={{ position: "absolute", left: x - R, top: y - R, width: R * 2, height: R * 2 }}>
            {/* sombra de contacto bajo el grano (como en el render) */}
            <div style={{ position: "absolute", left: R - g.r, top: R + g.r * 0.45, width: g.r * 2, height: g.r * 0.7, borderRadius: "50%", background: "rgba(0,0,0,0.6)", filter: "blur(2.5px)" }} />
            {/* sin girar: la luz del render viene de arriba-derecha; solo un leve bamboleo al deslizarse */}
            <Img src={staticFile(`ref/${g.src}.png`)} style={{ position: "absolute", width: R * 2, height: R * 2, transform: `rotate(${Math.sin(d / 9) * 7 * (1 - k)}deg)` }} />
          </div>
        );
      })}
      <svg width={IMG} height={IMG} style={{ position: "absolute", overflow: "visible" }}>
        {/* cristales de hielo: astillas translúcidas que ruedan con la gravilla */}
        {ICE.map((c, i) => {
          const k = roll(c.at, c.dur);
          const n = Math.hypot(c.dx, 1);
          const x = c.x + (c.dx / n) * c.dist * k;
          const y = c.y + (1 / n) * c.dist * k;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${c.rot + k * 240}) scale(${c.s})`}>
              <polygon points="0,-1.6 1.2,-0.3 0.7,1.4 -0.9,1.1 -1.3,-0.5" fill="#E9F1F5" opacity={0.75} />
              <polygon points="0,-1.6 1.2,-0.3 0.2,0" fill="#FFFFFF" opacity={0.95} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "#262527", overflow: "hidden" }}>
      {scene(false)}
      {/* profundidad de campo f/2.8: franja nítida en diagonal al eje de 35°, desenfoque hacia las esquinas */}
      <AbsoluteFill style={{ WebkitMaskImage: "linear-gradient(125deg, black 0%, transparent 32%, transparent 68%, black 100%)" }}>{scene(true)}</AbsoluteFill>
      {/* luz rasante fría desde la derecha y caída a negro en los bordes */}
      <AbsoluteFill style={{ background: "linear-gradient(260deg, rgba(210,226,255,0.22) 0%, transparent 50%, rgba(0,0,0,0.35) 100%)", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 58%, rgba(0,0,0,0.5) 100%)" }} />
      {/* grano de película 35 mm */}
      <svg width={width} height={height} style={{ position: "absolute", opacity: 0.08, mixBlendMode: "overlay" }}>
        <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={frame % 97} /></filter>
        <rect width="100%" height="100%" filter="url(#grain)" />
      </svg>
    </AbsoluteFill>
  );
};
