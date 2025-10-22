# Egfilm Production Dockerfile - Optimized for Performance
# Multi-stage build to minimize image size

FROM node:20-alpine AS base
# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init libc6-compat

# Dependencies layer
FROM base AS deps
WORKDIR /app
COPY package*.json ./
# Use npm ci for reproducible builds + clean install
RUN npm ci --only=production && npm cache clean --force

# Build dependencies layer
FROM base AS build-deps
WORKDIR /app
COPY package*.json ./
RUN npm ci && npm cache clean --force

# Builder layer
FROM base AS builder
WORKDIR /app
COPY --from=build-deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js app with optimizations
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
# .env.local is passed in from GitHub Actions during docker build
# Ensure the build has access to .env.local so Next.js can collect page data
# at build-time (contains DATABASE_URL etc.). The file is created by the
# CI workflow before `docker build` runs.
COPY .env.local .env.local
RUN npm run build

# Production runtime layer - minimal and secure
FROM base AS runner
WORKDIR /app

# Security: Run as non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy only what's needed for production
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Copy Next.js build output (standalone mode)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma runtime files only
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Copy production dependencies only
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Make entrypoint executable
RUN chmod +x ./entrypoint.sh && \
    chown -R nextjs:nodejs /app

# Security: Create .next directory with proper permissions
RUN mkdir -p .next && chown -R nextjs:nodejs .next

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8000

# Set environment for production
ENV NODE_ENV=production
ENV PORT=8000
ENV HOSTNAME=0.0.0.0
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8000/ || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application with entrypoint
CMD ["./entrypoint.sh"]

# Worker image - separate target for background jobs
FROM runner AS worker
WORKDIR /app

# Copy worker files
COPY --from=builder --chown=nextjs:nodejs /app/worker.ts ./worker.ts
COPY --from=builder --chown=nextjs:nodejs /app/src ./src

# Install tsx for running TypeScript
RUN npm install --save-dev tsx@^4.0.0

USER nextjs

# No port exposure for worker
# Start worker process
CMD ["npx", "tsx", "worker.ts"]

