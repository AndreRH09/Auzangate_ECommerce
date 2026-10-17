# AUZANGATE

Tienda virtual de prendas outdoor técnico-urbanas, con panel de administrador.
Monorepo con pnpm workspaces + Turborepo.

| Carpeta | Qué es |
|---|---|
| `apps/api` | API REST: NestJS 12 + Prisma 7 + MySQL 8.4 |
| `apps/web` | Tienda y admin: Next.js 16 (pendiente) |

Avance y decisiones: [`docs/PLAN-DE-TRABAJO.md`](docs/PLAN-DE-TRABAJO.md).

## Requisitos

- Node 24 LTS
- pnpm 12 (`npm install -g pnpm@12.14.0`)
- Docker Desktop

## Primera vez

```powershell
pnpm install
Copy-Item .env.example .env     # luego edita las contraseñas
pnpm up                         # MySQL + Adminer en Docker
pnpm db:migrate                 # crea las tablas
pnpm db:seed                    # admin + series + zonas de envío + 20 productos de ejemplo
pnpm api                        # API en http://localhost:3000
```

Si el puerto 3306 está ocupado (por ejemplo, por un MySQL instalado en Windows), cambia `MYSQL_PORT=3307` en `.env` y el puerto de `DATABASE_URL`.

## Día a día

| Comando | Qué hace |
|---|---|
| `pnpm up` / `pnpm down` | Levanta o apaga los contenedores. Los datos se conservan en el volumen |
| `pnpm ps` | Estado de los contenedores (MySQL debe estar `healthy`) |
| `pnpm logs` | Logs en vivo (Ctrl+C para salir) |
| `pnpm api` | API en modo watch |
| `pnpm db:studio` | Prisma Studio para ver y editar datos |
| `pnpm db:seed [users] [config] [catalog]` | Semillas de desarrollo; sin argumentos corre todas. Re-ejecutables |

### URLs locales

| URL | Qué es |
|---|---|
| http://localhost:3000/health | Estado de la API y de la BD |
| http://localhost:3000/docs | Swagger (documentación de la API) |
| http://localhost:8080 | Adminer: Sistema `MySQL`, Servidor `mysql`, Usuario `root`, la contraseña de `.env`, BD `auzangate` |

## Base de datos y migraciones

El modelo vive en `apps/api/prisma/schema.prisma`.

1. Edita el schema.
2. Crea y aplica la migración:
   ```powershell
   pnpm db:migrate --name describe-el-cambio
   ```
3. Sube a git la carpeta nueva en `apps/api/prisma/migrations/`: es el historial versionado de la base.

En producción las migraciones se aplican con `prisma migrate deploy` (no genera nada nuevo, solo aplica las pendientes).

Para empezar de cero en local (borra todos los datos):

```powershell
pnpm --filter api exec prisma migrate reset
pnpm db:seed
```

## Despliegue con Docker (prueba local del stack de producción)

> Pendiente: requiere `apps/api/Dockerfile` (próximo paso de F0).

```powershell
Copy-Item .env.production.example .env.production   # edita las contraseñas
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

En producción MySQL no publica puertos: solo la API (3000) es accesible.

## Flujo de git

- `main` es lo que se despliega. No se trabaja directo sobre ella.
- Una rama por fase o funcionalidad (`f0/base`, `f1/catalogo`…), con commits pequeños en formato Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`).
- Al terminar, se abre un Pull Request a `main` y se fusiona con la CI en verde.
