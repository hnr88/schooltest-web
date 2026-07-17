---
id: 10
title: Landing — how-it-works + testimonial, pricing, FAQ
layer: ui
kind: build
slice: landing sections 9–11
target: src/modules/landing/components/{HowItWorksSection,TestimonialCard,PricingSection,FaqSection}.tsx
contract: C-PAGE-LANDING
status: TODO
depends_on: [01, 02, 03, 05, 06]
---
## Objective
Build landing sections 9–11 as separate server components. All copy from Home.* keys.

## Contract (C-PAGE-LANDING 9–11)
9. HowItWorksSection id=`for-schools`: Container, grid lg:grid-cols-2 gap-6;
   - Left Card (p-8): Eyebrow (howItWorks.eyebrow) + ordered 3 steps: number in blue-50
     text-blue-600 rounded-full size-8 grid place-items-center font-bold text-sm; title
     font-semibold; description text-sm text-muted-foreground.
   - Right TestimonialCard (Card p-8 flex flex-col gap-4): 5 Star icons (fill-amber-400
     text-amber-400, aria-label testimonial.ratingLabel on the row, stars aria-hidden);
     blockquote text-lg leading-relaxed "quote" (quote mark included in message); footer:
     PresenceAvatar initials LP + name font-semibold text-sm + role text-sm
     text-muted-foreground.
10. PricingSection id=`pricing`: Container; Eyebrow centered + h2 centered text-4xl
    font-bold; grid md:grid-cols-3 gap-6 items-stretch; tier cards (Card h-full flex
    flex-col p-8): name font-semibold, price row (text-4xl font-bold + suffix
    text-muted-foreground), feature list (li flex gap-2, CircleCheck text-teal-600; the
    Free tier's AI feature is EXCLUDED: text-muted-foreground line-through with X icon
    text-slate-300), CTA Button className mt-auto w-full → `#cta`:
    - Free: outline Button (freeCta)
    - Pro: navy card (bg-navy-900 text-white border-navy-900, features text-blue-100/85,
      Badge accent proBadge top-right), default Button (proCta)
    - School: outline Button (schoolCta), price text-4xl font-bold (Custom).
11. FaqSection id=`resources`: Container narrower (max-w-3xl); h2 text-center text-4xl
    font-bold (faq.title); Accordion (type single, collapsible, defaultValue first item)
    with 4 items; trigger text-left font-semibold; content text-muted-foreground.

## Files
- CREATE the 4 components; EDIT landing/index.ts; EDIT src/app/page.tsx (append sections).

## Steps
1. Build via design-system barrel (Card, Button, Badge, Eyebrow, Container, PresenceAvatar,
   Accordion family). 2. Compose page. 3. tsc+lint zero errors.

## Project rules
i18n.md, tailwind.md (no arbitrary values), quality.md (heading order; accordion keyboard
support comes free from Base UI — do not hand-roll), imports.md.

## Done criteria
- 4 components; page renders sections 1–11; zero hardcoded strings; FAQ accordion is the ui
  primitive (not hand-rolled); pricing CTAs all href `#cta`; tsc+lint zero errors.
## Assumptions
- Accordion defaultValue = first item value ("accounts").
## Evidence
(filled by builder/verifier)
