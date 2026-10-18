# AUZANGATE

Tienda virtual de prendas outdoor técnico-urbanas, con panel de administrador.
Monorepo con pnpm workspaces + Turborepo.

![Node](https://img.shields.io/badge/Node-24_LTS-5FA04E?logo=nodedotjs&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-12-F69220?logo=pnpm&logoColor=white)
![Turborepo](https://img.shields.io/badge/Turborepo-2-EF4444?logo=turborepo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![next-intl](https://img.shields.io/badge/next--intl-4-1F2937)
![Cloudflare Workers](https://img.shields.io/badge/Cloudflare_Workers-OpenNext-F38020?logo=cloudflare&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-12-E0234E?logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-8.4-4479A1?logo=mysql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Vitest](https://img.shields.io/badge/Vitest-4-6E9F18?logo=vitest&logoColor=white)

| Carpeta | Qué es |
|---|---|
| `apps/api` | API REST: NestJS 12 + Prisma 7 + MySQL 8.4 |
| `apps/web` | Tienda y admin: Next.js 16 + React 19 + Tailwind 4, i18n con next-intl, desplegada en Cloudflare Workers vía OpenNext |

## Avance

- [x] API: NestJS + Prisma, migraciones, seeds de desarrollo (usuarios, config, catálogo), Swagger y `/health`
- [x] API: Dockerfile multi-stage con imagen separada para migraciones
- [x] Web: Next 16 con design tokens, fuentes y assets de marca
- [x] Web: i18n `es` / `en` con prefijo en la URL (`/es`, `/en`); `/` redirige a `/es`
- [x] Web: build y despliegue a Cloudflare Workers con OpenNext + Wrangler
- [x] CI: typecheck, lint, e2e, build de API y Worker, imágenes Docker
- [x] API: catálogo (categorías, series, productos con filtros/búsqueda, sitemap) y newsletter
- [x] Web: home, listados (categoría, serie, búsqueda), ficha de producto con galería por color, SEO (sitemap, robots, JSON-LD)
- [ ] Auth del admin, admin de catálogo, imágenes en R2, revalidación, deploy (resto de F1)

Detalle, decisiones y riesgos al escalar: [docs/PLAN-DE-TRABAJO.md](docs/PLAN-DE-TRABAJO.md).

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
pnpm db:seed                    # admin + series + zonas de envío + 22 productos de ejemplo
pnpm api                        # API en http://localhost:3000
pnpm web                        # tienda en http://localhost:3001 (otra terminal)
```

`pnpm dev` levanta API y web a la vez con Turborepo.

Si el puerto 3306 está ocupado (por ejemplo, por un MySQL instalado en Windows), cambia `MYSQL_PORT=3307` en `.env` y el puerto de `DATABASE_URL`.

## Día a día

| Comando | Qué hace |
|---|---|
| `pnpm up` / `pnpm down` | Levanta o apaga los contenedores. Los datos se conservan en el volumen |
| `pnpm ps` | Estado de los contenedores (MySQL debe estar `healthy`) |
| `pnpm logs` | Logs en vivo (Ctrl+C para salir) |
| `pnpm dev` | API + web en modo watch (Turborepo) |
| `pnpm api` | Solo la API en modo watch |
| `pnpm web` | Solo la tienda (Next dev con Turbopack) |
| `pnpm --filter web preview` | Build de OpenNext y prueba local en el runtime de Workers (`workerd`). **Solo Linux/macOS/WSL** |
| `docker build -f apps/web/Dockerfile.preview -t auzangate-web-preview .`<br>`docker run --rm -p 8787:8787 auzangate-web-preview` | Mismo preview desde Windows, dentro de Linux → http://localhost:8787 |
| `pnpm --filter web deploy` | Build y despliegue a Cloudflare (requiere `wrangler login`) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` | Chequeos de todo el monorepo |
| `pnpm --filter api test:e2e` | Tests e2e de la API contra la BD local (requiere `pnpm db:seed catalog`) |
| `pnpm db:studio` | Prisma Studio para ver y editar datos |
| `pnpm db:seed [users] [config] [catalog]` | Semillas de desarrollo; sin argumentos corre todas. Re-ejecutables |

### URLs locales

| URL | Qué es |
|---|---|
| http://localhost:3001 | Tienda (redirige a `/es`; inglés en `/en`) |
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

```powershell
Copy-Item .env.production.example .env.production   # edita las contraseñas
docker compose -p auzangate-prod -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d --build
```

En producción MySQL no publica puertos: solo la API (3000) es accesible. `-p auzangate-prod` usa otro nombre de proyecto, así no pisa los contenedores ni el volumen de dev. Para apagarlo: `docker compose -p auzangate-prod down`.

## Catálogo: códigos y fotos

- Código de producto: `A` + inicial de la serie (`C`/`W`/`S`/`V`/`N`) + número de 2 dígitos. La versión de mujer antepone `F`: `AW01` / `FAW01`.
- Nombre: `{Tipo} {código}` (por ejemplo, `Casaca FAW01`), sin nombre de modelo.
- SKU: `{código}-{color}-{talla}`, con color de 1 letra (`C` Carbón, `R` Roca, `V` Musgo, `A` Arcilla; nunca `F`). Ejemplo: `AC04-C-M`.
- Fotos (temporal, hasta R2): `apps/web/public/products/{código}/{color}/{front,rear,side}.png` y registradas en `REAL_PHOTOS` de `apps/api/prisma/seeds/catalog.ts`. Una foto sin color (`colorHex` null) se muestra con todos los colores.

Si cambias productos del seed, actualiza los conteos de `apps/api/test/catalog.e2e-spec.ts`.

## Web: idiomas

Los textos viven en `apps/web/messages/{es,en}.json` y la config en `apps/web/src/i18n/`. Para enlaces internos usa `Link` de `@/i18n/navigation` (agrega el prefijo de idioma), no `next/link`. No hay middleware: OpenNext no lo soporta en runtime Node, por eso `/` → `/es` es un redirect estático en `next.config.ts`.

## Flujo de git

- `main` es lo que se despliega. No se trabaja directo sobre ella.
- Una rama por fase o funcionalidad (`f0/base`, `f1/catalog`…), con commits pequeños en formato Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `ci:`).
- Al terminar, se abre un Pull Request a `main` y se fusiona con la CI en verde.
