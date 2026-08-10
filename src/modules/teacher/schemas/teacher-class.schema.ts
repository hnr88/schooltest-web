import { z } from 'zod';

import { teacherDocumentIdSchema } from '@/modules/teacher/schemas/teacher.schema';

// THE CLASS PICKER'S SOURCE — the incumbent scoped list route
// `GET /api/classes` (C-8, `api::class.class.find`). Its controller forces the
// owning-teacher filter server-side AFTER sanitization (`scopeFindToTeacher`,
// `$and`-merged so a caller filter can never widen it), so a teacher can only
// ever receive their OWN classes. .qa/CONTRACTS.md does not own this endpoint —
// C-TD-1 (`GET /api/teacher/dashboard`, task 016) is still TODO on the API
// track — which is why this mirror sits beside, not inside, the contract
// mirrors, and why it does not pretend to be one.
//
// Two deliberate differences from every schema in `teacher*.schema.ts`:
//  1. It parses the Strapi CORE `data`/`meta` envelope, not the bare object the
//     custom `/api/teacher/**` routes answer.
//  2. It is NOT `strictObject`. The core serializer also emits `id`,
//     `createdAt`, `updatedAt`, `publishedAt` and whatever column
//     `class/schema.json` gains next; a teacher must not lose their class
//     picker because an unrelated field was added upstream. The three fields
//     the picker actually reads are still validated exactly.
export const teacherClassSchema = z.object({
  documentId: teacherDocumentIdSchema,
  name: z.string().min(1),
  year_band: z.string().min(1).nullable(),
});

export const teacherClassesResponseSchema = z.object({
  data: z.array(teacherClassSchema),
});
