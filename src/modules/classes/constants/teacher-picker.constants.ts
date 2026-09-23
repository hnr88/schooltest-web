// BUG-006: one picker lists active teachers AND invited (pending) teachers. An
// invitation's option value carries this prefix so a pick is never mistaken
// for a user documentId.
export const INVITED_TEACHER_VALUE_PREFIX = 'invite:';
