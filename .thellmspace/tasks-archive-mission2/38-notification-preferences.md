---
id: 38
title: Notification preferences in settings
layer: frontend
kind: implement
slice: persisted email and in-app notification preference controls
target: src/modules/notifications/{components,queries,schemas,types,index.ts}; src/modules/settings/**; messages/*.json; tests/e2e/notification-preferences.spec.ts
contract: C-PREF-GET, C-PREF-UPDATE
status: DONE
depends_on: [37]
---
## Objective

Add a Notification settings tab that reads and updates each parent’s real persisted category and
channel preferences, including email and in-app delivery controls.

## Contract

Use the existing parent-owned get-or-create/update preference API with the exact validated
shape. Client-side form schema parses the same response and submits no ownership fields.

## Files

Notifications/settings module consumers, all message catalogs, and real preference E2E.

## Depends on

Task 37 establishes the notification module and topbar feed consumers.

## Steps

1. Inspect live preference schema/controller response and add exact web Zod schema.
2. Build labelled RHF controls in the Settings notification tab.
3. Save via typed mutation, show honest success/error feedback and refresh queries.
4. Assert a real preference change in API/DB and after browser reload; include unauth denial.

## Project rules

RHF + Zod only, all text translated, no direct Axios/fetch in components and no claimed email
send without the backend delivery path.

## Done criteria

Preference values are real per-user persisted values, email/in-app toggles are accessible,
reload shows saved state, and E2E/tsc/lint pass.

## Assumptions

Push controls are intentionally completed by task 39 because browser permission is separate.

## Evidence

Independent notification-preferences verifier passed the live contract and browser proof.
The parent-owned API returned its exact 13-field response and accepted only the six UI-owned
fields. Playwright passed the real save, direct API persistence, browser reload, restoration,
unauthorized GET/PUT rejection, localized mutation failure, keyboard use, mobile layout, and
axe checks (6/6 including the settings-tab regression). `pnpm tsc --noEmit` passed; `pnpm lint`
had zero errors and only the pre-existing `CreateArticleForm` warning.
