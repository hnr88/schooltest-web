import { STUDENT_ASK_MATCH_ORDER } from '@/modules/teacher/constants/student-ask.constants';
import { analysisTopics } from '@/modules/teacher/lib/student-detail-text';
import type {
  StudentAskAnswer,
  StudentAskIntent,
  StudentAskKeywords,
} from '@/modules/teacher/types/student-ask.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

/**
 * The design's question router (`studentVals` ask.resolve): a question naming a
 * focus word asks where to focus, a vocabulary word asks about vocabulary, a change
 * word asks what moved the score; anything else gets the overview.
 */
export function askIntentOf(question: string, keywords: StudentAskKeywords): StudentAskIntent {
  const asked = question.toLocaleLowerCase();
  const hits = (words: string) =>
    words
      .split('|')
      .map((word) => word.trim().toLocaleLowerCase())
      .some((word) => word !== '' && asked.includes(word));
  return STUDENT_ASK_MATCH_ORDER.find((topic) => hits(keywords[topic])) ?? 'generic';
}

/**
 * The answer to one intent, built from the same sentences as the "Student analysis"
 * card — grounded only in this student's result. A topic the result cannot speak to
 * answers that it cannot, rather than guessing.
 */
export function studentAnswer(intent: StudentAskIntent, view: StudentDetailView, first: string): StudentAskAnswer {
  const topics = analysisTopics(view, first);
  const title = { key: `ask.answer.${intent}`, values: { first } };
  const noData = { key: 'ask.noData', values: { first } };
  if (intent === 'generic') {
    return { title, body: [...(topics.change.length > 0 ? topics.change : [noData]), { key: 'ask.more' }] };
  }
  return { title, body: topics[intent].length > 0 ? topics[intent] : [noData] };
}
