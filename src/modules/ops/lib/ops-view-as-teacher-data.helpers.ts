import type { ViewAsTeacher } from '@/modules/ops/schemas/surfaces.schema';

export function teacherName(view: ViewAsTeacher): string {
  const name = [view.teacher.first_name, view.teacher.last_name]
    .filter((part): part is string => Boolean(part))
    .join(' ');
  return name !== '' ? name : (view.teacher.email ?? view.teacher.documentId);
}
