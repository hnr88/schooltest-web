import { z } from 'zod';

export const agentServiceSchema = z.enum([
  'counselling',
  'application',
  'visa',
  'scholarship',
  'english_prep',
  'accommodation',
  'under18_welfare',
  'post_arrival',
]);

export const agentSortSchema = z.enum([
  'relevance',
  'experience',
  'name_asc',
  'name_desc',
  'recently_verified',
]);

export const qeacValidationStatusSchema = z.enum(['none', 'pending', 'verified']);

export const agentHitSchema = z.object({
  documentId: z.string(),
  slug: z.string().nullable(),
  name: z.string(),
  photoUrl: z.string().nullable(),
  headline: z.string().nullable(),
  roleTitle: z.string().nullable(),
  countriesServed: z.array(z.string()),
  languages: z.array(z.string()),
  specialties: z.array(z.string()),
  yearsExperience: z.number().nullable(),
  verified: z.boolean(),
  qeacValidationStatus: qeacValidationStatusSchema,
  partnerSchoolsCount: z.number(),
  completeness: z.number(),
});

export const agentSearchPaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

// BARE `data` array (D-SEARCH-2) — the legacy `{ data: { hits: [...] } }` shape
// fails this schema because `data` must be an array, not an object.
export const agentSearchResponseSchema = z.object({
  data: z.array(agentHitSchema),
  meta: z.object({
    pagination: agentSearchPaginationSchema,
  }),
});

export type AgentHit = z.infer<typeof agentHitSchema>;
export type AgentSearchResult = z.infer<typeof agentSearchResponseSchema>;
export type AgentSearchPagination = z.infer<typeof agentSearchPaginationSchema>;
