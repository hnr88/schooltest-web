import { z } from 'zod';

// Server response schemas for the school admin staff endpoints (C-TCH-01/02,
// C-INV-01/02/03). Kept defensive at the boundary; the UI consumes the parsed
// types from types/teachers.types.ts.

export const schoolTeacherSchema = z.object({
  documentId: z.string(),
  email: z.string(),
  // Users created outside the invitation flow (seeded accounts) can carry
  // null names; the UI falls back to the email for display.
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  blocked: z.boolean(),
  classes: z.array(z.object({ documentId: z.string(), name: z.string() })),
});

export const schoolInvitationSchema = z.object({
  documentId: z.string(),
  email: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  role: z.enum(['teacher', 'school_admin']),
  status: z.enum(['invited', 'expired', 'accepted']),
  expires_at: z.string(),
  created_at: z.string(),
});

export const inviteTeacherResponseSchema = z.object({
  documentId: z.string(),
  email: z.string(),
  status: z.literal('invited'),
  expires_at: z.string(),
  invite_url: z.string(),
});

export const reissueInvitationResponseSchema = z.object({
  documentId: z.string(),
  status: z.literal('invited'),
  expires_at: z.string(),
  invite_url: z.string(),
});

export const toggleTeacherResponseSchema = z.object({
  documentId: z.string(),
  blocked: z.boolean(),
});
