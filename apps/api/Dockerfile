# API AUZANGATE. Build desde la raíz del monorepo:
#   docker build -f apps/api/Dockerfile -t auzangate-api .                    (runtime, por defecto)
#   docker build -f apps/api/Dockerfile --target migrate -t auzangate-migrate .

# ── base: Node + pnpm (vía corepack, versión fijada en package.json) ──
FROM node:24-alpine AS base
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
WORKDIR /app
# Descarga pnpm UNA vez (versión de "packageManager"); las demás etapas heredan esta capa
COPY package.json ./
RUN corepack enable && corepack install

# ── build: todas las dependencias + compilación ──
FROM base AS build
# Primero solo los manifiestos: si no cambian, Docker reutiliza la capa de install (caché)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter api
COPY apps/api apps/api
# prisma generate no se conecta a la BD, pero prisma.config.ts exige que la variable exista
RUN DATABASE_URL=mysql://build:build@localhost:3306/build pnpm --filter api build

# ── migrate: imagen de un solo uso que aplica las migraciones y termina ──
# Separada del runtime: el CLI de Prisma pesa ~200 MB (Studio, motores) y no hace falta para servir la API.
FROM build AS migrate
# openssl: lo necesita el motor de migraciones de Prisma en Alpine
RUN apk add --no-cache openssl
WORKDIR /app/apps/api
USER node
CMD ["node_modules/.bin/prisma", "migrate", "deploy"]

# ── runtime: solo dependencias de producción + dist ──
FROM base AS runtime
ENV NODE_ENV=production
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --filter api
COPY --from=build /app/apps/api/dist apps/api/dist

WORKDIR /app/apps/api
# usuario sin privilegios (ya existe en la imagen oficial de Node)
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:3000/health || exit 1
CMD ["node", "dist/main.js"]
