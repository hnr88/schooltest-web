import { isAxiosError } from 'axios';
import type { FormErrorKey } from '@/modules/auth/types/components.types';

export function classifyError(error: unknown): FormErrorKey {
  if (isAxiosError(error)) {
    if (error.response?.status === 400) return 'takenError';
    if (error.response === undefined) return 'offlineError';
  }
  return 'registerError';
}
