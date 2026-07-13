---
name: create-component
description: Create a React component following naming conventions and shadcn/ui patterns
---

# Create React Component

Creates a reusable React component following project standards with proper TypeScript types and composition patterns.

## Usage
```
/create-component [component-name] [--client] [--with-form] [--with-modal]
```

Example: `/create-component UserCard --client`

## Instructions

### 1. Component File Structure
Place in: `src/modules/[module-name]/components/[ComponentName].jsx`

### 2. Basic Component Template
```jsx
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function ComponentName({
  children,
  className = '',
  variant = 'default',
  size = 'md',
  ...props
}) {
  return (
    <div
      className={cn(
        'base-classes',
        {
          'variant-default': variant === 'default',
          'variant-secondary': variant === 'secondary',
          'size-md': size === 'md',
          'size-lg': size === 'lg',
        },
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
```

### 3. Client Component with State
If `--client`, add `'use client'` at top:

```jsx
'use client';

import { ReactNode, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function InteractiveComponent({
  onAction,
  className = '',
  ...props
}) {
  const t = useTranslations('Component');
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = () => {
    setIsOpen(!isOpen);
    onAction?.();
  };

  return (
    <div className={cn('flex flex-col gap-4', className)} {...props}>
      <Button onClick={handleClick}>
        {t(isOpen ? 'close' : 'open')}
      </Button>
      {isOpen && <div>{t('content')}</div>}
    </div>
  );
}
```

### 4. Component Using shadcn/ui
Always check if shadcn has the component first.

```jsx
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserCard({ user, onEdit }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600">{user.email}</p>
        <Button onClick={onEdit} className="mt-4">
          Edit
        </Button>
      </CardContent>
    </Card>
  );
}
```

### 5. Compound Component Pattern
```jsx
export function Container({ children, className = '' }) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

Container.Header = function Header({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-bold">{title}</h2>
      {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
    </div>
  );
};

Container.Body = function Body({ children }) {
  return <div className="py-4">{children}</div>;
};

Container.Footer = function Footer({ children }) {
  return <div className="border-t pt-4 mt-4">{children}</div>;
};

// Usage
<Container>
  <Container.Header title="Title" subtitle="Subtitle" />
  <Container.Body>Content</Container.Body>
  <Container.Footer>Footer</Container.Footer>
</Container>
```

### 6. Component with Modal (if `--with-modal`)
```jsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function ModalComponent() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Open Modal</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modal Title</DialogTitle>
        </DialogHeader>
        <div className="py-4">Modal content</div>
      </DialogContent>
    </Dialog>
  );
}
```

### 7. Add Translations
File: `src/i18n/messages/en.json`

```json
{
  "ComponentName": {
    "title": "Component Title",
    "action": "Take Action",
    "empty": "No data available"
  }
}
```

### 8. Validation Checklist
- [ ] File named as PascalCase: `ComponentName.jsx`
- [ ] Placed in `src/modules/[module]/components/`
- [ ] Exported as named export
- [ ] Uses `cn()` for className combinations
- [ ] Props destructured with defaults
- [ ] Uses `@/` imports only
- [ ] Client components have `'use client'` at top
- [ ] shadcn components used where available
- [ ] Tailwind classes only (no inline styles)
- [ ] File under 120 lines
- [ ] Translations added for all locales

## Naming Conventions
- Component: `UserProfile`, `StudentCard`, `ClassForm`
- Props: `isLoading`, `hasError`, `onSubmit`, `className`
- Handlers: `handleClick`, `handleChange`, `handleSubmit`
- Booleans: `isOpen`, `isLoading`, `isActive`, `hasError`

## Do NOT
- ❌ Create components directly in `src/components/` (use modules)
- ❌ Use relative imports (`../`)
- ❌ Style with inline styles or CSS-in-JS
- ❌ Forget `'use client'` when using hooks
- ❌ Create custom UI that shadcn has
- ❌ Pass all props with `{...props}` without explicit forwarding
