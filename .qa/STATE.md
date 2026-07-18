# STATE.md — mission 2 board (mirror of STATE.json)

Mission: parent auth (password + Google-wired), student passwordless magic-link API,
parent dashboard (list/add students), global search — borrowed from schoolgo.
Contracts: .qa/CONTRACTS.md · Tasks: .thellmspace/tasks/ (25) · Plan: .qa/PLAN.md

## Board
| # | Task | Depends | Status | Verify |
|---|------|---------|--------|--------|
| 01 | Email provider (SMTP→Mailhog) | — | TODO | — |
| 02 | Student schema +email +parent | — | TODO | — |
| 03 | Parent role + grants | 02 | TODO | — |
| 04 | Magic-link model + service | 01,02 | TODO | — |
| 05 | request/verify/me endpoints | 04 | TODO | — |
| 06 | Parent-issue endpoint | 03,04 | TODO | — |
| 07 | Seed parent + students | 02,03 | TODO | — |
| 08 | Register→parent role ext | 03 | TODO | — |
| 09 | Google provider config | — | TODO | — |
| 10 | Parent students CRUD | 02,03 | TODO | — |
| 11 | Search endpoint | 10 | TODO | — |
| 12 | Sign-in page + errors | — | TODO | — |
| 13 | Sign-up page | 08,12 | TODO | — |
| 14 | Google button + callback | 09,12 | TODO | — |
| 15 | Dashboard route + guard | — | TODO | — |
| 16 | Students list | 10,15 | TODO | — |
| 17 | Add-student dialog | 16 | TODO | — |
| 18 | Search bar UI | 11,16 | TODO | — |
| 19 | E2E parent login | 07,16 | TODO | — |
| 20 | E2E invalid creds | 12 | TODO | — |
| 21 | E2E add student | 17 | TODO | — |
| 22 | E2E search | 18 | TODO | — |
| 23 | E2E magic-link flow | 05,07 | TODO | — |
| 24 | E2E a11y + regression | 19–23 | TODO | — |
| 25 | Critic ×2 + REPORT | 24 | TODO | — |

Boot-gate: api :5500 healthy ✓ (running), web :3100, mailhog :1025/:8025 ✓,
postgres :5540 ✓, seeded-read via teacher JWT (see .qa/STACK.json).
