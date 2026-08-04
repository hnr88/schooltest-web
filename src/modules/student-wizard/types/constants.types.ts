import type { COUNTRY_CODES } from '@/modules/student-wizard/constants/countries.constants';

export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface CountryOption {
  code: CountryCode;
  name: string;
}
