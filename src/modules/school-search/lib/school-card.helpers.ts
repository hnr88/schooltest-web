// School-card presentation helpers (kept out of the components per module-pattern).

export function getSchoolInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase();
}

export function getSchoolLocation(suburb: string | null, state: string | null): string {
  return [suburb, state].filter(Boolean).join(', ');
}
