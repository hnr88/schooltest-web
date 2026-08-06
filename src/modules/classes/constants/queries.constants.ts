export const CLASS_CHILDREN_QUERY_KEY = ['classes', 'school', 'students'] as const;

export const CLASS_DETAIL_QUERY_KEY = ['classes', 'school', 'detail'] as const;

export const CLASS_STUDENT_QUERY_KEY = ['classes', 'school', 'student'] as const;

export const CLASSES_QUERY_KEY = ['classes', 'school'] as const;

// C-CHD-01 caps pageSize at 100, so the edit-dialog student picker pages
// through the whole roster. The page ceiling is a runaway guard only — at 100
// per page it covers 5000 students, far past any real school.
export const CLASS_STUDENT_PAGE_SIZE = 100;
export const CLASS_STUDENT_PAGE_LIMIT = 50;
