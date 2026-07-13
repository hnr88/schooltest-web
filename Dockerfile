# syntax=docker/dockerfile:1
ARG NODE_VERSION=22-alpine

# =============================================================================
# Stage 1: install dependencies (cached unless package files change)
# =============================================================================
FROM node:${NODE_VERSION} AS deps

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: build the standalone Next.js application
# =============================================================================
FROM node:${NODE_VERSION} AS builder

WORKDIR /app

RUN corepack enable pnpm

# NEXT_PUBLIC_* values are compiled into the browser bundle, so Coolify must
# supply the environment-specific values as Docker build args.
ARG NEXT_PUBLIC_API_BASE_URL=http://localhost:1337
ARG NEXT_PUBLIC_APP_URL=http://localhost:3000
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

RUN pnpm run build

# =============================================================================
# Stage 3: production image (minimal, standalone)
# =============================================================================
FROM node:${NODE_VERSION} AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

# Coolify waits for this before routing a rolling deployment to the container.
# Any response below 500 proves that the Next.js server is accepting traffic.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},r=>process.exit(r.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1)});"

CMD ["node", "server.js"]
