---
id: 013
title: Notifications — full feed/preference e2e coverage ("test all, add more")
layer: integration
kind: build
slice: notification system e2e coverage
target: schooltest-web/tests/e2e
contract: C-NOTIF-*
status: TODO
depends_on: [012]
---
## Objective
User: "test all the notification and add more." Decision D-G-3: "add more" = more coverage,
not new backend event types. Exercise every category end to end: seed real notifications
across all 5 categories for the test parent (via the real dispatch path or API), verify the
feed renders/filtering/mark-read/unread-count, and the category toggles suppress in-app
visibility per dispatch semantics.
## Files
- tests/e2e/notification-feed.spec.ts, notification-preferences.spec.ts (extend)
- helpers for seeding notifications through the real API if one exists (else dispatch service via console)
## Done criteria
- Feed shows notifications of every category; category filter pills work; mark-all-read
  zeroes the bell count; preference toggle off -> matching new notification arrives
  suppressed per contract. Suite green.
