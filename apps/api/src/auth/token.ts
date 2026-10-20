import { createHmac, timingSafeEqual } from 'node:crypto';

// ponytail: JWT HS256 con node:crypto, sin jsonwebtoken. Solo verifica lo que esta API emite:
// header fijo (no hay negociación de algoritmo, así que no hay "alg: none"). Pasar a @nestjs/jwt
// si llegan claves asimétricas o tokens de terceros.
const HEADER = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

const sign = (data: string, secret: string) => createHmac('sha256', secret).update(data).digest('base64url');

export function signToken(sub: string, secret: string, ttlSeconds: number) {
  const body = Buffer.from(JSON.stringify({ sub, exp: Math.floor(Date.now() / 1000) + ttlSeconds })).toString('base64url');
  return `${HEADER}.${body}.${sign(`${HEADER}.${body}`, secret)}`;
}

// Devuelve el id del usuario, o null si la firma no cuadra o el token venció.
export function verifyToken(token: string, secret: string): string | null {
  const [header, body, sig, extra] = token.split('.');
  if (header !== HEADER || !body || !sig || extra !== undefined) return null;
  const expected = Buffer.from(sign(`${header}.${body}`, secret));
  const got = Buffer.from(sig);
  if (got.length !== expected.length || !timingSafeEqual(got, expected)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(body, 'base64url').toString()) as { sub?: unknown; exp?: unknown };
    return typeof sub === 'string' && typeof exp === 'number' && exp > Date.now() / 1000 ? sub : null;
  } catch {
    return null;
  }
}
