'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { STUDENT_ASK_SPEECH_LANG, STUDENT_ASK_TOPICS } from '@/modules/teacher/constants/student-ask.constants';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { askIntentOf, studentAnswer } from '@/modules/teacher/lib/student-ask';
import { speakAloud, speechRecognitionCtor, stopSpeaking } from '@/modules/teacher/lib/student-speech';
import type {
  StudentAskAi,
  StudentAskIntent,
  StudentAskMessage,
} from '@/modules/teacher/types/student-ask.types';
import type { StudentDetailView } from '@/modules/teacher/types/v2-student-detail.types';

/**
 * The Ask AI drawer's conversation (`Teacher Portal v2.dc.html:346–392`, `studentVals`
 * ask): each question is routed to a topic and answered from this student's own
 * analysis sentences; Speak reads answers aloud and the mic takes a spoken question.
 * The thread survives closing the drawer, as the design's does.
 */
export function useStudentAskAi(view: StudentDetailView, first: string): StudentAskAi {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const locale = useLocale();
  const { text } = useStudentText();
  const [messages, setMessages] = useState<StudentAskMessage[]>([]);
  const [query, setQuery] = useState('');
  const [speak, setSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const lastId = useRef(0);
  const lang = STUDENT_ASK_SPEECH_LANG[locale] ?? locale;

  useEffect(() => stopSpeaking, []);

  const push = (entries: ReadonlyArray<Omit<StudentAskMessage, 'id'>>) => {
    const numbered = entries.map((entry) => {
      lastId.current += 1;
      return { ...entry, id: lastId.current };
    });
    setMessages((current) => [...current, ...numbered]);
  };

  const send = (question = query, intent?: StudentAskIntent) => {
    const asked = question.trim();
    if (asked === '') return;
    const keywords = {
      change: t('ask.keywords.change'),
      focus: t('ask.keywords.focus'),
      vocab: t('ask.keywords.vocab'),
    };
    const answer = studentAnswer(intent ?? askIntentOf(asked, keywords), view, first);
    const body = answer.body.map(text).join(' ');
    push([
      { role: 'teacher', title: null, body: asked },
      { role: 'ai', title: text(answer.title), body },
    ]);
    setQuery('');
    if (speak) speakAloud(body, lang);
  };

  const listen = () => {
    const Recognition = speechRecognitionCtor();
    if (Recognition === null) {
      push([{ role: 'ai', title: t('ask.speakMode'), body: t('ask.micUnavailable') }]);
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      setListening(false);
      send(event.results[0]?.[0]?.transcript ?? '');
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    setListening(true);
    recognition.start();
  };

  return {
    messages,
    query,
    setQuery,
    send,
    suggestions: STUDENT_ASK_TOPICS.map((intent) => ({
      intent,
      label: t(`ask.suggest.${intent}`, { first }),
      question: t(`ask.question.${intent}`, { first }),
    })),
    speak,
    toggleSpeak: () => {
      if (speak) stopSpeaking();
      setSpeak(!speak);
    },
    listening,
    listen,
    silence: stopSpeaking,
  };
}
