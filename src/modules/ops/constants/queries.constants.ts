export const OPS_FORMS_QUERY_KEY = ['ops', 'forms'] as const;

export const OPS_SITTING_MONITOR_QUERY_KEY = ['ops', 'sitting-monitor'] as const;

export const PLATFORM_SETTINGS_QUERY_KEY = ['ops', 'platform-settings'] as const;

export const SCHOOL_SITTINGS_QUERY_KEY = ['ops', 'school-sittings'] as const;

export const SITTING_LIMIT = 50;

export const SECTION_TIMERS_QUERY_KEY = ['ops', 'section-timers'] as const;

export const SYSTEM_HEALTH_QUERY_KEY = ['ops', 'system-health'] as const;

export const SYSTEM_INFO_QUERY_KEY = ['ops', 'system-info'] as const;

export const SYSTEM_MIGRATIONS_QUERY_KEY = ['ops', 'system-migrations'] as const;

export const SYSTEM_BACKUPS_QUERY_KEY = ['ops', 'system-backups'] as const;

export const PIPELINE_HEALTH_QUERY_KEY = ['ops', 'pipeline-health'] as const;

export const CONTENT_COUNTS_QUERY_KEY = ['ops', 'content-counts'] as const;

export const CONTENT_ORPHANS_QUERY_KEY = ['ops', 'content-orphans'] as const;

export const MEDIA_STATS_QUERY_KEY = ['ops', 'media-stats'] as const;

/* --- ledger 7: the comms console --- */
export const COMMS_TEMPLATES_QUERY_KEY = ['ops', 'comms-templates'] as const;

export const COMMS_EMAIL_LOG_QUERY_KEY = ['ops', 'comms-email-log'] as const;

/* --- ledger 9: the flags console --- */
export const OPS_FLAGS_QUERY_KEY = ['ops', 'flags'] as const;

/* --- ledger 11 / D-007: the C-OPS-04 inspection surfaces --- */
export function formInspectionQueryKey(formDocumentId: string) {
  return ['ops', 'form-inspection', formDocumentId] as const;
}

export const RESPONSES_CSV_QUERY_KEY = ['ops', 'responses-csv'] as const;

export function viewAsTeacherQueryKey(teacherDocumentId: string) {
  return ['ops', 'view-as-teacher', teacherDocumentId] as const;
}
