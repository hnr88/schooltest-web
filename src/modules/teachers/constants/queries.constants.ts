export const INVITATIONS_QUERY_KEY = ['school', 'invitations'] as const;

export const TEACHERS_QUERY_KEY = ['school', 'teachers'] as const;

export const teacherNeedsAttentionQueryKey = (documentId: string) =>
  ['school', 'teachers', documentId, 'needs-attention'] as const;
