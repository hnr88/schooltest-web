import { CONTACT_CHANNEL_VALUES, GENDER_VALUES } from '@/modules/student-wizard';

export function isGender(value: string | null): value is (typeof GENDER_VALUES)[number] {
  return value !== null && (GENDER_VALUES as readonly string[]).includes(value);
}

export function isChannel(value: string | null): value is (typeof CONTACT_CHANNEL_VALUES)[number] {
  return value !== null && (CONTACT_CHANNEL_VALUES as readonly string[]).includes(value);
}
