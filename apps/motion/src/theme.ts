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
export const TECH = { width: 1080, height: 1188, fps: 30 } as const;
