# Monorepo-aware multi-stage Dockerfile.
#
# Build a specific app from the monorepo:
#   docker build --build-arg APP_NAME=egfilm -f docker/Dockerfile.app -t egfilm:latest .
#   docker build --build-arg APP_NAME=egsport -f docker/Dockerfile.app -t egsport:latest .

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /repo

# ---------- Pruner ----------
# Use turbo prune to generate a minimal workspace subset for the target app.
FROM base AS pruner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
COPY . .
RUN pnpm dlx turbo@2 prune --scope=${APP_NAME} --docker

# ---------- Deps ----------
# Install dependencies from the pruned lockfile (cache friendly).
FROM base AS deps
COPY --from=pruner /repo/out/json/ ./
COPY --from=pruner /repo/out/pnpm-lock.yaml ./pnpm-lock.yaml
RUN pnpm install --frozen-lockfile

# ---------- Builder ----------
FROM base AS builder
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

# Build-time public env vars (Next.js bakes these into the client bundle).
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_TMDB_API_KEY
ARG NEXT_PUBLIC_BLOG_SITE_URL
ARG NEXT_PUBLIC_EGFILM_URL
ARG NEXT_PUBLIC_EGSPORT_URL
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
ENV NEXT_PUBLIC_TURN_SERVER=${NEXT_PUBLIC_TURN_SERVER}
ENV NEXT_PUBLIC_TURN_USERNAME=${NEXT_PUBLIC_TURN_USERNAME}
ENV NEXT_PUBLIC_BUILD_VERSION=${NEXT_PUBLIC_BUILD_VERSION}
ENV NEXT_PUBLIC_BUILD_DATE=${NEXT_PUBLIC_BUILD_DATE}
ENV NEXT_PUBLIC_GIT_SHA=${NEXT_PUBLIC_GIT_SHA}
ENV NEXT_PUBLIC_GA_MEASUREMENT_ID=${NEXT_PUBLIC_GA_MEASUREMENT_ID}

COPY --from=deps /repo/node_modules ./node_modules
COPY --from=pruner /repo/out/full/ ./

RUN pnpm --filter @egfilm/db db:generate
RUN pnpm --filter ${APP_NAME} build

# ---------- Runner ----------
FROM base AS runner
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone server bundle + static + public assets + prisma migrations.
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP_NAME}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP_NAME}/.next/static ./apps/${APP_NAME}/.next/static
COPY --from=builder --chown=nextjs:nodejs /repo/apps/${APP_NAME}/public ./apps/${APP_NAME}/public
COPY --from=builder --chown=nextjs:nodejs /repo/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /repo/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/health', r => process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1));"

# Standalone entry varies by app — `apps/${APP_NAME}/server.js` after Next.js standalone.
CMD ["sh", "-c", "node apps/${APP_NAME}/server.js"]
