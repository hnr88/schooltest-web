# syntax=docker/dockerfile:1
# Next.js 16 (App Router, React 19) production image — multi-stage, standalone
# output, non-root runtime. Build context is ./app.
#
# NEXT_PUBLIC_* client constants are inlined at BUILD time, so the public API URL
# is passed as a build arg. Server-only env is injected at RUNTIME by compose.

# ---- deps ----
FROM node:22-bookworm-slim AS deps
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    CI=true
RUN corepack enable
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store pnpm install --frozen-lockfile

# ---- build ----
FROM node:22-bookworm-slim AS build
ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_ENV=production \
    SKIP_ENV_VALIDATION=1
RUN corepack enable
WORKDIR /app
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:1337
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# ---- runner ----
FROM node:22-bookworm-slim AS runner
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates tini wget \
    && rm -rf /var/lib/apt/lists/*
RUN useradd -u 10001 -m nextjs
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app
COPY --from=build --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nextjs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nextjs /app/public ./public
USER nextjs
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/ >/dev/null 2>&1 || exit 1
ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "server.js"]
