import { z } from 'zod';

// Boundary schemas for C-IMP-01/02 (task 67, st-mvp-pivot): the ops bulk
// student import preview + commit payloads. Defensive parsing at the mutation
// boundary; the UI consumes the inferred types below.
export const importCreateRowSchema = z.object({
  row: z.number(),
  given_name: z.string(),
  family_name: z.string().nullable(),
  email: z.string(),
  first_language: z.string(),
  class_name: z.string(),
  acara_phase: z.string().nullable(),
});

export const importSkipRowSchema = z.object({
  row: z.number(),
  email: z.string(),
});

export const importRejectRowSchema = z.object({
  row: z.number(),
  reason: z.string(),
});

export const importPreviewSchema = z.object({
  create: z.array(importCreateRowSchema),
  skip_existing: z.array(importSkipRowSchema),
  reject: z.array(importRejectRowSchema),
});

export const importCommitResultSchema = z.object({
  created: z.number(),
  skipped: z.number(),
  rejected: z.array(importRejectRowSchema),
});

export type ImportCreateRow = z.infer<typeof importCreateRowSchema>;
export type ImportSkipRow = z.infer<typeof importSkipRowSchema>;
export type ImportRejectRow = z.infer<typeof importRejectRowSchema>;
export type ImportPreview = z.infer<typeof importPreviewSchema>;
export type ImportCommitResult = z.infer<typeof importCommitResultSchema>;
