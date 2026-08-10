import type { z } from 'zod';

import type {
  teacherClassesResponseSchema,
  teacherClassSchema,
} from '@/modules/teacher/schemas/teacher-class.schema';

export type TeacherClass = z.infer<typeof teacherClassSchema>;
export type TeacherClassesResponse = z.infer<typeof teacherClassesResponseSchema>;
