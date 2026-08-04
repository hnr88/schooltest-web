import type { AssessedAttributeStatus, AttributeRowView } from '@/modules/report/types/attribute.types';

export interface ObservationFormatters {
  list: (codes: string[]) => string;
  percent: (value: number) => string;
  status: (status: AssessedAttributeStatus) => string;
}

export type ObservationValues = Record<string, string | number>;

export type AssessedRow = Extract<AttributeRowView, { state: 'assessed' }>;

export type PlacedRow = { row: AssessedRow; index: number };
