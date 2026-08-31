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
  status: z.enum(['invited', 'expired', 'accepted', 'revoked']),
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

// C-INV-07: revoking keeps the row (status flips to `revoked`), so the response
// is the revoked row rather than the old `{ deleted: true }`.
export const revokeInvitationResponseSchema = z.object({
  documentId: z.string(),
  status: z.literal('revoked'),
  revoked_at: z.string().nullable(),
});

// C-TCH-03: permanent removal of a staff account from the school.
export const removeTeacherResponseSchema = z.object({
  documentId: z.string(),
  removed: z.literal(true),
  classes_unassigned: z.number(),
  invitations_revoked: z.number(),
});

// GAP-01 (tasks 018/019): GET /api/schools/me/teachers/:documentId
// /needs-attention. Rows are the C-TR-4 mover shape the existing
// teacher-progress computation emits, plus the class each pair was measured
// in. Deltas are the server's own; nothing is derived client-side.
export const needsAttentionStudentSchema = z.object({
  student_document_id: z.string(),
  display_name: z.string(),
  class: z.object({ documentId: z.string(), name: z.string().nullable() }),
  score_a: z.number().int().min(0).max(100),
  score_b: z.number().int().min(0).max(100),
  delta: z.number().int().min(-100).max(100),
});


export type NeedsAttentionStudent = z.infer<typeof needsAttentionStudentSchema>;
export type TeacherNeedsAttention = z.infer<typeof teacherNeedsAttentionSchema>;

export const teacherNeedsAttentionSchema = z.object({
  teacher: z.object({
    documentId: z.string(),
    email: z.string().nullable(),
    first_name: z.string().nullable(),
    last_name: z.string().nullable(),
  }),
  classes_considered: z.number().int(),
  students: z.array(needsAttentionStudentSchema),
});
