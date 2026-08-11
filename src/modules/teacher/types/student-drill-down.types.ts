import type { MasteryBand, TeacherMasteryBands } from '@/modules/teacher/types/teacher.types';
import type {
  StudentDrillDownResponse,
  StudentSubskill,
  StudentTestResult,
} from '@/modules/teacher/types/teacher-result.types';

export interface StudentDrillDownScreenProps {
  classDocumentId: string;
  studentDocumentId: string;
}

export interface StudentDrillDownHeaderProps {
  student: StudentDrillDownResponse['student'];
}

export interface StudentTestCardProps {
  test: StudentTestResult;
  bands: TeacherMasteryBands;
}

export interface MasteryLegendProps {
  bands: TeacherMasteryBands;
}

export interface SubskillTileGridProps {
  variant: StudentTestResult['variant'];
  subskills: readonly StudentSubskill[];
}

export interface SubskillTileProps {
  subskill: StudentSubskill;
}

/**
 * How one subskill tile may be drawn.
 *
 * `measured: false` is the honest no-measurement state: C-TR-2 sends
 * `likelihood: null` with `status: 'not_assessed'` for an attribute this result
 * never assessed, and that tile prints NO percentage — a `0%` would assert a
 * measured floor that does not exist.
 *
 * `measured: true` carries the server's own `likelihood` (already an integer
 * `0..100`) and the server's own `status` band. The band is transported, never
 * derived: no field here is compared to a cut.
 */
export type SubskillTileView =
  | { measured: false; status: MasteryBand }
  | { measured: true; likelihood: number; status: MasteryBand };
