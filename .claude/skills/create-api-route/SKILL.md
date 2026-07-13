---
name: create-api-route
description: Create a Next.js App Router API route handler with Zod validation
---

# Create API Route

Creates a Next.js App Router route handler (API endpoint) with proper request validation using Zod, error handling, and TypeScript typing.

## Usage
```
/create-api-route [path] [--methods GET,POST,PUT,DELETE]
```

Example: `/create-api-route students --methods GET,POST`

## Instructions

### 1. Basic GET Route
File: `src/app/api/students/route.ts`

```ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page') ?? '1';
    const limit = searchParams.get('limit') ?? '10';

    // Fetch data from your backend/database
    const response = await fetch(
      `${process.env.API_URL}/students?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.API_TOKEN}`,
        },
        next: { revalidate: 60 },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch students');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 2. POST Route with Zod Validation
File: `src/app/api/students/route.ts`

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const CreateStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  classId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = CreateStudentSchema.parse(body);

    const response = await fetch(`${process.env.API_URL}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message ?? 'Failed to create student' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error('POST /api/students error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 3. Dynamic Route with PUT and DELETE
File: `src/app/api/students/[id]/route.ts`

```ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const UpdateStudentSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  classId: z.string().uuid().optional(),
});

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const response = await fetch(`${process.env.API_URL}/students/${id}`, {
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(`GET /api/students/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const body = await request.json();
    const validated = UpdateStudentSchema.parse(body);

    const response = await fetch(`${process.env.API_URL}/students/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify(validated),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to update student' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    console.error(`PUT /api/students/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;

  try {
    const response = await fetch(`${process.env.API_URL}/students/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.API_TOKEN}`,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to delete student' },
        { status: response.status }
      );
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(`DELETE /api/students/${id} error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 4. Route with Authentication Check
```ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Proceed with authenticated request...
}
```

### 5. Validation Checklist
- [ ] File placed in `src/app/api/[path]/route.ts`
- [ ] Uses `NextResponse` from `next/server`
- [ ] Zod schema for request body validation
- [ ] Proper error handling with try/catch
- [ ] Returns appropriate HTTP status codes
- [ ] Logs errors to console for debugging
- [ ] Dynamic params use `Promise<{ id: string }>` pattern
- [ ] Environment variables for API URLs
- [ ] TypeScript types for all data

## HTTP Status Codes
```
200 - OK (GET, PUT success)
201 - Created (POST success)
204 - No Content (DELETE success)
400 - Bad Request (validation error)
401 - Unauthorized (no auth)
403 - Forbidden (no permission)
404 - Not Found
500 - Internal Server Error
```

## Do NOT
- ❌ Use `pages/api` - use App Router `app/api`
- ❌ Skip Zod validation for POST/PUT bodies
- ❌ Return raw errors to client (security risk)
- ❌ Forget to await params in dynamic routes
- ❌ Hardcode API URLs - use env variables
- ❌ Skip error logging
