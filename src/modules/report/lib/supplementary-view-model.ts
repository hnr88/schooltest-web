import { getCrosswalkFieldState, splitDisplayLabel } from '@/modules/report/lib/display-label';
import type { ResultView } from '@/modules/report/types/report.types';
import type {
  SupplementaryBandCode,
  SupplementaryBandView,
  SupplementaryStrandView,
} from '@/modules/report/types/supplementary.types';

// E11-05 — the supplementary strand view model. Pure, no I/O, no threshold:
// nothing here decides whether a band is "low". Doc 0 forbids a cut score, and
// a cut on an out-of-model indicator would be exactly that.
function toBand(code: SupplementaryBandCode, accuracy: number | null): SupplementaryBandView {
  // `0` is a MEASURED band — only `null` is the absence (CT-7).
  return accuracy === null
    ? { code, state: 'not_administered' }
    : { code, state: 'measured', accuracy };
}

export function buildSupplementaryStrand(result: ResultView): SupplementaryStrandView {
  const supplementary = result.supplementary;
  // The same applicability rule every other absence on this report uses, called
  // with the strand reduced to null | 'present' (as buildAttributePanel does),
  // so the strand can never contradict the header about which absence this is.
  const state = getCrosswalkFieldState(result, supplementary === null ? null : 'present');

  if (supplementary === null || state !== 'derived') {
    return state === 'not_applicable' ? { state: 'not_applicable' } : { state: 'pending' };
  }

  return {
    state: 'bands',
    bands: [
      toBand('a2', supplementary.vocab_band_a2_accuracy),
      toBand('b1', supplementary.vocab_band_b1_accuracy),
    ],
    // Server-composed qualifiers, pulled apart losslessly for cross-reference
    // only. Nothing here derives, re-words or suppresses a qualifier.
    qualifiers:
      result.display_label === null ? [] : splitDisplayLabel(result.display_label).qualifiers,
  };
}
