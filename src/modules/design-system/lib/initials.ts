const MAX_INITIALS = 2;

// Two-letter initials for the canonical tinted avatar (EH, LH, AS). Falls back to
// the first two characters for mononyms, and to an empty string for blank input.
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return (parts[0] ?? '').slice(0, MAX_INITIALS).toUpperCase();
  }
  const first = parts[0] ?? '';
  const last = parts[parts.length - 1] ?? '';
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
