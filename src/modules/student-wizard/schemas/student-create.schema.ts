import { z } from 'zod';

// C-STUDENT-CREATE 200 envelope: { data: { documentId, status: 'active',
// parent: { documentId: <caller> }, … }, meta }. Only the fields the wizard
// acts on are parsed (documentId for identity, status for the smuggle proof,
// parent.documentId for ownership); extra scalars the api returns are stripped.
export const createStudentResponseSchema = z.object({
  data: z.object({
    documentId: z.string().min(1),
    status: z.string().min(1),
    parent: z.object({ documentId: z.string().min(1) }),
  }),
  meta: z.record(z.string(), z.unknown()),
});

export type CreateStudentResponse = z.infer<typeof createStudentResponseSchema>;
