import type { createParentProfileSchema } from '@/modules/onboarding/schemas/parent-profile.schema';

export type ProfileSchemaTranslator = (key: string) => string;

export type ParentProfileSchema = ReturnType<typeof createParentProfileSchema>;
