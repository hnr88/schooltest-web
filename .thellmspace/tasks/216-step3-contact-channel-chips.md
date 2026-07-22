---
id: 216
title: Ship step 3's Preferred contact channel as a full-width portal wide-chip radiogroup
layer: ui
kind: build
slice: Wizard field 3.5 — preferred contact channel
target: src/modules/student-wizard/components/StepGuardian.tsx, src/modules/student-wizard/constants/student-wizard.constants.ts
contract: n/a for transport — the field contract is the wizard Zod schema quoted below
design: .qa/design/screens/portal--add-child-multi-step.html:81-88, .qa/design/spec/03-portal-forms.md#26-step-3--parent-or-guardian
status: TODO
depends_on: [206]
---

## Objective
Move the contact-channel picker onto the portal Wide chip while keeping the default, the ARIA and the
keyboard contract that `051-step-guardian` and `053-wizard-controls` both assert.

## Contract
n/a for transport. Field contract:

```ts
preferred_contact_channel: z.enum(CONTACT_CHANNEL_VALUES).default('whatsapp')
CONTACT_CHANNEL_VALUES = ['whatsapp', 'wechat', 'email', 'sms']
```

Always sent. The wire value is the raw lowercase enum; the labels (`WhatsApp`, `WeChat`, `Email`,
`SMS`) are catalog strings.

## Design source
`03-portal-forms.md` §2.6 row 3.5 (`portal--add-child-multi-step.html:85`):

| # | Label | Req | Control | Options | Default |
|---|---|---|---|---|---|
| 3.5 | `Preferred contact channel` | No | Chip group, **Wide**, single-select | `WhatsApp` · `WeChat` · `Email` · `SMS` | `WhatsApp` |

Wide chip = `height:44px; padding:0 18px; border-radius:12px; font-size:13.5px; font-weight:500`;
row `flex flex-wrap gap-2`; full-width row. Selected `#0E2350`/`#FFFFFF`/`1.5px #0E2350`;
unselected `#FFFFFF`/`#3D4A5C`/`1.5px #D8DFEA`.

The design's default `WhatsApp` and the schema's `.default('whatsapp')` agree — keep it. `051` asserts
`whatsapp` is `aria-checked="true"` on arrival and `053` asserts the same, so this is the one chip
group where a preselection is correct.

The four lucide icons currently rendered inside these chips (`CONTACT_CHANNELS` in
`constants/student-wizard.constants.ts`: `MessageCircle`, `MessageSquare`, `Mail`, `Smartphone`) are
NOT in the design's chip — the portal chip is a text pill. Drop the icons from the render (the
`icon` field stays on the type for other consumers), so the chip matches the spec and the accessible
name stays exactly the channel label, which is what both specs match on with `exact: true`.

Motion: the chip's own 150ms colour transition (task 206).

## Files
- `src/modules/student-wizard/components/StepGuardian.tsx` — `size="wide"`, no `icon` passed
- `src/modules/student-wizard/constants/student-wizard.constants.ts` — `CONTACT_CHANNELS` kept, its
  icons simply unused by this call site (delete only if grep shows no other consumer)

## Depends on
206 — the portal chip variant and its roving radiogroup.

## Steps
1. Pass `size="wide"` and stop forwarding `icon` at this call site.
2. Run `051` (EN + ZH) and `053` first, then the rest.

## Project rules
`.claude/rules/quality.md` (44px; radiogroup; keyboard; accessible names) ·
`.claude/rules/module-pattern.md` (constants stay in `constants/`; do not delete a still-referenced
export) · `.claude/rules/tailwind.md` · `.claude/rules/i18n.md`.

## Done criteria
- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright: `getByRole('radiogroup', { name: 'Preferred contact channel' })` holds 4 radios; each
  computes `height: 44px`, `padding-left: 18px`, `border-radius: 12px`, `font-size: 13.5px`; the
  WhatsApp chip is `aria-checked="true"` on arrival with the navy fill and white text.
- `051`'s interaction block passes unchanged: clicking WeChat flips both `aria-checked` values;
  focus + ArrowRight selects and focuses Email; ArrowLeft returns to WeChat.
- `053`'s block passes unchanged: 4 radios, WhatsApp checked, every option ≥44×44 by pointer walk.
- The accessible name of each chip is exactly the channel label (no icon text leakage) — the specs
  match with `exact: true`.
- ZH: `051`'s localized run still finds the WeChat chip by its translated name.
- Reduced motion: computed `transition-property: none`.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern grep hits.
- `051`, `052`, `053`, `student-wizard-contrast`, `dashboard-students` green.

## Assumptions
Dropping the chip icons is a design-conformance change, not a feature removal; the enum, the default
and the wire values are untouched.

## Evidence
