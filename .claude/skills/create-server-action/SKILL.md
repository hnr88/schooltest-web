---
name: create-server-action
description: Create a Next.js Server Action with Zod validation and error handling
---

# Create Server Action

Creates a type-safe Server Action with Zod input validation, error handling, and cache revalidation.

## Usage
```
/create-server-action [action-name] [--model ModelName]
```

## Instructions

### 1. Create the action file
Location: `src/app/[feature]/actions.ts` or `src/modules/[module]/lib/actions.ts`

### 2. Template
```tsx
'use server';

import { z } from 'zod';
import { revalidateTag } from 'next/cache';

const CreateItemSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().optional(),
});

type ActionResult = { success: true; data: any } | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export async function createItem(formData: FormData): Promise<ActionResult> {
  const raw = Object.fromEntries(formData);
  const parsed = CreateItemSchema.safeParse(raw);

  if (!parsed.success) {
    return { success: false, error: 'Validation failed', fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const item = await db.items.create({ data: parsed.data });
    revalidateTag('items');
    return { success: true, data: item };
  } catch (err) {
    return { success: false, error: 'Failed to create item' };
  }
}
```

### 3. Usage in Client Component
```tsx
'use client';
import { useActionState } from 'react';
import { createItem } from './actions';

export function CreateForm() {
  const [state, action, pending] = useActionState(createItem, null);
  return (
    <form action={action}>
      <input name="title" />
      {state?.fieldErrors?.title && <p>{state.fieldErrors.title[0]}</p>}
      <button disabled={pending}>{pending ? 'Creating...' : 'Create'}</button>
    </form>
  );
}
```

## Validation Checklist
- [ ] File starts with 'use server'
- [ ] Zod schema validates all inputs
- [ ] Returns typed ActionResult
- [ ] Revalidates relevant cache tags
- [ ] Error handling with try/catch
