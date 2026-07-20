// ISO 3166-1 alpha-2 codes — the single country source shared by the
// NationalityCombobox (049) and the onboarding country combobox (055). Display
// names are resolved at runtime via `Intl.DisplayNames` in the active locale, so
// no country-name data library is bundled (C-UI-STUDENT-WIZARD — "no data lib").
export const COUNTRY_CODES = [
  'AD', 'AE', 'AF', 'AG', 'AL', 'AM', 'AO', 'AR', 'AT', 'AU', 'AZ', 'BA', 'BB',
  'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BN', 'BO', 'BR', 'BS', 'BT', 'BW',
  'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CL', 'CM', 'CN', 'CO', 'CR',
  'CU', 'CV', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG',
  'ER', 'ES', 'ET', 'FI', 'FJ', 'FM', 'FR', 'GA', 'GB', 'GD', 'GE', 'GH', 'GM',
  'GN', 'GQ', 'GR', 'GT', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE',
  'IL', 'IN', 'IQ', 'IR', 'IS', 'IT', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI',
  'KM', 'KN', 'KP', 'KR', 'KW', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS',
  'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MG', 'MH', 'MK', 'ML', 'MM',
  'MN', 'MO', 'MR', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NE', 'NG',
  'NI', 'NL', 'NO', 'NP', 'NR', 'NZ', 'OM', 'PA', 'PE', 'PG', 'PH', 'PK', 'PL',
  'PS', 'PT', 'PW', 'PY', 'QA', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SD',
  'SE', 'SG', 'SI', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SY',
  'SZ', 'TD', 'TG', 'TH', 'TJ', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW',
  'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VN', 'VU', 'WS', 'XK',
  'YE', 'ZA', 'ZM', 'ZW',
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export interface CountryOption {
  code: CountryCode;
  name: string;
}

// Localized, alphabetically-sorted country options for a locale. A code whose
// name fails to resolve falls back to the raw code so the list never drops rows.
export function getCountryOptions(locale: string): CountryOption[] {
  const display = new Intl.DisplayNames([locale], { type: 'region' });
  return COUNTRY_CODES.map((code) => ({ code, name: display.of(code) ?? code })).sort((a, b) =>
    a.name.localeCompare(b.name, locale),
  );
}

// Display-name strings only — the NationalityCombobox stores the name string
// (schema `string().min(1).max(100)`, legacy parity), not the ISO code.
export function getCountryNames(locale: string): string[] {
  return getCountryOptions(locale).map((option) => option.name);
}
