---
id: 37
title: In-app notification bell and feed
layer: frontend
kind: implement
slice: dashboard notification visibility and read state
target: src/modules/notifications/{components,queries,schemas,types,index.ts}; src/modules/shell/components/AppTopbar.tsx; src/app/[locale]/dashboard/notifications/page.tsx; messages/*.json; tests/e2e/notification-feed.spec.ts
contract: C-NOTIF-LIST, C-NOTIF-READ, C-NOTIF-READ-ALL
status: TODO
depends_on: [36]
---
## Objective

Surface the existing persisted in-app notification system as an accessible topbar bell, recent
feed and full dashboard page with real read/mark-all operations.

## Contract

Consume existing owner-scoped notification list/read/read-all/unread-count responses through
runtime Zod schemas and typed query/mutation hooks. Never display another user's notification.

## Files

The named notifications module, topbar integration, page route, six locale files and live E2E.

## Depends on

Task 36 completes the settings navigation into which preference controls will later land.

## Steps

1. Mirror the live notification envelope as Zod schemas and query hooks.
2. Add an accessible bell with unread count and a recent feed; add a full feed route.
3. Mark read/mark all through mutations and invalidate real queries.
4. Trigger a real notification event, verify visible feed/read persistence and ownership denial.

## Project rules

Use existing Axios, TanStack Query, Sonner/design system, app routing and i18n; browser data
must not use scattered raw fetch.

## Done criteria

A real persisted notification appears in the bell/page, read state persists after reload,
unauthorized data is refused by the live API, and focused E2E/tsc/lint pass.

## Assumptions

The backend notification trigger service is already the authoritative source of feed rows.

## Evidence

Pending independent verification.
