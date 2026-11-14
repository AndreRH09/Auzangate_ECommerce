// Forma del rango que devuelve R2 (`obj.range`) al pedir con `get(key, { range: request.headers })`.
export type R2Range = { offset: number; length?: number } | { offset?: number; length: number } | { suffix: number };

// Bytes servidos, con `end` inclusivo como en `Content-Range: bytes start-end/size`.
// R2 puede traer las claves presentes con valor undefined (con "bytes=0-" llega `suffix: undefined`): se mira el valor, no la clave.
export function contentRange(range: R2Range, size: number): { start: number; end: number } {
  const r = range as { offset?: number; length?: number; suffix?: number };
  if (typeof r.suffix === "number") return { start: size - r.suffix, end: size - 1 };
  const start = r.offset ?? 0;
  return { start, end: r.length == null ? size - 1 : start + r.length - 1 };
}
