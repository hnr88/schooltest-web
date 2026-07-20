import type { StudentWizardValues } from '@/modules/student-wizard';
import type { StudentDetail } from '@/modules/children/types/children.types';

// C-UI-MYCHILDREN edit prefill: map the parent detail read to the wizard's RHF
// initial values. `passport_number` is API-private (never returned) → always
// empty. Media come back as objects; the form holds only the numeric id (relinked
// unchanged on save, per C-STUDENT-UPDATE).
export function detailToInitialValues(detail: StudentDetail): Partial<StudentWizardValues> {
  return {
    given_name: detail.given_name,
    family_name: detail.family_name,
    email: detail.email ?? '',
    date_of_birth: detail.date_of_birth ?? '',
    gender: (detail.gender ?? undefined) as StudentWizardValues['gender'],
    nationality: detail.nationality ?? '',
    passport_number: '',
    current_school: detail.current_school ?? '',
    current_year_level: (detail.current_year_level ??
      undefined) as StudentWizardValues['current_year_level'],
    year_level: detail.year_level,
    target_entry_year: detail.target_entry_year ?? '',
    target_entry_term: (detail.target_entry_term ??
      undefined) as StudentWizardValues['target_entry_term'],
    parent_guardian_name: detail.parent_guardian_name ?? '',
    parent_guardian_phone: detail.parent_guardian_phone ?? '',
    parent_guardian_email: detail.parent_guardian_email ?? '',
    parent_guardian_wechat: detail.parent_guardian_wechat ?? '',
    preferred_contact_channel: (detail.preferred_contact_channel ??
      'whatsapp') as StudentWizardValues['preferred_contact_channel'],
    photo: detail.photo?.id ?? null,
    voice_intro: detail.voice_intro?.id ?? null,
  };
}
