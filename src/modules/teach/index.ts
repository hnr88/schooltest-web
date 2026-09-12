// The pre-v2 teacher screens this module served (the class roster, the cycle
// banner, the C-RPT-03 `export.md` button) are RETIRED — Teacher Portal v2's
// Students tab, class header and de-identified Reports modal replaced them
// (R1 PART B). What is left is the DIAGNOSTIC surface the SCHOOL-ADMIN
// analytics screen still mounts, plus the reading-area helpers the v2 tabs read.
export { DiagnosticDashboard } from './components/DiagnosticDashboard';
export { ProgressPanel } from './components/ProgressPanel';
export { useClassDiagnosticQuery, classDiagnosticQueryOptions } from './queries/use-class-diagnostic.query';
export type { ClassDiagnostic, DiagnosticMasteryRow, DiagnosticStatus } from './types/diagnostic.types';
export type { ClassProgress, ProgressStudent, ProgressTransition } from './types/progress.types';
// School analytics aggregate — a live diagnostic cell's code placed on its reading area.
export { diagnosticAreaCode } from './lib/diagnostic-areas';
export { MASTERY_AREA_CODES } from './lib/mastery-directory.lib';
