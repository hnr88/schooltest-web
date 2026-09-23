import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, test } from 'vitest';

import en from '@/i18n/messages/en.json';
import ko from '@/i18n/messages/ko.json';
import ms from '@/i18n/messages/ms.json';
import th from '@/i18n/messages/th.json';
import vi from '@/i18n/messages/vi.json';
import zh from '@/i18n/messages/zh.json';
import { LLM_EXPORT_FAILURE_KEY } from '@/modules/teacher/constants/classes-screen.constants';
import {
  classifyTeacherExportFailure,
  TeacherExportError,
  teacherExportFailureOf,
} from '@/modules/teacher/lib/teacher-export';

const config = { headers: new AxiosHeaders() } as InternalAxiosRequestConfig;

/** A Strapi refusal as the text-typed export GET receives it: the envelope is a JSON STRING. */
const refusal = (status: number, details: Record<string, unknown> = {}, message = 'refused') =>
  new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, {}, {
    status,
    statusText: '',
    headers: {},
    config,
    data: JSON.stringify({ data: null, error: { status, name: 'ApplicationError', message, details } }),
  });

describe('why a teacher export produced no file', () => {
  test('the de-identification refusal is "withheld", by its code', () => {
    const withheld = refusal(400, { code: 'EXPORT_WITHHELD' }, 'export withheld: it still carries the family_name of S26');
    expect(classifyTeacherExportFailure(withheld)).toBe('withheld');
  });

  test('any other refusal the server answered is "refused" — retrying will not change it', () => {
    for (const status of [400, 403, 404]) expect(classifyTeacherExportFailure(refusal(status))).toBe('refused');
  });

  test('no answer, an expired session, a rate limit, a 5xx or a broken body is "failed"', () => {
    const offline = new AxiosError('Network Error', 'ERR_NETWORK', config);
    expect(classifyTeacherExportFailure(offline)).toBe('failed');
    for (const status of [401, 429, 500, 503]) expect(classifyTeacherExportFailure(refusal(status))).toBe('failed');
    expect(classifyTeacherExportFailure(new Error('export document is missing ## Prompt'))).toBe('failed');
  });

  test('the client rethrow carries the reason; anything else reads as "failed"', () => {
    expect(teacherExportFailureOf(new TeacherExportError('withheld'))).toBe('withheld');
    expect(teacherExportFailureOf(new TeacherExportError('refused'))).toBe('refused');
    expect(teacherExportFailureOf(new Error('teacher export requires a signed-in teacher token'))).toBe('failed');
  });

  test('every reason has its toast in all six locales, naming the class', () => {
    for (const messages of [en, zh, ko, ms, th, vi]) {
      const copy = messages.TeacherPortal.classes.export as Record<string, string>;
      for (const key of Object.values(LLM_EXPORT_FAILURE_KEY)) {
        expect(copy[key.replace('export.', '')]).toContain('{name}');
      }
    }
  });
});
