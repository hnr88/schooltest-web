export function helperId(id: string) {
  return `${id}-helper`;
}

export function errorId(id: string) {
  return `${id}-error`;
}

export function describedBy(id: string, helperText?: string, errorText?: string) {
  const ids = [helperText ? helperId(id) : null, errorText ? errorId(id) : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}
