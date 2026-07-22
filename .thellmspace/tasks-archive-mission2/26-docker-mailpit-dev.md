---
id: 26
title: Docker — mailpit email catcher in local dev + staging topologies
layer: backend
kind: build
slice: axllent/mailpit service in docker-compose.dev.yml (dms-craiova pattern)
target: schooltest-api/docker-compose.dev.yml, .env, .env.example, STACK/DECISIONS
contract: C-ML-REQUEST (delivery infra)
status: DOING
depends_on: [01]
---
## Objective
Give schooltest its OWN dockerized email catcher for local development (the dms-craiova
pattern: real SMTP sink + web UI). The staging/prod topology (docker-compose.yml)
already has mailpit from the deployment-infra agent — DO NOT touch that file.
- docker-compose.dev.yml: append a `mailpit` service (image axllent/mailpit:latest,
  container ${INSTANCE_NAME:-schooltest-api-st1}-mailpit, restart unless-stopped,
  127.0.0.1:${MAILPIT_SMTP_PORT:-1125}:1025 and 127.0.0.1:${MAILPIT_UI_PORT:-8125}:8025,
  the file's healthcheck + logging-caps conventions). Update the header comment's port
  list (1125 smtp · 8125 ui).
- schooltest-api/.env: EMAIL_SMTP_PORT=1125 (from 1025 — the neighbor's catcher).
  .env.example: document MAILPIT_SMTP_PORT/MAILPIT_UI_PORT + the compose usage line.
- Restart api; verify: a send via the api email service lands in OUR mailpit
  (http://localhost:8125/api/v2/search?kind=to&query=...). Update schooltest-web
  .qa/STACK.json + DECISIONS.md (mailpit ports + why: namespaced own catcher,
  dms-craiova pattern, neighbor's mailhog on 1025/8025 untouched).
- VERIFIED 2026-07-18: container healthy; real api send landed in OUR mailpit (250 queued, searchable /api/v1/search).

## Done criteria
- `docker compose -f docker-compose.dev.yml up -d mailpit` healthy; :1125 accepts SMTP,
  :8125 API responds; real api send lands in OUR mailpit (not the neighbor's).
