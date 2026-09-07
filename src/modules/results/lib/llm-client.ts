import type { DiagnosticExport } from '@schooltest/scoring-contracts';

import { strapi } from '@/lib/axios/strapi';

/**
 * §4.8/D5 — the LLM seam. BOTH features send exactly `{ prompt, context }`
 * where `context` IS the export bundle (never ResultView fields — D5: the
 * bundle is no-name, no-transcript, no posteriors by construction) plus, for
 * Ask AI, the teacher's question. The prompts carry the honesty guardrails
 * into the model: "steady" means DO NOT CLAIM GROWTH, and Critical Reading is
 * described by score and gate state, never band language.
 *
 * WIRING MARK (task 32 running early): NO LLM GATEWAY EXISTS YET — the
 * "existing askClaude client" the task's Checked claim names was grepped and
 * does not exist in the tree. The endpoint constant below is the marked call
 * site: the gateway (a Strapi route is the likely shape — teacher-authorised,
 * key held server-side) lands with the wiring train; until then this function
 * is only exercised by tests against the serialised payload. Nothing invents
 * a mock response.
 */
export const LLM_ENDPOINT = '/api/ai/result-commentary';

export interface LlmRequest {
  prompt: string;
  context: DiagnosticExport;
  question?: string;
}

const GUARDRAILS = [
  'You are writing for a classroom teacher about ONE student\'s reading diagnostic.',
  'The context is the pseudonymised export bundle. It carries no name; do not invent one.',
  'A change of "steady" means DO NOT CLAIM GROWTH — say the score is steady, never that it rose.',
  'A change of "band_movement" means the student moved between bands; do not invent a point figure for it.',
  'Critical Reading has NO band (it sits outside the CDM): describe it by score and by whether the exit gate was passed, never with band words like secure or emerging.',
  'Reference only the gated change figures in the bundle; never recompute or estimate a delta.',
].join(' ');

export function buildCommentaryPrompt(bundle: DiagnosticExport): string {
  return `${GUARDRAILS}
Write exactly THREE short plain-English paragraphs:
1. Position and growth — the overall score and its gated change.
2. Strength and focus — the strongest and weakest assessed skills, plus the most common error pattern when one dominates.
3. Vocabulary — the blend and its strands, with one teaching suggestion.
Context bundle: ${JSON.stringify(bundle)}`;
}

export function buildAskPrompt(bundle: DiagnosticExport, question: string): string {
  return `${GUARDRAILS}
Answer the teacher's question about this bundle in plain English.
Context bundle: ${JSON.stringify(bundle)}
Question: ${question}`;
}

/** The ONLY payload shape the client sends. Tests assert on its serialisation. */
export function llmPayload(bundle: DiagnosticExport, question?: string): LlmRequest {
  return question === undefined
    ? { prompt: buildCommentaryPrompt(bundle), context: bundle }
    : { prompt: buildAskPrompt(bundle, question), context: bundle, question };
}

/**
 * The marked call site. POSTs the payload and returns the model's text; the
 * response contract (free text) is the minimal shape a gateway can answer
 * with — strict parsing belongs to the gateway task that wires this.
 */
export async function askClaude(payload: LlmRequest): Promise<string> {
  const response = await strapi.post<string>(LLM_ENDPOINT, payload, { responseType: 'text' });
  return response.data;
}
