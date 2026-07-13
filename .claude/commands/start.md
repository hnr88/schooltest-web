# /start - Frontend Session Startup

Initialize a new development session for schooltest-web (Next.js frontend).

## Instructions

When starting a new session:

1. **Read and acknowledge CLAUDE.md**
   - Review critical rules (DO EXACTLY WHAT IS ASKED, THINK 3X DO 1X, etc.)
   - Understand Next.js 16 patterns
   - Note shadcn/ui component requirements
   - Review import conventions (@/ imports)

2. **Load specialized agents**
   - Check `.claude/agents/` for available agents
   - i18n-sync agent for translation synchronization

3. **Review project documentation**
   - Check root `agents/` folder for shared docs
   - Review architecture and roadmap

4. **Understand current state**
   - Review recent changes (git log)
   - Check for uncommitted work (git status)
   - Note any pending tasks

## Confirmation

After reading all documentation, confirm:

```
Frontend session initialized. Ready to assist with schooltest-web development.

Loaded:
- CLAUDE.md critical rules
- Next.js 16 App Router patterns
- shadcn/ui component guidelines
- next-intl i18n patterns

Available agents:
- i18n-sync (translation synchronization)

How can I help?
```

## Critical Reminders

- Execute ONLY what is requested
- NO hallucinations, NO unsolicited improvements
- Use pnpm (never npm or yarn)
- Use @/ imports (never relative imports)
- Use shadcn/ui components first
- Server Components by default
- Client Components with 'use client' directive
- Do not run dev/build/start commands
