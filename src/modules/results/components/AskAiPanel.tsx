'use client';

import { useState } from 'react';

import { renderStudentMarkdown } from '@/modules/results/lib/llm-export';
import type { DiagnosticExport } from '@schooltest/scoring-contracts';

/**
 * §4.8 Ask AI + §4.9 LLM markdown export. The panel is wiring-agnostic: it
 * takes the bundle and hands the parent the teacher's question (`onAsk`) — the
 * parent owns the askClaude call, so this component never assembles an LLM
 * payload itself (D5). The download button renders the markdown FROM THE
 * BUNDLE and triggers the browser download; the bundle is the de-identified
 * context, so the file carries no name and no posteriors by construction.
 */
const SUGGESTED_QUESTIONS = [
  'Which skills improved since the last test?',
  'What should I teach next?',
  'How is Vocabulary developing across the strands?',
  'Did the student pass the exit gate, and what does that mean?',
];

function downloadMarkdown(markdown: string, sittingNumber: number): void {
  const blob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `reading-diagnostic-sitting-${sittingNumber}.md`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function AskAiPanel({
  bundle,
  answer,
  pending,
  onAsk,
}: {
  bundle: DiagnosticExport;
  answer: string | null;
  pending: boolean;
  onAsk: (question: string) => void;
}) {
  const [question, setQuestion] = useState('');

  return (
    <section data-slot="ask-ai" aria-label="Ask AI about this result" className="flex flex-col gap-2">
      <h2 className="text-caption font-bold uppercase tracking-wide text-muted-foreground">Ask AI</h2>
      <div data-slot="ask-ai-chips" className="flex flex-wrap gap-1.5">
        {SUGGESTED_QUESTIONS.map((chip) => (
          <button
            key={chip}
            type="button"
            data-slot="ask-ai-chip"
            onClick={() => setQuestion(chip)}
            className="print-hidden rounded-full bg-muted px-3 py-1 text-caption font-semibold text-muted-foreground hover:bg-accent"
          >
            {chip}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (question.trim().length > 0) onAsk(question.trim());
        }}
      >
        <input
          data-slot="ask-ai-input"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask about this result…"
          className="w-full rounded-tile border border-border px-3 py-2 text-body-md"
        />
        <button
          type="submit"
          data-slot="ask-ai-submit"
          disabled={pending || question.trim().length === 0}
          className="print-hidden rounded-tile bg-primary px-4 py-2 text-caption font-semibold text-primary-foreground disabled:opacity-50"
        >
          {pending ? 'Asking…' : 'Ask'}
        </button>
      </form>
      {answer !== null ? <p data-slot="ask-ai-answer" className="text-body-md text-pretty">{answer}</p> : null}
      <button
        type="button"
        data-slot="llm-export-download"
        onClick={() => downloadMarkdown(renderStudentMarkdown(bundle), bundle.sitting.number)}
        className="print-hidden w-fit rounded-full border border-border px-3 py-1.5 text-caption font-semibold hover:bg-muted"
      >
        Download for LLM (.md)
      </button>
    </section>
  );
}
