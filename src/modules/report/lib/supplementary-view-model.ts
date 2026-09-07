import { getCrosswalkFieldState } from '@/modules/report/lib/display-label';
import type { ResultView } from '@/modules/report/types/report.types';
import type {
  SupplementaryBandCode,
  SupplementaryBandView,
  SupplementaryStrandView,
} from '@/modules/report/types/supplementary.types';

// E11-05 — the supplementary strand view model. Pure, no I/O, no threshold:
// nothing here decides whether a band is "low". Doc 0 forbids a cut score, and
// a cut on an out-of-model indicator would be exactly that.
function toBand(code: SupplementaryBandCode, domainScore: number | null): SupplementaryBandView {
  // `0` is a MEASURED band — only `null` is the absence (CT-7).
  return domainScore === null
    ? { code, state: 'not_administered' }
    : { code, state: 'measured', domainScore };
}

export function buildSupplementaryStrand(result: ResultView): SupplementaryStrandView {
  const vocab = result.vocab;
  // The same applicability rule every other absence on this report uses, called
  // with the strand reduced to null | 'present' (as buildAttributePanel does),
  // so the strand can never contradict the header about which absence this is.
  const state = getCrosswalkFieldState(result, vocab.status === 'not_assessed' ? null : 'present');

  if (vocab.status === 'not_assessed' || state !== 'derived') {
    return state === 'not_applicable' ? { state: 'not_applicable' } : { state: 'pending' };
  }

  return {
    state: 'bands',
    bands: [toBand('a2', vocab.a2.domain_score), toBand('b1', vocab.b1.domain_score)],
  };
}
