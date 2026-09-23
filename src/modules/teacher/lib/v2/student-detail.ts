import type { ResultView } from '@schooltest/scoring-contracts';

import { strongestSkill, weakestSkill } from '@/modules/results';

import { studentChart } from '@/modules/teacher/lib/v2/chart-geometry';
import { growthFromServer, scoreSpan } from '@/modules/teacher/lib/v2/growth';
import { overallOf, studentSeries } from '@/modules/teacher/lib/v2/history-series';
import { phaseOfResult } from '@/modules/teacher/lib/v2/phase';
import { assessedBandOf, toScoredSkill } from '@/modules/teacher/lib/v2/skill-refs';
import { subskillCards, vocabStrands } from '@/modules/teacher/lib/v2/subskill-cards';
import type { AnalysisSkill, StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

function analysisSkill(result: ResultView, found: Parameters<typeof toScoredSkill>[0]): AnalysisSkill | null {
  const scored = toScoredSkill(found);
  const band = scored === null ? null : assessedBandOf(result, scored.skill);
  return scored === null || band === null ? null : { ...scored, band };
}

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
      // Scored sittings only: an empty or under-floor attempt is not a sitting on this trend.
      sittings: { count: series.length, since: baseline?.satAt ?? null },
    },
    series,
    chart: studentChart(series),
    subskills: subskillCards(result),
    analysis: {
      strongest: analysisSkill(result, strongestSkill(result)),
      weakest: analysisSkill(result, weakestSkill(result)),
      vocab: vocabStrands(result),
    },
  };
}
