// Forma del rango que devuelve R2 (`obj.range`) al pedir con `get(key, { range: request.headers })`.
export type R2Range = { offset: number; length?: number } | { offset?: number; length: number } | { suffix: number };

// Bytes servidos, con `end` inclusivo como en `Content-Range: bytes start-end/size`.
export function contentRange(range: R2Range, size: number): { start: number; end: number } {
  if ("suffix" in range) return { start: size - range.suffix, end: size - 1 };
  const start = range.offset ?? 0;
  return { start, end: range.length === undefined ? size - 1 : start + range.length - 1 };
}
