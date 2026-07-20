---
id: 40
title: Notification delivery and SMS preparation proof
layer: integration
kind: verify
slice: relevant real events across in-app, email, push and SMS-prepared channels
target: schooltest-api/tests/e2e/notifications-*.spec.ts; schooltest-web/tests/e2e/notification-*.spec.ts; .qa/screenshots
contract: C-NOTIF-EVENTS, C-PUSH-SUBSCRIBE
status: TODO
depends_on: [39]
---
## Objective

Prove relevant persisted events deliver through the live in-app and email paths, exercise the
push dispatch/subscription contract, and confirm the SMS API is a real prepared response rather
than a browser fake.

## Contract

Existing notification event taxonomy and delivery contracts stay exact. Tests assert real API
status/shape, database rows, Mailpit email and visible UI effects; SMS uses its existing real
server channel response with no fabricated carrier delivery claim.

## Files

Existing notification E2E suites, new focused browser E2E where necessary, and screenshots.

## Depends on

Task 39 completes the browser subscription and VAPID configuration contract.

## Steps

1. Trigger a relevant actual domain event through the API’s normal persistence path.
2. Assert notification row, Mailpit delivery and in-app UI feed/read transition.
3. Assert push subscription/dispatch contract and the SMS-prepared endpoint/channel response.
4. Record screenshots and run the live suites without test doubles.

## Project rules

No mocked channels or fabricated delivery receipts; preserve existing API test setup conventions.

## Done criteria

In-app, email and push paths have real contract evidence, SMS preparation responds through the
real API, all assertions run against live services, and package checks pass.

## Assumptions

An external SMS provider credential is intentionally not required for a prepared API surface.

## Evidence

Pending independent verification.
