---
id: 39
title: Browser push subscription and VAPID configuration surface
layer: integration
kind: implement
slice: real browser push registration persisted through Strapi
target: schooltest-api/src/api/push-subscription/{controllers,routes,services}; schooltest-api/src/bootstrap/{permissions-action-refs,permissions-actions}.ts; schooltest-web/src/app/service-worker/route.ts; schooltest-web/src/modules/notifications/**; messages/*.json; tests/e2e/push-subscription*.spec.ts
contract: C-PUSH-VAPID-CONFIG, C-PUSH-SUBSCRIBE, C-PUSH-UNSUBSCRIBE
status: DONE
depends_on: [38]
---
## Objective

Make browser push opt-in work end-to-end: fetch a server-supplied public VAPID key, register a
same-origin service worker, request consent once, and persist/unsubscribe the browser endpoint
through the existing real Strapi API.

## Contract

Implement `C-PUSH-VAPID-CONFIG`; retain existing subscribe/unsubscribe request schemas and
server-forced owner persistence. A known endpoint owned by another parent is rejected rather
than reassigned. The service worker only displays server-delivered push payloads and never
contains secrets or invented message text.

## Files

The named API action/grants, TypeScript service-worker route, notifications module, all locales
and live API/browser E2E.

## Depends on

Task 38 provides the notification settings tab where this real permission control belongs.

## Steps

1. Add parent-only VAPID public-key endpoint and its action grant, exposing no private key.
2. Add a TypeScript Next route that serves a minimal same-origin service worker script.
3. Add typed config/subscription hooks and permission-aware settings control.
4. Prove API persistence/upsert/unsubscribe with a real subscription shape and browser route;
   exercise actual delivery where local browser permission/runtime permits it.

## Project rules

No `.js` source files, no hard-coded keys, browser APIs isolated in a client hook, backend uses
typed errors/Document Service and all responses parse at the web boundary.

## Done criteria

The real VAPID public key is exposed only to a parent, subscribe/unsubscribe persists rows with
the caller as owner, the service worker route is valid JS response, and E2E/tsc/lint pass.

## Assumptions

The running API has its existing VAPID configuration; a missing key is reported honestly.

## Evidence

Independent verifier PASS, 2026-07-21: parent-only `GET /api/push-subscriptions/vapid-public-key`
returned the exact public-only shape; anonymous/teacher calls and malformed subscribe were rejected.
Dynamic real subscription records proved same-owner upsert, foreign claim generic 403 with unchanged
owner, opaque foreign delete 0, owner delete 1 and idempotent retry 0 in PostgreSQL. Playwright
`push-subscription*.spec.ts` passed 5/5, including the worker response/headers, configuration failure
control, mobile no-overflow and axe serious/critical clean. Both package typechecks and API lint passed;
web lint has zero errors and its one pre-existing `CreateArticleForm` warning. Local Chromium honestly
keeps notification permission denied, so UI proof covers the truthful disabled/blocked state rather than
claiming an impossible browser opt-in.
