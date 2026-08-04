import type { FormWindow } from '@/modules/ops/schemas/form-window.schema';

export function windowKey(window: FormWindow | null): string {
  if (!window) return 'none';
  return `${window.documentId}:${window.form?.documentId ?? ''}:${window.opens_at}:${window.closes_at}`;
}
