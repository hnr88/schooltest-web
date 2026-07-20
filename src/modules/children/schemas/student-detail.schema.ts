import { z } from 'zod';

// Media object returned by the detail read's explicit populate (photo/voice_intro).
// Only the fields the edit wizard preview needs are kept; extras are stripped.
const studentMediaSchema = z.object({
  id: z.number(),
  url: z.string(),
  mime: z.string().nullish(),
  name: z.string().nullish(),
});

// C-STUDENT-LIST-EXT detail read: GET /api/my/students/:documentId. Every
// C-STUDENT-CREATE scalar + status/createdAt/updatedAt + photo/voice_intro media
// object|null. `passport_number` is API-private (private:true) → NEVER returned,
// so it is deliberately absent from this schema (the edit wizard renders it empty).
export const studentDetailSchema = z.object({
  documentId: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  year_level: z.number().nullable(),
  email: z.string().nullable(),
  date_of_birth: z.string().nullable(),
  gender: z.string().nullable(),
  nationality: z.string().nullable(),
  current_school: z.string().nullable(),
  current_year_level: z.string().nullable(),
  target_entry_year: z.string().nullable(),
  target_entry_term: z.string().nullable(),
  parent_guardian_name: z.string().nullable(),
  parent_guardian_email: z.string().nullable(),
  parent_guardian_phone: z.string().nullable(),
  parent_guardian_wechat: z.string().nullable(),
  preferred_contact_channel: z.string().nullable(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  photo: studentMediaSchema.nullable(),
  voice_intro: studentMediaSchema.nullable(),
});

export const studentDetailResponseSchema = z.object({
  data: studentDetailSchema,
  meta: z.record(z.string(), z.unknown()),
});
