// The canonical medal inks are #D97706 / #94A3B8 / #B45309 — 3.19:1, 2.56:1 and
// 5.02:1 on white. The two failures are replaced with their AA-safe same-hue
// siblings (--color-warning-strong, --muted-foreground); rank is also a NUMBER, so
// the ordering never depends on the colour.
export const RANK_TONES = [
  'text-warning-strong',
  'text-muted-foreground',
  'text-warning-ink',
] as const;
