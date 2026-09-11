'use client';

import { useState } from 'react';

import { useAuthStore } from '@/modules/auth';
import { useSchoolClassesQuery } from '@/modules/classes';
import { ArchiveStudentDialog } from '@/modules/school-students/components/ArchiveStudentDialog';
import { SchoolStudentEditDialog } from '@/modules/school-students/components/SchoolStudentEditDialog';
import { StudentImportDialog } from '@/modules/school-students/components/StudentImportDialog';
import { StudentsHeader } from '@/modules/school-students/components/StudentsHeader';
import { StudentsTable } from '@/modules/school-students/components/StudentsTable';
import { ROSTER_COUNT_QUERY } from '@/modules/school-students/constants/queries.constants';
import {
  rosterQueryFrom,
  useStudentsFilters,
} from '@/modules/school-students/hooks/use-students-filters';
import { useStudentArchive } from '@/modules/school-students/hooks/use-student-row-actions';
import { useSchoolStudentsQuery } from '@/modules/school-students/queries/use-school-students.query';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

// School admin Students screen (spec §4): the C-CHD-01 roster reshaped to
// Name | Class | First language | Level | Diagnostic, rendered THROUGH the
// shared directory kit in server mode (task 31) — the kit's toolbar, states
// and pager own everything generic, and `status`/`class`/`level`/`q`/`page`
// reach the endpoint unchanged with 'all' omitted. The subtitle total comes
// from its own unfiltered active-only read — it is a school total, not a count
// of what the current filters returned (the kit's "Showing" count IS the
// filter scope). Import (C-CHD-02 per row) sits beside the single-student
// form. Clicking a row navigates to the student detail view; the edit dialog
// this screen owns is reached from the row's actions menu, and the archive
// confirm is one screen-level dialog named by the menu action.
export function SchoolStudentsScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);
  const [editTarget, setEditTarget] = useState<SchoolStudent | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const archive = useStudentArchive();

  const classesQuery = useSchoolClassesQuery(enabled);
  const classes = classesQuery.data ?? [];
  const filters = useStudentsFilters(classes);
  const studentsQuery = useSchoolStudentsQuery(rosterQueryFrom(filters.state.params), enabled);
  const rosterCountQuery = useSchoolStudentsQuery(ROSTER_COUNT_QUERY, enabled);

  const rows = studentsQuery.data?.rows ?? [];

  return (
    <main
      data-slot="school-students"
      data-surface="school-admin-students"
      className="flex flex-1 flex-col gap-4.5 px-4 py-6 sm:px-6 lg:px-8"
    >
      <StudentsHeader
        studentCount={rosterCountQuery.data?.pagination.total ?? 0}
        classCount={classes.length}
        onImport={() => setImportOpen(true)}
      />
      <StudentsTable
        state={filters.state}
        filters={filters.defs}
        query={{ ...studentsQuery, enabled }}
        rows={rows}
        meta={studentsQuery.data?.pagination}
        onEdit={setEditTarget}
        onArchive={archive.requestArchive}
      />
      {editTarget ? (
        <SchoolStudentEditDialog
          student={editTarget}
          classes={classes}
          onClose={() => setEditTarget(null)}
        />
      ) : null}
      {importOpen ? (
        <StudentImportDialog classes={classes} onClose={() => setImportOpen(false)} />
      ) : null}
      {archive.archiveTarget ? (
        <ArchiveStudentDialog
          student={archive.archiveTarget}
          open
          onOpenChange={(open) => {
            if (!open) archive.closeArchive();
          }}
          pending={archive.archivePending}
          onConfirm={() => void archive.confirmArchive()}
        />
      ) : null}
    </main>
  );
}
