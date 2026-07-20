import { z } from 'zod';

import { schoolSectorSchema, schoolStateSchema, schoolTypeSchema } from '@/modules/school-search';

export const searchPreferenceSortSchema = z.enum([
  'relevance',
  'name-asc',
  'name-desc',
  'fee-asc',
  'fee-desc',
]);

const feeSchema = z
  .number({ error: 'feeInvalid' })
  .int('feeInvalid')
  .min(0, 'feeInvalid')
  .max(1_000_000, 'feeInvalid')
  .nullable();

export const searchPreferenceFormSchema = z
  .strictObject({
    default_states: z.array(schoolStateSchema).max(8),
    default_school_types: z.array(schoolTypeSchema).max(3),
    default_sectors: z.array(schoolSectorSchema).max(3),
    default_sort: searchPreferenceSortSchema,
    default_page_size: z.number().int().min(1).max(50),
    default_fee_min: feeSchema,
    default_fee_max: feeSchema,
  })
  .refine(
    (value) =>
      value.default_fee_min === null ||
      value.default_fee_max === null ||
      value.default_fee_min <= value.default_fee_max,
    { message: 'feeRangeInvalid', path: ['default_fee_min'] },
  );

export const searchPreferenceSchema = searchPreferenceFormSchema.extend({
  documentId: z.string().min(1),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export const searchPreferenceResponseSchema = z.strictObject({
  data: searchPreferenceSchema,
});
