# Ops Portal — Journeys & Bugs

Working log for the Ops page. New issues get appended as the operator reports them; fixed ones get a status update with the commit.

Design source of truth:
- `mvp/_shared-designs/SchoolTest Design System.dc.html` (global components: buttons, forms, dialogs)
- `mvp/ops/designs/Ops Portal.dc.html` (ops-specific screens)

Design tokens (from the design system):
- Button default: `font-size 14px / 600`, `padding 10px 18px`, `radius 10px` (~40px tall)
- Button small: `font-size 13px`, `padding 7px 13px`, `radius 8px`
- Button large: `font-size 15px`, `padding 13px 26px`, `radius 12px`
- Icon button: `38×38`, `radius 10px`
- Input/select: `padding 10px 13px`, `radius 10px`, `font-size 14px`, border `#CBD5E1` (~41px tall)
- Ops-specific (Ops Portal design): buttons pill-shaped (`radius 999px`), CTA `44px` tall, inputs `48px` tall / `radius 12px`, modal `width 540px` / `radius 24px` / `padding 22–28px`, dropdown menu items `padding 10px 12px` (~40px rows), menu container `radius 16px`

---

## Bugs

### BUG-001 — Buttons are too small and don't follow the design (GLOBAL)
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — every page, not just ops. Worst offenders: dropdown menu items (row actions menus, select dropdowns).
- **Symptom:** Rendered buttons are visibly smaller than the design's buttons (design default ≈ 40px tall with `padding 10px 18px`; dropdown/menu items too cramped to click comfortably).
- **Expected:** Buttons match the design system sizes above (default padding `10px 18px`, small `7px 13px`, large `13px 26px`); dropdown menu items sized to match (comfortable touch targets, not micro rows).
- **Status:** FIXED (2026-09-11)

### BUG-002 — Modals are too small (invite admin modal + others)
- **Reported:** 2026-09-11 by operator
- **Scope:** Ops portal modals — invite admin modal called out explicitly, "and other modals".
- **Symptom:** Modal dialogs render too small/cramped compared to the design (design: `width 540px`, `radius 24px`, header/body padding `22–28px`; current implementation: `max-w 520px`, `p-4`).
- **Expected:** Modals sized generously per the design (comfortable padding, content width, and spacing).
- **Status:** FIXED (2026-09-11)

### BUG-003 — Input heights are inconsistent across the application
- **Reported:** 2026-09-11 by operator
- **Scope:** GLOBAL — "some inputs are super small and the other ones are taller".
- **Symptom:** Input fields render at different heights depending on the page/component instead of one shared size (current `Input` is `h-8` = 32px; ops design spec is `48px`).
- **Expected:** All inputs/selects/textareas share one tall design size (`height 48px`, `radius 12px` per the ops design) and look the same across the application.
- **Status:** FIXED (2026-09-11)

---

## Journeys

(none logged yet)
