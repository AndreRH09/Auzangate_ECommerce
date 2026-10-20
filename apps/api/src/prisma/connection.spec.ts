import { connection } from './connection.js';

describe('connection', () => {
  const url = 'mysql://avnadmin:p%40ss%3Aword@mysql-x.aivencloud.com:12345/defaultdb';

  it('sin CA deja el string tal cual (Docker local)', () => {
    expect(connection(url, undefined)).toBe(url);
  });

  it('con CA arma el objeto con TLS verificado y decodifica la contraseña', () => {
    expect(connection(url, '-----BEGIN CERTIFICATE-----x')).toEqual({
      host: 'mysql-x.aivencloud.com',
      port: 12345,
      user: 'avnadmin',
      password: 'p@ss:word',
      database: 'defaultdb',
      ssl: { ca: '-----BEGIN CERTIFICATE-----x', rejectUnauthorized: true },
    });
  });
});
