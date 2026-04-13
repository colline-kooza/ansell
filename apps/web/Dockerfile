# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy all files to build the monorepo
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the JS bundle at BUILD TIME
# Passing them as build args
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build the web application
RUN pnpm --filter @ansell/web build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-privileged user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Standalone mode copies only the necessary files for the app to run
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

# When using standalone mode, Next.js generates a server.js file in the root of the output
CMD ["node", "apps/web/server.js"]
