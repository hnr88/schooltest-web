import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { NextIntlClientProvider } from 'next-intl';

import { MissingDependencyNotice } from '@/modules/design-system';
import { StudentImportDialogBase } from '@/modules/student-import/components/StudentImportDialogBase';
import type { StudentImportFlowState } from '@/modules/student-import/hooks/use-student-import-flow';

// The empty-dependency rule: a control that depends on another entity never
// renders with empty options — the school-admin import dialog refuses the
// import and points at class creation instead, and the shared notice carries
// one copy per missing entity kind.

const enMessages = JSON.parse(
  readFileSync(resolve(process.cwd(), 'src/i18n/messages/en.json'), 'utf8'),
) as Record<string, unknown>;

(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let host: HTMLDivElement | null = null;

function mount(node: React.ReactNode) {
  host = document.createElement('div');
  document.body.appendChild(host);
  root = createRoot(host);
  act(() =>
    root!.render(
      <NextIntlClientProvider locale="en" messages={enMessages}>
        {node}
      </NextIntlClientProvider>,
    ),
  );
}

afterEach(() => {
  act(() => root?.unmount());
  host?.remove();
  root = null;
  host = null;
  document.body.innerHTML = '';
});

function buttonNamed(label: string): HTMLButtonElement | undefined {
  return [...document.body.querySelectorAll('button')].find(
    (button) => button.textContent?.trim() === label,
  );
}

const IDLE_STATE: StudentImportFlowState = {
  parsed: { rows: [], errors: [] },
  setParsed: vi.fn(),
  classId: '',
  setClassId: vi.fn(),
  rejects: [],
  canSubmit: false,
  pending: false,
  submit: vi.fn(),
};

const importDialog = (classes: Parameters<typeof StudentImportDialogBase>[0]['classes']) => (
  <StudentImportDialogBase
    messageNamespace="SchoolStudents.import"
    state={IDLE_STATE}
    onClose={vi.fn()}
    classes={classes}
    createClassesHref="/dashboard/school/classes"
  />
);

describe('MissingDependencyNotice', () => {
  test('the classes kind renders the refusal and the create-class CTA link', () => {
    mount(<MissingDependencyNotice kind="classes" ctaHref="/dashboard/school/classes" />);
    expect(document.body.textContent).toContain('No classes yet');
    expect(document.body.textContent).toContain('Create a class first');
    const cta = [...document.body.querySelectorAll('a')].find(
      (anchor) => anchor.textContent?.trim() === 'Create a class',
    );
    expect(cta?.getAttribute('href')).toBe('/dashboard/school/classes');
  });

  test('a kind without a CTA copy renders the refusal alone — never a dead button', () => {
    mount(<MissingDependencyNotice kind="destinationClasses" />);
    expect(document.body.textContent).toContain('No other class to move to');
    expect(document.body.textContent).not.toContain('Create a class');
  });

  test('the eligibleTeachers kind states the creation block, not a work-around', () => {
    // The add-class rule: no eligible teacher → the class cannot be created,
    // so the copy refuses ("needs at least one active teacher") — it must NOT
    // offer the old "continue without one" escape.
    mount(<MissingDependencyNotice kind="eligibleTeachers" />);
    expect(document.body.textContent).toContain('No eligible teachers');
    expect(document.body.textContent).toContain('at least one active teacher');
    expect(document.body.textContent).not.toContain('continue without one');
  });
});

describe('StudentImportDialogBase empty-dependency arms', () => {
  test('zero classes refuses the import: guard + CTA, no CSV fields, no submit', () => {
    mount(importDialog([]));
    expect(document.body.textContent).toContain('No classes yet');
    expect(document.body.querySelector('[data-slot="student-import-fields"]')).toBeNull();
    // The submit CTA is GONE on the guard arm — not a permanently dead button.
    expect(buttonNamed('Import students')).toBeUndefined();
    expect(buttonNamed('Cancel')).toBeDefined();
  });

  test('the guard arm drops the how-to sub that would contradict it', () => {
    mount(importDialog([]));
    expect(document.body.textContent).not.toContain('Upload or paste a CSV');
  });

  test('pending classes render the skeleton arm — never a half-loaded picker', () => {
    mount(importDialog('pending'));
    expect(document.body.querySelector('[data-slot="student-import-pending"]')).not.toBeNull();
    expect(document.body.querySelector('[data-slot="student-import-fields"]')).toBeNull();
    expect(buttonNamed('Import students')).toBeUndefined();
  });

  test('a failed classes load names the failure instead of showing zero options', () => {
    mount(importDialog('error'));
    expect(document.body.textContent).toContain('We could not load your classes');
    expect(document.body.querySelector('[data-slot="student-import-fields"]')).toBeNull();
    expect(buttonNamed('Import students')).toBeUndefined();
  });

  test('with classes present the picker and the submit render as before', () => {
    mount(importDialog([{ documentId: 'c1', name: '5A' }]));
    expect(document.body.querySelector('[data-slot="student-import-fields"]')).not.toBeNull();
    const submit = buttonNamed('Import students');
    expect(submit).toBeDefined();
    // Nothing parsed yet — the existing canSubmit rule still gates it.
    expect(submit!.disabled).toBe(true);
    expect(document.body.textContent).not.toContain('No classes yet');
  });
});
