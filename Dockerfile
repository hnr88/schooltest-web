# syntax=docker/dockerfile:1
# Base image pin (task W3-17, D7 section C). NODE_DIGEST pins node:${NODE_VERSION} by digest so a build is
# reproducible and a patch is a reviewed digest bump (ops/security/patching/pin-digests.sh in schooltest-api,
# monthly window). Build with `--build-arg NODE_DIGEST=` (empty) to unpin, or when overriding NODE_VERSION:
# the digest belongs to the default NODE_VERSION and will not match another tag.
ARG NODE_VERSION=22-alpine
ARG NODE_DIGEST=@sha256:0a7108bf6c7bf5de370ffb1a3ed6be93d405b43ff159f681a8d18c0e2bc2e402

# =============================================================================
# Stage 1: install dependencies (cached unless package files change)
# =============================================================================
FROM node:${NODE_VERSION}${NODE_DIGEST} AS deps

WORKDIR /app

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY vendor ./vendor

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# =============================================================================
# Stage 2: build the standalone Next.js application
# =============================================================================
FROM node:${NODE_VERSION}${NODE_DIGEST} AS builder

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

# A deployable bundle must never bake localhost URLs. Local dev builds opt out
# by setting ALLOW_LOCALHOST_PUBLIC_URLS=true (see .env.example); Coolify never
# sets it, so a missing build arg fails the build instead of shipping silently.
ARG ALLOW_LOCALHOST_PUBLIC_URLS=false
RUN if [ "${ALLOW_LOCALHOST_PUBLIC_URLS}" != "true" ]; then \
      for raw in "${NEXT_PUBLIC_API_BASE_URL}" "${NEXT_PUBLIC_APP_URL}"; do \
        v=$(printf '%s' "$raw" | tr 'A-Z' 'a-z'); \
        case "$v" in \
          ''|*localhost*|*127.0.0.1*|*0.0.0.0*|*\[::1\]*|*host.docker.internal*) \
            echo "BUILD REFUSED: NEXT_PUBLIC_API_BASE_URL / NEXT_PUBLIC_APP_URL is empty or points at a local address (got: '$raw')."; \
            echo "Set the real domains as Docker build args in Coolify (see DEPLOYMENT.md)."; \
            echo "For a local dev image, pass ALLOW_LOCALHOST_PUBLIC_URLS=true."; \
            exit 1 ;; \
        esac; \
      done; \
    fi

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/package.json ./package.json
COPY . .

RUN pnpm run build

# =============================================================================
# Stage 3: production image (minimal, standalone)
# =============================================================================
FROM node:${NODE_VERSION}${NODE_DIGEST} AS runner

WORKDIR /app

ARG PORT_INTERNAL=28721

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=${PORT_INTERNAL} \
    HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/public ./public

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

# Build info (ST4S W2-11). Declared last, after every COPY, so changing the
# commit or version never invalidates a build-cache layer. The defaults keep a
# plain `docker build` identical to the image built before these lines existed.
ARG GIT_COMMIT=unknown
ARG APP_VERSION=unknown
ENV APP_COMMIT_SHA=${GIT_COMMIT} \
    APP_VERSION=${APP_VERSION}
LABEL org.opencontainers.image.revision="${GIT_COMMIT}" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.source="https://github.com/hnr88/schooltest-web"

USER node

EXPOSE ${PORT_INTERNAL}

# Coolify waits for this before routing a rolling deployment to the container.
# Any response below 500 proves that the Next.js server is accepting traffic.
HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "const http=require('http');const req=http.get({host:'127.0.0.1',port:process.env.PORT||3000,path:'/'},r=>process.exit(r.statusCode<500?0:1));req.on('error',()=>process.exit(1));req.setTimeout(4000,()=>{req.destroy();process.exit(1)});"

CMD ["node", "server.js"]
