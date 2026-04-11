# ─── Dependency install stage ─────────────────────────────────────────────────
# Build context is the monorepo root so pnpm-workspace.yaml is available.
FROM node:20-alpine AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy monorepo manifests first for layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile --filter @ansell/web...

# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy full root node_modules — pnpm stores all packages under .pnpm/ here;
# workspace-level node_modules only have symlinks that point into this tree.
COPY --from=deps /app/node_modules ./node_modules
# Copy only the web app source (keeps image context small)
COPY apps/web ./apps/web

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Also copy root package.json so pnpm can resolve workspace
COPY package.json pnpm-workspace.yaml ./

RUN pnpm --filter @ansell/web build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS production

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/apps/web/public ./public

# Standalone output includes only what's needed to run
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
