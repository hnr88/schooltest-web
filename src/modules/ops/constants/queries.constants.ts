export const OPS_FORMS_QUERY_KEY = ['ops', 'forms'] as const;

export const OPS_SITTING_MONITOR_QUERY_KEY = ['ops', 'sitting-monitor'] as const;

export const PLATFORM_SETTINGS_QUERY_KEY = ['ops', 'platform-settings'] as const;

export const SCHOOL_SITTINGS_QUERY_KEY = ['ops', 'school-sittings'] as const;

export const SITTING_LIMIT = 50;

/* --- ledger 11 / D-007: the C-OPS-04 inspection surfaces --- */
export function formInspectionQueryKey(formDocumentId: string) {
  return ['ops', 'form-inspection', formDocumentId] as const;
}

export const RESPONSES_CSV_QUERY_KEY = ['ops', 'responses-csv'] as const;

export function viewAsTeacherQueryKey(teacherDocumentId: string) {
  return ['ops', 'view-as-teacher', teacherDocumentId] as const;
}
