/**
 * Result reads for the portal — types only. Every shape is imported from the
 * shared contract package (house rule 2): this file re-exports so screens never
 * import the package directly and the module barrel stays the single surface.
 * The hand-mirrored `report/schemas/result-view.schema.ts` stays on the LEGACY
 * v1 path until the task 30-36 PR train deletes it; nothing in THIS module
 * imports it.
 */
export type {
  DiagnosticExport,
  ResultHistoryPoint,
  ResultView,
  ResultViewAttribute,
  ResultViewAttributeScored,
  ResultViewGate,
  ResultViewOverall,
  ResultViewVocab,
} from '@schooltest/scoring-contracts';
