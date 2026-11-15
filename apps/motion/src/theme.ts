import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

// Tokens de la marca (ClaudeContext/auzangate-design-system.md): una sola tinta, línea blanca sobre granito.
export const theme = {
  granito: "#262527",
  nieve: "#FFFFFF",
  pizarra: "#606263",
  lineaTenue: "#B9BBBB",
  // las piezas solo llevan etiquetas de datos: Geist Mono (Archivo no aparece en los videos)
  mono: loadGeistMono("normal", { weights: ["400", "500"], subsets: ["latin"] }).fontFamily,
} as const;

// Lienzo de las piezas de tecnología: proporción de la tarjeta de la página (400 × 440).
// Zona segura del texto: la web muestra los videos con object-fit: cover en contenedores de 1:1 a 16:9,
// así que solo es visible siempre el centro (ancho = alto en 1:1, alto = ancho/1.78 en 16:9).
// Todo texto va arriba a la izquierda DE ESA ZONA, con margen m, y cabe en su ancho w.
export const textSafe = (width: number, height: number, m = 40) => {
  const vw = Math.min(width, height); // contenedor 1:1
  const vh = Math.min(height, width / 1.78); // contenedor 16:9
  return { x: (width - vw) / 2 + m, y: (height - vh) / 2 + m, w: vw - 2 * m };
};

export const TECH = { width: 1080, height: 1188, fps: 30 } as const;
