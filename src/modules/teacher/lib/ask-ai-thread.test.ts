import { AxiosError, AxiosHeaders } from 'axios';
import { describe, expect, test } from 'vitest';

import { askHistory, describeAskFailure } from '@/modules/teacher/lib/ask-ai-thread';
import type { AskAiMessage } from '@/modules/teacher/types/ask-ai.types';

// Every fixture below is a response RECORDED from the live API on :5500 as t2
// (t2@schooltest.local) against class qves8wrtl7r9ctw49jivm8gl — see the chunk
// report for the curl that produced each one. Nothing is invented.

const turn = (over: Partial<AskAiMessage>): AskAiMessage => ({
  id: 1,
  role: 'teacher',
  title: null,
  body: 'What should I teach next?',
  tone: 'answer',
  grounding: null,
  ...over,
});

/** Builds the AxiosError the interceptor really hands a mutation for one status. */
function failure(status: number, data: unknown, headers: Record<string, string> = {}): AxiosError {
  const error = new AxiosError('Request failed with status code ' + status);
  error.response = {
    status,
    statusText: '',
    data,
    headers: new AxiosHeaders(headers),
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('askHistory — what C-TA-1 is allowed to replay', () => {
  test('keeps the conversation in order, trimmed, as {role, content}', () => {
    const history = askHistory([
      turn({ id: 1, role: 'teacher', body: '  What should I teach next?  ' }),
      turn({ id: 2, role: 'ai', body: 'Every one of the 11 students with a reportable sitting has Decoding as their primary gap.' }),
    ]);
    expect(history).toEqual([
      { role: 'teacher', content: 'What should I teach next?' },
      {
        role: 'ai',
        content: 'Every one of the 11 students with a reportable sitting has Decoding as their primary gap.',
      },
    ]);
  });

  test('a refusal is a model turn and is replayed; the portal’s own 503 notice is not', () => {
    const history = askHistory([
      turn({ id: 1, role: 'teacher', body: 'Which students have been absent most this term?' }),
      turn({
        id: 2,
        role: 'ai',
        tone: 'refused',
        title: 'Cannot answer that from this class’s results',
        body: "I can't answer that. This data covers reading assessment results for Reading 8B only.",
      }),
      turn({
        id: 3,
        role: 'ai',
        tone: 'error',
        title: 'The assistant is unavailable',
        body: 'The AI assistant could not be reached just now, so there is no answer to show.',
      }),
    ]);
    expect(history.map((entry) => entry.role)).toEqual(['teacher', 'ai']);
    expect(history.at(-1)?.content).toContain("I can't answer that.");
  });

  test('only the newest six turns travel, and each is capped at the contract’s length', () => {
    const long = 'x'.repeat(2_500);
    const messages = Array.from({ length: 9 }, (_, index) =>
      turn({ id: index + 1, role: index % 2 === 0 ? 'teacher' : 'ai', body: `turn ${index + 1}` }),
    );
    const history = askHistory([...messages, turn({ id: 10, role: 'ai', body: long })]);
    expect(history).toHaveLength(6);
    expect(history[0]?.content).toBe('turn 5');
    expect(history.at(-1)?.content).toHaveLength(2_000);
  });
});

describe('describeAskFailure — the drawer’s honest states', () => {
  test('503 (TB-44: this box has no LLM gateway) keeps the server’s own sentence', () => {
    // RECORDED: POST /api/teacher/ask {scope:'class', class_document_id:'qves8…', question:'What should I teach next?'}
    expect(
      describeAskFailure(
        failure(503, {
          data: null,
          error: {
            status: 503,
            name: 'ServiceUnavailableError',
            message:
              'The AI assistant could not be reached just now, so there is no answer to show. Nothing was changed — try again in a moment.',
            details: {},
          },
        }),
      ),
    ).toEqual({
      kind: 'unavailable',
      message:
        'The AI assistant could not be reached just now, so there is no answer to show. Nothing was changed — try again in a moment.',
      retryAfterSeconds: null,
    });
  });

  test('429 carries the per-teacher budget sentence and the Retry-After the API sent', () => {
    // RECORDED: the 21st ask inside one minute answered 429 with `Retry-After: 60`.
    expect(
      describeAskFailure(
        failure(
          429,
          {
            data: null,
            error: {
              status: 429,
              name: 'RateLimitError',
              message: 'Too many questions — Ask AI allows 20 a minute. Try again shortly.',
              details: {},
            },
          },
          { 'retry-after': '60' },
        ),
      ),
    ).toEqual({
      kind: 'rateLimited',
      message: 'Too many questions — Ask AI allows 20 a minute. Try again shortly.',
      retryAfterSeconds: 60,
    });
  });

  test('a 400 the teacher can act on is shown as the server wrote it', () => {
    // DERIVED from the recorded 400 envelope (`invalid request body (C-TA-1 TeacherAskBody)`),
    // with the message the service sends when a student id survives anonymisation.
    const described = describeAskFailure(
      failure(400, {
        data: null,
        error: {
          status: 400,
          name: 'ValidationError',
          message:
            'Please ask without pasting a student email or id — the assistant is only ever given anonymised data. Use the student’s name, or open that student and ask there.',
          details: {},
        },
      }),
    );
    expect(described.kind).toBe('rejected');
    expect(described.message).toContain('only ever given anonymised data');
  });

  test('no response at all is offline, never an answer', () => {
    expect(describeAskFailure(new AxiosError('Network Error'))).toEqual({
      kind: 'offline',
      message: 'Network Error',
      retryAfterSeconds: null,
    });
  });
});
