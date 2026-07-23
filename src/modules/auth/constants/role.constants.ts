// users-permissions role slugs as the API's own gates read them
// (schooltest-api/src/bootstrap/roles.ts). The teacher report surfaces (C-4 /
// C-11) answer 403 to every other role, so the portal gates on the same slug.
export const TEACHER_ROLE_TYPE = 'teacher';
