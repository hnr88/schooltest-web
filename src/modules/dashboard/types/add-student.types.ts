export type {
  AddStudentFormValues,
  AddStudentInput,
  CreateStudentResponse,
} from '@/modules/dashboard/schemas/add-student.schema';

// CONTRACTS.md's generic typed-error envelope: { error: { status, name, message, details? } }.
export interface StrapiErrorPayload {
  error?: {
    status?: number;
    name?: string;
    message?: string;
    details?: { fields?: string[]; issues?: string[] };
  };
}

export type AddStudentErrorState =
  { kind: 'offline' } | { kind: 'server' } | { kind: 'validation'; message?: string };
