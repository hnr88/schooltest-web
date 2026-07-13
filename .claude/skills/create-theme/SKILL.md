---
name: create-theme
description: Create Tailwind v4 theme with CSS variables, design tokens, and dark mode
---

# Create Theme with Design Tokens

Creates a comprehensive theming system using Tailwind v4's CSS-first configuration with @theme directive, semantic color tokens, and dark mode support.

## Usage
```
/create-theme [--with-dark-mode] [--brand-colors]
```

## Instructions

### 1. Define Base Theme in globals.css
File: `src/app/globals.css`

```css
@import "tailwindcss";

/* ========== BASE DESIGN TOKENS ========== */
@theme {
  /* Color Palette - Using OKLCH for perceptual consistency */
  --color-background: oklch(100% 0 0);
  --color-foreground: oklch(14.5% 0.03 264);

  /* Primary Brand Colors */
  --color-primary-50: oklch(97% 0.01 264);
  --color-primary-100: oklch(94% 0.02 264);
  --color-primary-200: oklch(88% 0.04 264);
  --color-primary-300: oklch(80% 0.06 264);
  --color-primary-400: oklch(70% 0.09 264);
  --color-primary-500: oklch(58% 0.12 264);
  --color-primary-600: oklch(50% 0.14 264);
  --color-primary-700: oklch(42% 0.12 264);
  --color-primary-800: oklch(35% 0.10 264);
  --color-primary-900: oklch(28% 0.08 264);
  --color-primary-950: oklch(18% 0.05 264);

  /* Semantic Colors */
  --color-card: var(--color-background);
  --color-card-foreground: var(--color-foreground);
  --color-popover: var(--color-background);
  --color-popover-foreground: var(--color-foreground);
  --color-primary: var(--color-primary-600);
  --color-primary-foreground: oklch(100% 0 0);
  --color-secondary: oklch(96% 0.01 264);
  --color-secondary-foreground: var(--color-primary-900);
  --color-muted: oklch(96% 0.01 264);
  --color-muted-foreground: oklch(55% 0.02 264);
  --color-accent: oklch(96% 0.01 264);
  --color-accent-foreground: var(--color-primary-900);
  --color-destructive: oklch(57% 0.22 27);
  --color-destructive-foreground: oklch(100% 0 0);
  --color-success: oklch(65% 0.17 145);
  --color-success-foreground: oklch(100% 0 0);
  --color-warning: oklch(75% 0.15 75);
  --color-warning-foreground: oklch(20% 0.05 75);
  --color-border: oklch(90% 0.01 264);
  --color-input: oklch(90% 0.01 264);
  --color-ring: var(--color-primary-500);

  /* Radius Tokens */
  --radius-none: 0;
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
  --radius-2xl: 1rem;
  --radius-full: 9999px;

  /* Spacing Scale (follows 4px grid) */
  --spacing-0: 0;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
  --spacing-3: 0.75rem;
  --spacing-4: 1rem;
  --spacing-5: 1.25rem;
  --spacing-6: 1.5rem;
  --spacing-8: 2rem;
  --spacing-10: 2.5rem;
  --spacing-12: 3rem;
  --spacing-16: 4rem;

  /* Typography Scale */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  /* Line Heights */
  --leading-none: 1;
  --leading-tight: 1.25;
  --leading-snug: 1.375;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;

  /* Motion Tokens */
  --duration-instant: 0ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);

  /* Shadow Tokens */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
}

/* ========== DARK MODE OVERRIDES ========== */
.dark {
  --color-background: oklch(14.5% 0.03 264);
  --color-foreground: oklch(98% 0.01 264);
  --color-card: oklch(18% 0.03 264);
  --color-card-foreground: oklch(98% 0.01 264);
  --color-popover: oklch(18% 0.03 264);
  --color-popover-foreground: oklch(98% 0.01 264);
  --color-primary: var(--color-primary-400);
  --color-primary-foreground: oklch(14.5% 0.03 264);
  --color-secondary: oklch(22% 0.03 264);
  --color-secondary-foreground: oklch(98% 0.01 264);
  --color-muted: oklch(22% 0.03 264);
  --color-muted-foreground: oklch(65% 0.02 264);
  --color-accent: oklch(22% 0.03 264);
  --color-accent-foreground: oklch(98% 0.01 264);
  --color-border: oklch(28% 0.03 264);
  --color-input: oklch(28% 0.03 264);
  --color-ring: var(--color-primary-400);
}

/* ========== BASE STYLES ========== */
@layer base {
  * {
    @apply border-border;
  }

  body {
    @apply bg-background text-foreground antialiased;
    font-feature-settings: "rlig" 1, "calt" 1;
  }

  /* Focus ring for accessibility */
  :focus-visible {
    @apply outline-none ring-2 ring-ring ring-offset-2 ring-offset-background;
  }
}
```

### 2. Create Theme Provider
File: `src/components/providers/ThemeProvider.jsx`

```jsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => null,
});

export function ThemeProvider({ children, defaultTheme = 'system' }) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

### 3. Create Theme Toggle Component
File: `src/modules/core/components/ThemeToggle.jsx`

```jsx
'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/components/providers/ThemeProvider';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

### 4. Using Theme Tokens in Components

```jsx
// Use semantic tokens, not hardcoded values
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
  <p className="text-muted-foreground">Description</p>
  <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2">
    Action
  </button>
</div>

// Use radius tokens
<div className="rounded-md">Small radius</div>
<div className="rounded-lg">Large radius</div>

// Use spacing tokens
<div className="p-4 space-y-2">Content</div>

// Use shadow tokens
<div className="shadow-md">Card with shadow</div>
```

### 5. Validation Checklist
- [ ] Theme tokens defined in `@theme` directive
- [ ] OKLCH colors for perceptual consistency
- [ ] Semantic color naming (background, foreground, primary, etc.)
- [ ] Dark mode overrides using `.dark` class
- [ ] Radius scale defined (sm, md, lg, xl)
- [ ] Spacing follows 4px grid
- [ ] Motion tokens for consistent animations
- [ ] ThemeProvider wraps app
- [ ] Focus ring styles for accessibility
- [ ] No hardcoded color values in components

## Token Naming Convention

| Token Type | Pattern | Example |
|------------|---------|---------|
| Base Colors | `--color-{name}-{shade}` | `--color-primary-500` |
| Semantic | `--color-{semantic}` | `--color-background` |
| Radius | `--radius-{size}` | `--radius-lg` |
| Spacing | `--spacing-{scale}` | `--spacing-4` |
| Duration | `--duration-{speed}` | `--duration-fast` |

## Do NOT
- ❌ Use hardcoded colors (e.g., `bg-blue-500`)
- ❌ Use arbitrary values (e.g., `p-[23px]`)
- ❌ Mix theme systems (keep consistent)
- ❌ Forget dark mode variants
- ❌ Skip accessibility focus states
