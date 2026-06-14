# Monorepo-aware multi-stage Dockerfile.
#
# Build a specific app from the monorepo:
#   docker build --build-arg APP_NAME=egfilm  -f docker/Dockerfile.app -t egfilm:latest  .
#
# Strategy: lean on Next.js `output: 'standalone'` + per-app
# `outputFileTracingIncludes` to ship only the files the app actually
# touches. Resulting runner image is ~300 MB instead of ~2 GB.

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---------- Pruner ----------
# Use turbo prune to keep only the workspace subset this app needs. Smaller
# input → faster install → faster build.
FROM base AS pruner
ARG APP_NAME
COPY . .
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm dlx turbo@2 prune --scope=${APP_NAME} --docker

# ---------- Deps ----------
# Install ALL deps (dev + prod) for the pruned subgraph. We need dev deps
# (typescript, eslint-config-next, autoprefixer, …) to run `next build`.
FROM base AS deps
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---------- Builder ----------
FROM base AS builder
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Public env baked into the client bundle at build time.
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TMDB_API_KEY
ARG NEXT_PUBLIC_BLOG_SITE_URL
ARG NEXT_PUBLIC_EGFILM_URL
ARG NEXT_PUBLIC_EGSPORT_URL
ARG NEXT_PUBLIC_EGTV_URL
ARG NEXT_PUBLIC_EGBLOG_URL
ARG NEXT_PUBLIC_EGADMIN_URL
ARG NEXT_PUBLIC_TURN_SERVER
ARG NEXT_PUBLIC_TURN_USERNAME
ARG NEXT_PUBLIC_BUILD_VERSION
ARG NEXT_PUBLIC_BUILD_DATE
ARG NEXT_PUBLIC_GIT_SHA
ARG NEXT_PUBLIC_GA_MEASUREMENT_ID

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_APP_NAME=${NEXT_PUBLIC_APP_NAME}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_TMDB_API_KEY=${NEXT_PUBLIC_TMDB_API_KEY}
ENV NEXT_PUBLIC_BLOG_SITE_URL=${NEXT_PUBLIC_BLOG_SITE_URL}
ENV NEXT_PUBLIC_EGFILM_URL=${NEXT_PUBLIC_EGFILM_URL}
ENV NEXT_PUBLIC_EGSPORT_URL=${NEXT_PUBLIC_EGSPORT_URL}
ENV NEXT_PUBLIC_EGTV_URL=${NEXT_PUBLIC_EGTV_URL}
ENV NEXT_PUBLIC_EGBLOG_URL=${NEXT_PUBLIC_EGBLOG_URL}
ENV NEXT_PUBLIC_EGADMIN_URL=${NEXT_PUBLIC_EGADMIN_URL}
ENV NEXT_PUBLIC_TURN_SERVER=${NEXT_PUBLIC_TURN_SERVER}
ENV NEXT_PUBLIC_TURN_USERNAME=${NEXT_PUBLIC_TURN_USERNAME}
ENV NEXT_PUBLIC_BUILD_VERSION=${NEXT_PUBLIC_BUILD_VERSION}
ENV NEXT_PUBLIC_BUILD_DATE=${NEXT_PUBLIC_BUILD_DATE}
ENV NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}

# Bring in installed deps then overlay the full source.
COPY --from=deps /repo/ ./
COPY --from=pruner /repo/out/full/ ./

# Prisma client generation (needs to happen before next build so types resolve).
RUN pnpm --filter @egfilm/db db:generate

# next build → emits apps/${APP_NAME}/.next/standalone/ (self-contained
# server + traced node_modules), .next/static/ (chunks), public/.
RUN pnpm --filter ${APP_NAME} build

# Re-stage the standalone output + statics + public + prisma engine into a
# clean /app tree so the runner stage can `COPY --from=builder /app` a
# self-contained layer.
#
# Note: the standalone output preserves the monorepo path layout, so the
# server entrypoint lives at apps/${APP_NAME}/server.js inside it.
RUN mkdir -p /app \
 && cp -r apps/${APP_NAME}/.next/standalone/. /app/ \
 && mkdir -p /app/apps/${APP_NAME}/.next \
 && cp -r apps/${APP_NAME}/.next/static /app/apps/${APP_NAME}/.next/static \
 && (cp -r apps/${APP_NAME}/public /app/apps/${APP_NAME}/public || true)

# Ship the prisma schema + the generated client engine. The standalone tracer
# does not always pick up the dynamically-loaded `.prisma/client` engine
# binaries, so we copy them explicitly from the builder's @prisma/client.
RUN mkdir -p /app/packages/db \
 && cp -r packages/db/prisma /app/packages/db/prisma \
 && cp packages/db/package.json /app/packages/db/package.json

# The standalone tree has its own node_modules. Re-run `prisma generate`
# inside it so the engines land in the right place at boot.
RUN cd /app && npx --yes prisma@6.17.1 generate --schema=./packages/db/prisma/schema.prisma

# ---------- Runner ----------
FROM node:20-alpine AS runner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app ./

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1));"

# Standalone server entrypoint (preserves monorepo path).
CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]
