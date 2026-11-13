import { Easing, interpolate } from "remotion";

// Ciclo de una pieza de tecnología: estado completo (1) → se recoge (0) → vuelve a 1 y se queda.
// Empieza y termina en 1: el fotograma 0 (póster) muestra la pieza armada y el loop no salta.
export function breathe(frame: number, fps: number): number {
  return interpolate(frame, [1 * fps, 2 * fps, 2.5 * fps, 4.5 * fps], [1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.65, 0, 0.35, 1),
  });
}

// Movimiento periódico (gotas, vapor): `period` en fotogramas debe dividir la duración para que el loop cierre.
export const cycle = (frame: number, period: number, offset = 0) => (((frame + offset) % period) + period) % period / period;
