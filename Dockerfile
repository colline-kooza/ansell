# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --frozen-lockfile

# NEXT_PUBLIC_* vars are baked into the JS bundle at build time
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

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
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

RUN --mount=type=bind,from=builder,source=/app/apps/web/.next,target=/next_out \
    if [ -d /next_out/static ]; then \
      mkdir -p .next && \
      cp -r /next_out/static .next/static && \
      chown -R nextjs:nodejs .next/static; \
    fi

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
