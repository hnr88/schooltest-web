---
name: create-dialog
description: Create accessible modal dialogs using Radix UI and shadcn/ui patterns
---

# Create Dialog/Modal Component

Creates accessible dialog components using Radix UI primitives with proper focus management, keyboard navigation, and animation.

## Usage
```
/create-dialog [dialog-name] [--with-form] [--confirmation] [--fullscreen]
```

## Instructions

### 1. Basic Dialog Pattern
File: `src/modules/[module]/components/ExampleDialog.jsx`

```jsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

export function ExampleDialog({ trigger, onConfirm }) {
  const t = useTranslations('Dialogs.Example');
  const [open, setOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm?.();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button variant="outline">{t('openButton')}</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Dialog content goes here */}
          <p className="text-sm text-muted-foreground">
            {t('content')}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline">{t('cancel')}</Button>
          </DialogClose>
          <Button onClick={handleConfirm}>{t('confirm')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

### 2. Confirmation Dialog (Destructive Action)
File: `src/modules/[module]/components/ConfirmDeleteDialog.jsx`

```jsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function ConfirmDeleteDialog({
  trigger,
  title,
  description,
  onConfirm,
  isLoading = false,
}) {
  const t = useTranslations('Dialogs.Delete');
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    await onConfirm?.();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="destructive" size="sm">
            {t('deleteButton')}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle>{title || t('title')}</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pl-13">
            {description || t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            {t('cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? t('deleting') : t('confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
```

### 3. Dialog with Form
File: `src/modules/[module]/components/EditDialog.jsx`

```jsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

export function EditDialog({ open, onOpenChange, initialData, onSubmit }) {
  const t = useTranslations('Dialogs.Edit');
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      email: initialData?.email || '',
    },
  });

  const handleSubmit = async (data) => {
    setIsLoading(true);
    try {
      await onSubmit(data);
      onOpenChange(false);
      form.reset();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
          <DialogDescription>{t('description')}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('nameLabel')}</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('emailLabel')}</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                {t('cancel')}
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t('saving') : t('save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### 4. Controlled Dialog Pattern
```jsx
'use client';

import { useState } from 'react';
import { EditDialog } from './EditDialog';

export function UserCard({ user }) {
  const [editOpen, setEditOpen] = useState(false);

  const handleEdit = async (data) => {
    // Save to API
    await updateUser(user.id, data);
  };

  return (
    <div>
      <Button onClick={() => setEditOpen(true)}>Edit</Button>

      <EditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        initialData={user}
        onSubmit={handleEdit}
      />
    </div>
  );
}
```

### 5. Dialog Sizes
```jsx
// Small (default for confirmations)
<DialogContent className="sm:max-w-sm">

// Medium (default)
<DialogContent className="sm:max-w-md">

// Large (for forms)
<DialogContent className="sm:max-w-lg">

// Extra large (for complex content)
<DialogContent className="sm:max-w-xl">

// Full width
<DialogContent className="sm:max-w-4xl">

// Fullscreen (mobile-first)
<DialogContent className="h-full max-h-full sm:h-auto sm:max-h-[85vh] sm:max-w-lg">
```

### 6. Validation Checklist
- [ ] Uses shadcn `Dialog` or `AlertDialog`
- [ ] Has `DialogTitle` (required for accessibility)
- [ ] Has `DialogDescription` (screen reader context)
- [ ] Uses `DialogClose` or controlled state
- [ ] Form dialogs reset on close
- [ ] Loading states disable buttons
- [ ] Destructive actions use `AlertDialog`
- [ ] Uses `asChild` for custom triggers
- [ ] Translations for all text
- [ ] Proper button order (cancel, then action)

## Accessibility Features (Built-in with Radix)
- Focus trapped inside dialog
- Escape key closes dialog
- Click outside closes dialog (Dialog only)
- Focus returns to trigger on close
- Proper ARIA labels and roles
- Screen reader announcements

## Do NOT
- ❌ Use native `<dialog>` element (use Radix)
- ❌ Forget DialogTitle (breaks accessibility)
- ❌ Nest forms outside DialogContent
- ❌ Use z-index hacks (Radix handles layering)
- ❌ Remove focus trap (security concern)
