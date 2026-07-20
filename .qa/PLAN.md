# PLAN.md — mission 2: auth + parent dashboard + search

Deliver: styled login (parent password + Google-wired), student passwordless magic-link
API (schooltest-app's existing client contract), parent dashboard (list/add students),
global search — borrowed from schoolgo, built with our design system.

## Complexity band
MEDIUM — 25 tasks. Full-stack (api schema/endpoints/auth/search + web pages/dashboard +
desktop-flow e2e + email infra). Concurrency: 1 (config). ~7 waves ≤ 50.

## Waves
- W0 orchestrator: artifacts, boot-gate (api :5500, web :3100, app renderer :3002, mailhog,
  seeded record read). [this]
- W1 api foundation: 01 email provider · 02 student schema · 03 parent role ·
  04 magic-link model+service · 05 request/verify/me endpoints · 06 parent-issue endpoint ·
  07 seed parent+students
- W2 api auth+search: 08 register extension (parent role) · 09 Google grant config ·
  10 parent students list/create · 11 search endpoint
- W3 web auth: 12 sign-in page + password login + errors · 13 sign-up page ·
  14 Google button + callback
- W4 web dashboard: 15 route+guard · 16 students list · 17 add-student dialog ·
  18 search bar UI
- W5 e2e: 19 login flow · 20 invalid creds · 21 add student+reload · 22 search ·
  23 magic-link full flow (app→mailhog→verify→/home) · 24 a11y+responsive+Google-BLOCKED doc
- W6: 25 critic loop ×2 clean + REPORT.md

## DAG
01:— · 02:— · 03:02 · 04:01,02 · 05:04 · 06:04,03 · 07:03,02 · 08:03 ·
09:— · 10:02,03 · 11:10 · 12:— · 13:08,12 · 14:09,12 · 15:— · 16:10,15 ·
17:16 · 18:11,16 · 19:16,07 · 20:12 · 21:17 · 22:18 · 23:05,07 · 24:19,20,21,22,23 ·
25:24

## Discipline
Serial build(coder)→verify(fresh explore). Wave critic before each commit. tsc+lint zero
errors per wave gate. Watchdog: stuck-checker only + restart schooltest-web dev on :3100
(api runs on its own uptime; restart manually if it dies — D-logged).

---

# UI polish + parent notifications mission (2026-07-20)

Deliver exactly the requested polish: one logo per auth screen; a dark primary sidebar;
larger, image-led school results with grouped filters; a usable agent search; readable
student selection controls; child cards and detail metrics; separated settings tabs; and
the already-persisted notification system surfaced in the web app, including browser-push
subscription and the existing SMS-preparation API.

## Complexity band

MEDIUM — 14 thin vertical slices. The work crosses existing Next modules and two additive
Strapi read/config surfaces, while notifications already have real persisted backend models.
The user explicitly requested no fan-out, so tasks are deliberately serialized. Every slice
has an independent Playwright/API verifier before its status becomes DONE.

## DAG

28:— · 29:28 · 30:29 · 31:30 · 32:31 · 33:32 · 34:33 · 35:34 ·
36:35 · 37:36 · 38:37 · 39:38 · 40:39 · 41:40

## Waves

- W1: 28–33, visual fixes against existing live data.
- W2: 34–35, parent-owned child progress contract and detail screen.
- W3: 36–39, tabbed settings and notification/push user surfaces.
- W4: 40–41, live delivery sweep, critic, and regression proof.
