'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { ASK_AI_SPEECH_LANG } from '@/modules/teacher/constants/ask-ai.constants';
import { askHistory, describeAskFailure } from '@/modules/teacher/lib/ask-ai-thread';
import { speakAloud, speechRecognitionCtor, stopSpeaking } from '@/modules/teacher/lib/ask-ai-speech';
import { useTeacherAskMutation } from '@/modules/teacher/queries/use-teacher-ask.mutation';
import type { AskAi, AskAiFailure, AskAiMessage } from '@/modules/teacher/types/ask-ai.types';
import type { AskAiTarget } from '@/modules/teacher/types/class-overlays.types';

const FAILURE_TITLE: Record<AskAiFailure['kind'], string> = {
  unavailable: 'unavailableTitle',
  rateLimited: 'rateLimitedTitle',
  rejected: 'rejectedTitle',
  offline: 'offlineTitle',
};

/**
 * The Ask AI drawer's conversation, for BOTH scopes (`Teacher Portal v2.dc.html`
 * S13 student / S16 class). Every answer is a live C-TA-1 reply grounded in the
 * caller's own results — the design's keyword router was a prototype mock and is
 * gone (TB-09). A refusal is a normal AI turn under its own title; a 503/429/400
 * is shown as the server's own sentence, never as an answer.
 *
 * Speak reads answers aloud with the browser's speechSynthesis and the mic takes
 * a spoken question through SpeechRecognition; neither is simulated. The thread
 * survives closing the drawer, as the design's does.
 */
export function useAskAi(target: AskAiTarget, classDocumentId: string): AskAi {
  const t = useTranslations('TeacherPortal.askAi');
  const locale = useLocale();
  const mutation = useTeacherAskMutation();
  const [messages, setMessages] = useState<AskAiMessage[]>([]);
  const [query, setQuery] = useState('');
  const [speak, setSpeak] = useState(false);
  const [listening, setListening] = useState(false);
  const lastId = useRef(0);
  const lang = ASK_AI_SPEECH_LANG[locale] ?? locale;

  useEffect(() => stopSpeaking, []);

  const push = (entries: ReadonlyArray<Omit<AskAiMessage, 'id'>>) => {
    const numbered = entries.map((entry) => {
      lastId.current += 1;
      return { ...entry, id: lastId.current };
    });
    setMessages((current) => [...current, ...numbered]);
  };

  const send = (question = query) => {
    const asked = question.trim();
    if (asked === '' || mutation.isPending) return;
    const history = askHistory(messages);
    push([{ role: 'teacher', title: null, body: asked, tone: 'answer', grounding: null }]);
    setQuery('');
    mutation.mutate(
      {
        scope: target.scope,
        class_document_id: classDocumentId,
        ...(target.scope === 'student' ? { student_document_id: target.studentDocumentId } : {}),
        question: asked,
        ...(history.length > 0 ? { history } : {}),
      },
      {
        onSuccess: (data) => {
          push([
            {
              role: 'ai',
              title: data.refused ? t(`${target.scope}.refusedTitle`) : null,
              body: data.answer,
              tone: data.refused ? 'refused' : 'answer',
              grounding: data.grounding,
            },
          ]);
          // Speak as it was when the question was asked — toggling mid-flight does not
          // retro-read an answer the teacher did not ask to hear.
          if (speak) speakAloud(data.answer, lang);
        },
        onError: (error) => {
          const failure = describeAskFailure(error);
          const retry =
            failure.retryAfterSeconds === null ? '' : ` ${t('retryAfter', { seconds: failure.retryAfterSeconds })}`;
          push([
            {
              role: 'ai',
              title: t(FAILURE_TITLE[failure.kind]),
              body: `${failure.message === '' ? t('offlineBody') : failure.message}${retry}`,
              tone: 'error',
              grounding: null,
            },
          ]);
        },
      },
    );
  };

  const listen = () => {
    const Recognition = speechRecognitionCtor();
    if (Recognition === null) {
      push([
        { role: 'ai', title: t('speakMode'), body: t('micUnavailable'), tone: 'error', grounding: null },
      ]);
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
    isPending: mutation.isPending,
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
