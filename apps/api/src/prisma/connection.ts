// Config del driver mariadb para PrismaMariaDb. Lo usan la API y las semillas.
// Con CA (MySQL gestionado, p. ej. Aiven): TLS verificando el certificado del servidor contra esa CA.
// El string de conexión no puede llevar un PEM, por eso se arma el objeto de configuración.
export function connection(url: string, ca: string | undefined) {
  if (!ca) return url;
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 3306),
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database: u.pathname.slice(1),
    ssl: { ca, rejectUnauthorized: true },
  };
}
