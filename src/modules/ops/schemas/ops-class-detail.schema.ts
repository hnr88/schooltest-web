import { z } from 'zod';
import {
  classSchoolRefSchema,
  classTeacherRefSchema,
  classTestWindowSchema,
} from '@schooltest/ops-contracts';

// Boundary schema for the ops class-detail read (C-OPS-CLASS-DETAIL).
//
// ROW 20 REWROTE THIS. It used to parse a relation-expanded CORE ENTITY from
// `/api/classes/:id`, which is the drift D-11 names: the core
// route is not the ops surface, so the shape had to be loose enough to let
// Strapi's managed keys (id / createdAt / publishedAt / …) through, and it
// carried a nested `students` array that the ops surface deliberately does not
// serve. Both are gone.
//
// The refs are IMPORTED FROM THE SHARED CONTRACT, not re-declared:
// `classSchoolRefSchema`, `classTeacherRefSchema` and `classTestWindowSchema`
// are the same shapes the Classes list parses, so the class detail and the
// class row cannot describe the same school, teacher or window two ways.
//
// `students` is ABSENT ON PURPOSE — the roster is its own paginated read
// (`use-class-roster.query.ts`, C-OPS-PORTAL-037), and `student_count` here is
// the TRUE total rather than the length of a populate-limited array.
export const opsClassDetailSchema = z.object({
  documentId: z.string().min(1),
  name: z.string().nullable(),
  year_band: z.string().nullable(),
  school: classSchoolRefSchema,
  primary_teacher: classTeacherRefSchema.nullable(),
  co_teachers: z.array(classTeacherRefSchema),
  student_count: z.number().int().min(0),
  eligible_students: z.number().int().min(0),
  completed_students: z.number().int().min(0),
  // Null when nothing has been measured; a real 0 stays 0 and is never
  // conflated with "no score".
  avg_reading_score: z.number().nullable(),
  // Always null by design: no validated CEFR band mapping exists, and CEFR
  // labels are never averaged as strings.
  average_cefr: z.string().nullable(),
  // The class's OWN assigned window, or null when none is assigned — a class
  // with no window is ordinary and renders as "No window yet".
  test_window: classTestWindowSchema.nullable(),
  // The edit form's If-Match token: whatever the form opened with.
  updated_at: z.string().nullable(),
});

export type OpsClassDetail = z.infer<typeof opsClassDetailSchema>;
