export function getUserInitials(username: string, max = 2): string {
  const parts = username.trim().split(/\s+/).filter(Boolean);
  return parts
    .slice(0, max)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
