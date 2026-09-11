import type { ResultView } from '@schooltest/scoring-contracts';

import { strongestSkill, weakestSkill } from '@/modules/results';

import { studentChart } from '@/modules/teacher/lib/v2/chart-geometry';
import { growthFromServer, scoreSpan } from '@/modules/teacher/lib/v2/growth';
import { overallOf, studentSeries } from '@/modules/teacher/lib/v2/history-series';
import { phaseOfResult } from '@/modules/teacher/lib/v2/phase';
import { toScoredSkill } from '@/modules/teacher/lib/v2/skill-refs';
import { subskillCards, vocabStrands } from '@/modules/teacher/lib/v2/subskill-cards';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

export function studentDetail(result: ResultView): StudentDetailView {
  const history = result.history ?? [];
  const series = studentSeries(result, overallOf);
  const baseline = series.at(0) ?? null;
  const score = result.overall.domain_score;
  const growth = growthFromServer(result.overall);
  return {
    resultDocumentId: result.document_id,
    overall: { score, growth },
    phase: phaseOfResult(result),
    tiles: {
      baseline,
      latest: { value: score, satAt: history.at(-1)?.sat_at ?? null },
      growth,
      span: series.length < 2 || baseline === null ? null : scoreSpan(baseline.value, score),
      sittings: { count: history.length, since: history.at(0)?.sat_at ?? null },
    },
    series,
    chart: studentChart(series),
    subskills: subskillCards(result),
    analysis: {
      strongest: toScoredSkill(strongestSkill(result)),
      weakest: toScoredSkill(weakestSkill(result)),
      vocab: vocabStrands(result),
    },
  };
}
