---
id: 012
title: Notification toggles — verify every one round-trips; fix read-back defects
layer: integration
kind: fix
slice: settings > notifications toggles all persist
target: schooltest-web/src/modules/notifications + schooltest-api notification-preference
contract: C-PREF-GET, C-PREF-PUT
status: TODO
depends_on: []
---
## Objective
User: "test if the toggles work in the settings, make sure they are good." Agent E recorded
a real defect: after saving sms+push opt-outs and reloading, the Text messages switch still
read aria-checked=true. Reproduce, root-cause (form reset vs server response mapping), fix,
and verify EVERY toggle (email, in-app, push, sms, children, testActivity, testResults,
digest) round-trips through PUT /api/notification-preferences/me.
## Files
- notifications/hooks/use-notification-preference-form.ts (+ form components as needed)
- tests/e2e/notification-preference-controls.spec.ts (extend to every toggle)
- schooltest-api services/notification-preference.ts only if the defect is server-side
## Done criteria
- Each of the 7 toggles + digest: UI toggle -> PUT payload correct -> GET reads back the
  saved value -> after reload the switch shows the saved state. Spec passes serially 3x.
