'use client';

import { useTranslations } from 'next-intl';

import { ClassStudentPicker } from '@/modules/classes/components/ClassStudentPicker';
import { ClassTeacherPicker } from '@/modules/classes/components/ClassTeacherPicker';
import { useClassAssignment } from '@/modules/classes/hooks/use-class-assignment';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import { Button } from '@/modules/design-system';
import type { SchoolChild } from '@/modules/school-children';
import type { SchoolTeacher } from '@/modules/teachers';

interface ClassAssignmentPanelProps {
  schoolClass: SchoolClass;
  members: SchoolChild[];
  teachers: SchoolTeacher[];
  activeChildren: SchoolChild[];
}

// The assignment working area (task 31): teacher and student pickers over a
// local working set, saved as full-replacement lists through C-CLS-03. The
// save button arms only when the working set differs from the server.
export function ClassAssignmentPanel({
  schoolClass,
  members,
  teachers,
  activeChildren,
}: ClassAssignmentPanelProps) {
  const t = useTranslations('Classes.detail');
  const assignment = useClassAssignment(schoolClass, members);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <ClassTeacherPicker
          teachers={teachers}
          value={assignment.teacherValue}
          onChange={assignment.setTeachers}
        />
        <ClassStudentPicker
          students={activeChildren}
          value={assignment.studentValue}
          onChange={assignment.setStudents}
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={!assignment.dirty}
          loading={assignment.saving}
          onClick={() => void assignment.save()}
        >
          {assignment.saving ? t('saving') : t('save')}
        </Button>
      </div>
    </div>
  );
}
