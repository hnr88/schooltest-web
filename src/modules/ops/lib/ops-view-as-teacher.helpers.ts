import { isAxiosError } from 'axios';

export function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}
