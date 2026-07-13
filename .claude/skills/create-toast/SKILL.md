---
name: create-toast
description: Create toast notifications using shadcn/ui toast system
---

# Create Toast Notifications

Creates toast notifications using shadcn/ui's toast system with proper styling, variants, and action buttons.

## Usage
```
/create-toast [--with-action] [--with-progress]
```

## Instructions

### 1. Setup Toaster in Layout
File: `src/app/[locale]/layout.jsx`

```jsx
import { Toaster } from '@/components/ui/toaster';

export default function LocaleLayout({ children }) {
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}
```

### 2. Basic Toast Usage
File: `src/modules/[module]/components/ExampleComponent.jsx`

```jsx
'use client';

import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

export function ExampleComponent() {
  const { toast } = useToast();

  const handleSuccess = () => {
    toast({
      title: 'Success!',
      description: 'Your changes have been saved.',
    });
  };

  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Something went wrong. Please try again.',
      variant: 'destructive',
    });
  };

  return (
    <div className="flex gap-2">
      <Button onClick={handleSuccess}>Show Success</Button>
      <Button variant="destructive" onClick={handleError}>Show Error</Button>
    </div>
  );
}
```

### 3. Toast Variants
```jsx
const { toast } = useToast();

// Default (neutral)
toast({
  title: 'Notification',
  description: 'This is a default toast.',
});

// Destructive (error)
toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
});

// Success (custom variant)
toast({
  title: 'Success!',
  description: 'Operation completed successfully.',
  className: 'bg-success text-success-foreground',
});

// Warning (custom variant)
toast({
  title: 'Warning',
  description: 'Please review before continuing.',
  className: 'bg-warning text-warning-foreground',
});
```

### 4. Toast with Action Button
```jsx
const { toast } = useToast();

toast({
  title: 'Item deleted',
  description: 'The item has been moved to trash.',
  action: (
    <ToastAction
      altText="Undo delete action"
      onClick={() => handleUndo()}
    >
      Undo
    </ToastAction>
  ),
});
```

### 5. Toast with Close Button
```jsx
const { toast, dismiss } = useToast();

const showToast = () => {
  const { id } = toast({
    title: 'Processing...',
    description: 'Please wait while we process your request.',
    duration: Infinity, // Won't auto-dismiss
  });

  // Later, dismiss programmatically
  setTimeout(() => {
    dismiss(id);
    toast({
      title: 'Complete!',
      description: 'Processing finished.',
    });
  }, 3000);
};
```

### 6. Promise Toast Pattern
File: `src/modules/core/lib/toast-promise.js`

```jsx
import { toast } from '@/components/ui/use-toast';

export async function toastPromise(promise, messages) {
  const { id } = toast({
    title: messages.loading?.title || 'Loading...',
    description: messages.loading?.description,
  });

  try {
    const result = await promise;

    toast({
      id,
      title: messages.success?.title || 'Success!',
      description: messages.success?.description,
    });

    return result;
  } catch (error) {
    toast({
      id,
      title: messages.error?.title || 'Error',
      description: messages.error?.description || error.message,
      variant: 'destructive',
    });

    throw error;
  }
}

// Usage
const handleSave = async () => {
  await toastPromise(saveData(data), {
    loading: { title: 'Saving...', description: 'Please wait' },
    success: { title: 'Saved!', description: 'Your changes are saved' },
    error: { title: 'Error', description: 'Failed to save changes' },
  });
};
```

### 7. Custom Toast Hook with Translations
File: `src/modules/core/hooks/useAppToast.js`

```jsx
'use client';

import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/use-toast';

export function useAppToast() {
  const { toast, dismiss, toasts } = useToast();
  const t = useTranslations('Toast');

  return {
    success: (key, options = {}) =>
      toast({
        title: t(`${key}.title`),
        description: t(`${key}.description`),
        ...options,
      }),

    error: (key, options = {}) =>
      toast({
        title: t(`${key}.title`),
        description: t(`${key}.description`),
        variant: 'destructive',
        ...options,
      }),

    custom: toast,
    dismiss,
    toasts,
  };
}

// Usage
const { success, error } = useAppToast();
success('userCreated');
error('networkError');
```

### 8. Translation Keys
File: `src/i18n/messages/en.json`

```json
{
  "Toast": {
    "userCreated": {
      "title": "User created",
      "description": "The new user has been added successfully."
    },
    "userDeleted": {
      "title": "User deleted",
      "description": "The user has been removed."
    },
    "networkError": {
      "title": "Network error",
      "description": "Unable to connect. Please check your connection."
    },
    "validationError": {
      "title": "Validation error",
      "description": "Please check the form for errors."
    }
  }
}
```

### 9. Toast Configuration
File: `src/components/ui/toaster.jsx`

```jsx
'use client';

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast';
import { useToast } from '@/components/ui/use-toast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
```

### 10. Validation Checklist
- [ ] `Toaster` component in layout
- [ ] Uses `useToast` hook
- [ ] Destructive variant for errors
- [ ] Action button for undo operations
- [ ] Translations for all messages
- [ ] Duration appropriate (default 5000ms)
- [ ] Accessible (screen reader announces)
- [ ] Consistent styling across app

## Toast Durations
```jsx
// Quick notification (3 seconds)
toast({ ...props, duration: 3000 });

// Default (5 seconds)
toast({ ...props });

// Longer (10 seconds)
toast({ ...props, duration: 10000 });

// Persistent (requires manual dismiss)
toast({ ...props, duration: Infinity });
```

## Do NOT
- ❌ Use alerts for async operations (use toast)
- ❌ Show toast for every action (only important ones)
- ❌ Forget Toaster in layout
- ❌ Hardcode toast messages (use translations)
- ❌ Stack too many toasts (limit active toasts)
