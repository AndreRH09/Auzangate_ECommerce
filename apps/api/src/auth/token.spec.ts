import { signToken, verifyToken } from './token.js';

const SECRET = 'x'.repeat(32);

describe('token', () => {
  it('firma y verifica', () => {
    expect(verifyToken(signToken('user-1', SECRET, 60), SECRET)).toBe('user-1');
  });

  it('rechaza token vencido, otra clave, firma o cuerpo alterados', () => {
    const token = signToken('user-1', SECRET, 60);
    const [h, b, s] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ sub: 'admin', exp: 9e9 })).toString('base64url');

    expect(verifyToken(signToken('user-1', SECRET, -1), SECRET)).toBeNull();
    expect(verifyToken(token, 'y'.repeat(32))).toBeNull();
    expect(verifyToken(`${h}.${b}.${s!.slice(0, -2)}xx`, SECRET)).toBeNull();
    expect(verifyToken(`${h}.${forged}.${s}`, SECRET)).toBeNull();
    expect(verifyToken(`${Buffer.from('{"alg":"none"}').toString('base64url')}.${b}.`, SECRET)).toBeNull();
    expect(verifyToken('basura', SECRET)).toBeNull();
  });
});
