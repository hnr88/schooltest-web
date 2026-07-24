import { z } from 'zod';

import { schoolSectorSchema, schoolStateSchema, schoolTypeSchema } from '@/modules/school-search';

export const searchPreferenceSortSchema = z.enum([
  'relevance',
  'name-asc',
  'name-desc',
  'fee-asc',
  'fee-desc',
]);

const feeSchema = z.number().int().min(0).max(1_000_000).nullable();

// The panel edits THREE defaults — states, sort, results per page. The backend
// (C-SEARCHPREF-UPDATE) accepts a partial strict body, so the PUT sends exactly
// these keys and the untouched ones keep their server-side values.
export const searchPreferenceFormSchema = z.strictObject({
  default_states: z.array(schoolStateSchema).max(8),
  default_sort: searchPreferenceSortSchema,
  default_page_size: z.number().int().min(1).max(50),
});

// The GET view carries the full row (school types, sectors and fee bounds stay
// server-side defaults; the panel no longer edits them).
export const searchPreferenceSchema = z.strictObject({
  documentId: z.string().min(1),
  default_states: z.array(schoolStateSchema).max(8),
  default_school_types: z.array(schoolTypeSchema).max(3),
  default_sectors: z.array(schoolSectorSchema).max(3),
  default_sort: searchPreferenceSortSchema,
  default_page_size: z.number().int().min(1).max(50),
  default_fee_min: feeSchema,
  default_fee_max: feeSchema,
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const searchPreferenceResponseSchema = z.strictObject({
  data: searchPreferenceSchema,
});
