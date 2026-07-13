---
name: create-form
description: Create a form with react-hook-form + zod + shadcn Form component
---

# Create Form Component

Creates a fully typed form using react-hook-form, zod validation, and shadcn UI form components.

## Usage
```
/create-form [form-name] [--multi-step] [--api-submit]
```

Example: `/create-form UserForm --api-submit`

## Instructions

### 1. Define Zod Schema
File: `src/modules/[module]/lib/[form-name].schema.js`

```js
import { z } from 'zod';

export const UserFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'user', 'guest']),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type UserFormInput = z.infer<typeof UserFormSchema>;
```

### 2. Create Form Component
File: `src/modules/[module]/components/UserForm.jsx`

```jsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { UserFormSchema } from '@/modules/users/lib/user-form.schema';

export function UserForm({ onSubmit, isLoading = false }) {
  const t = useTranslations('Forms.User');

  const form = useForm({
    resolver: zodResolver(UserFormSchema),
    defaultValues: {
      email: '',
      name: '',
      password: '',
      confirmPassword: '',
      role: 'user',
      agreedToTerms: false,
    },
  });

  const handleSubmit = async (data) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('email')}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="user@example.com"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('name')}</FormLabel>
              <FormControl>
                <Input
                  placeholder="Full Name"
                  {...field}
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('role')}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">{t('roleUser')}</SelectItem>
                  <SelectItem value="admin">{t('roleAdmin')}</SelectItem>
                  <SelectItem value="guest">{t('roleGuest')}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('submitting') : t('submit')}
        </Button>
      </form>
    </Form>
  );
}
```

### 3. Form with API Submission (if `--api-submit`)
```jsx
'use client';

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/modules/core/api';
import { useToast } from '@/components/ui/use-toast';
import { UserForm } from './UserForm';

export function UserFormWithSubmit() {
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (data) => apiClient.post('/api/users', { data }),
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  return (
    <UserForm
      onSubmit={(data) => mutation.mutate(data)}
      isLoading={mutation.isPending}
    />
  );
}
```

### 4. Add Translations
File: `src/i18n/messages/en.json`

```json
{
  "Forms": {
    "User": {
      "email": "Email Address",
      "name": "Full Name",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "role": "User Role",
      "roleUser": "User",
      "roleAdmin": "Administrator",
      "roleGuest": "Guest",
      "agreeToTerms": "I agree to the terms and conditions",
      "submit": "Create User",
      "submitting": "Creating..."
    }
  }
}
```

### 5. Validation Checklist
- [ ] Zod schema file created with proper types
- [ ] Form component uses `useForm` with `zodResolver`
- [ ] All form fields have `FormField` wrapper
- [ ] Uses shadcn Form, Input, Select, Checkbox, etc.
- [ ] Has `onSubmit` callback prop
- [ ] Shows loading state during submission
- [ ] Uses `useTranslations()` for all labels/placeholders
- [ ] Translations added to all locales
- [ ] File under 120 lines
- [ ] Uses `@/` imports only

## Common Input Types
```jsx
// Text Input
<Input type="text" placeholder="..." />

// Email
<Input type="email" placeholder="user@example.com" />

// Password
<Input type="password" placeholder="••••••••" />

// Number
<Input type="number" min="0" max="100" />

// Select/Dropdown
<Select onValueChange={field.onChange}>
  <SelectContent>
    <SelectItem value="option">Option</SelectItem>
  </SelectContent>
</Select>

// Checkbox
<Checkbox checked={field.value} onCheckedChange={field.onChange} />

// Textarea
<Textarea placeholder="..." {...field} />
```

## Do NOT
- ❌ Use Formik or custom form handling
- ❌ Forget `zodResolver` in `useForm`
- ❌ Style form with custom CSS
- ❌ Skip `FormMessage` for validation errors
- ❌ Use uncontrolled form fields
- ❌ Hardcode form labels without translations
