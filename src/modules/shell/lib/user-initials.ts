import type { AuthUser } from '@/modules/auth';

export function getUserInitials(username: string, max = 2): string {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, max)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

// The person's real name from GET /api/users/me (`first_name` + `last_name`, which the
// API stores for staff), falling back to the account's username only when both are
// empty.
export function getUserDisplayName(
  user: Pick<AuthUser, 'username' | 'first_name' | 'last_name'>,
): string {
  const fullName = [user.first_name, user.last_name]
    .map((part) => part?.trim() ?? '')
    .filter(Boolean)
    .join(' ');
  return fullName || user.username;
}
