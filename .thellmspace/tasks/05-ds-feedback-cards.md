---
id: 05
title: design-system module — feedback & cards (Alert, ProgressBar, StatCard, FeatureCard, EmptyState, PresenceAvatar)
layer: ui
kind: build
slice: feedback + card composites and their re-exports
target: src/modules/design-system/{components,index.ts,types}
contract: C-DS
status: TODO
depends_on: [01]
---
## Objective
Implement the feedback/card composites from C-DS: `Alert`, `ProgressBar`, `StatCard`,
`FeatureCard`, `EmptyState`, `PresenceAvatar`; re-export Card family, Progress, Skeleton,
Spinner, Avatar family through the barrel.

## Contract (C-DS entries — read .qa/CONTRACTS.md first)
- Alert: variants info|success|warning|error. White card, border, rounded-xl, p-4, flex
  gap-3; 36px tinted icon tile (info=blue-50/blue-600 icon Info; success=green-50/green-600
  CheckCircle2-equivalent lucide CircleCheck; warning=amber-50/amber-600 TriangleAlert;
  error=red-50/red-600 CircleAlert); title font-semibold text-sm text-foreground;
  description text-sm text-muted-foreground (children); optional action?: ReactNode row;
  optional onDismiss → ghost icon button (X) with required `dismissLabel` prop when
  onDismiss is set. Server-safe: no 'use client' (onDismiss arrives from client parents).
- ProgressBar: wraps ui/progress; props value (0–100), tone gradient|solid (default solid);
  gradient = indicator bg-gradient-to-r from-blue-600 to-teal-500; required ariaLabel
  (pass aria-label to the progress root).
- StatCard: Card; 34px rounded-lg icon tile tones (blue=blue-50/blue-600, teal=teal-50/
  teal-600, navy=navy-900/white … dark variants with /10 alpha); label text-sm
  text-muted-foreground; value text-[34px] leading-tight font-bold tracking-tight;
  optional delta (positive → text-green-600, neutral → text-muted-foreground, text-sm
  font-medium); optional progress → ProgressBar gradient mt-3.
- FeatureCard: Card h-full; tone light (white, icon tile blue-50/blue-600) | navy
  (bg-navy-900 text-white border-navy-900, icon tile white/10 text-teal-300, description
  text-blue-100/80); icon size-5; title text-lg font-semibold; description text-sm/relaxed.
- EmptyState: centered dashed-border rounded-xl p-10; icon in 40px muted tile; title
  font-semibold; description text-sm text-muted-foreground max-w-sm; optional action.
- PresenceAvatar: wraps ui Avatar+AvatarFallback; sizes sm 24 / default 32 / lg 40 / xl 56;
  initials prop (fallback text, navy-100 bg, navy-900 text); presence online → green-500
  dot ring-2 ring-background absolute bottom-0 right-0.
- Re-exports: Card family (read ui/card.tsx exact exports), Progress, Skeleton, Spinner,
  Avatar/AvatarImage/AvatarFallback.

## Files
- CREATE components/{alert,progress-bar,stat-card,feature-card,empty-state,presence-avatar}.tsx
- EDIT types/design-system.types.ts (shared: Tone, IconTone unions if reused)
- EDIT src/modules/design-system/index.ts (new exports + re-exports, grouped comments)

## Steps
1. Read ui/card.tsx, ui/progress.tsx, ui/avatar.tsx, ui/skeleton.tsx, ui/spinner.tsx for
   exact exports/props. 2. Implement per contract. 3. Barrel. 4. tsc+lint zero errors.

## Project rules
module-pattern, tailwind.md (tokens/palette, no arbitrary values — text-[34px] needs a
token: add `--text-stat: 2.125rem` + line-height to @theme? Prefer existing scale:
use text-4xl (36px) — close to spec 34px and token-clean. DECISION: text-4xl),
imports.md, lucide-react icons only.

## Done criteria
- 6 composites + re-exports exist; typed; className merges; Alert renders all 4 variants
  with correct icon/tint logic; ProgressBar gradient tone works; tsc+lint zero errors;
  no ui/* modifications.
## Assumptions
- 34px stat value → text-4xl token (spec 34px ≈ 36px token; no arbitrary values wins).
## Evidence
(filled by builder/verifier)
