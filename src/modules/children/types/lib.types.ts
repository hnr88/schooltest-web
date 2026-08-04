import type { ChildProgressResult } from '@/modules/children/types/children.types';

export interface CardLabels {
  formatYear: (year: number) => string;
  yearLevel: string;
  targetEntry: string;
}

export interface HeroLabels {
  formatYear: (year: number) => string;
  school: string | null;
  born: string | null;
}

export interface DetailLabels {
  formatYear: (year: number) => string;
  yearLevel: string;
  dateOfBirth: string;
  gender: string;
  genderValue: string | null;
  nationality: string;
  currentSchool: string;
  targetEntry: string;
  signInEmail: string;
  addedOn: string;
  born: string | null;
  added: string;
  targetEntryValue: string | null;
}

export interface GuardianLabels {
  email: string;
  phone: string;
  wechat: string;
  preferredContact: string;
  channelValue: string | null;
}

export type Readiness = NonNullable<ChildProgressResult['readiness']>;

export type Skill = NonNullable<ChildProgressResult['skill']>;

export type Band = NonNullable<ChildProgressResult['cefrBand']>;
