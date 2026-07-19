import { z } from 'zod';

export const schoolStateSchema = z.enum([
  'VIC',
  'NSW',
  'QLD',
  'SA',
  'WA',
  'TAS',
  'ACT',
  'NT',
]);

export const schoolTypeSchema = z.enum(['combined', 'primary', 'secondary']);

export const schoolSectorSchema = z.enum([
  'government',
  'non-government',
  'catholic',
]);

export const schoolHitSchema = z.object({
  documentId: z.string(),
  slug: z.string(),
  name: z.string(),
  cricosCode: z.string().nullable(),
  suburb: z.string().nullable(),
  state: schoolStateSchema.nullable(),
  postcode: z.string().nullable(),
  schoolType: schoolTypeSchema.nullable(),
  sector: schoolSectorSchema.nullable(),
  levelsOffered: z.string().nullable(),
  hasPrimary: z.boolean(),
  hasJuniorSecondary: z.boolean(),
  hasSeniorSecondary: z.boolean(),
  yearLevelBands: z.array(z.string()),
  atarAvailable: z.boolean(),
  elicosEslSupport: z.boolean(),
  scholarshipAvailable: z.boolean(),
  primaryAnnualTuition: z.number().nullable(),
  juniorSecAnnualTuition: z.number().nullable(),
  seniorSecAnnualTuition: z.number().nullable(),
  annualTuitionFrom: z.number().nullable(),
  cricosStatus: z.string().nullable(),
  latitude: z.number().nullable(),
  longitude: z.number().nullable(),
});

export const schoolSearchPaginationSchema = z.object({
  page: z.number(),
  pageSize: z.number(),
  pageCount: z.number(),
  total: z.number(),
});

export const schoolSearchResponseSchema = z.object({
  data: z.array(schoolHitSchema),
  meta: z.object({
    pagination: schoolSearchPaginationSchema,
  }),
});

export type SchoolHit = z.infer<typeof schoolHitSchema>;
export type SchoolSearchResult = z.infer<typeof schoolSearchResponseSchema>;
export type SchoolSearchPagination = z.infer<typeof schoolSearchPaginationSchema>;
