import type { AssessedBand, AttributeName } from '@/modules/report/schemas/result-view.schema';
import type { AttributeRowView } from '@/modules/report/types/attribute.types';

export interface ObservationFormatters {
  list: (names: AttributeName[]) => string;
  status: (status: AssessedBand) => string;
}

export type ObservationValues = Record<string, string | number>;

export type AssessedRow = Extract<AttributeRowView, { state: 'assessed' }>;
