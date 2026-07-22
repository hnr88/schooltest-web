/**
 * Merge the per-wave task fragments into .qa/STATE.json (machine DAG) and
 * .qa/STATE.md (human mirror), then validate the DAG.
 *
 * Validation is fail-loud: duplicate ids, dangling depends_on, self-edges, cycles,
 * and fragment/file mismatches all exit non-zero rather than writing a broken board.
 *
 *   node .qa/gen-state.mjs            # merge + validate + write
 *   node .qa/gen-state.mjs --check    # validate only, write nothing
 */
import fs from 'node:fs';
import path from 'node:path';

const QA = '.qa';
const FRAG_DIR = path.join(QA, 'fragments');
const TASK_DIR = '.thellmspace/tasks';
const checkOnly = process.argv.includes('--check');

const WAVES = {
  W0: 'Foundations — tokens, font, motion, dark mode',
  W1: 'Design-system primitives',
  W2: 'Backend metric surfaces (Strapi)',
  W3: 'Typed client + query layer',
  W4: 'App shell',
  W5: 'Dashboard',
  W6: 'Children list + child detail',
  W7: 'Add-child wizard',
  W8: 'Search — schools + agents',
  W9: 'Notifications + settings',
  W10: 'Auth screens + landing',
  W11: 'Sweep — UI, a11y, security, regression',
};

const errors = [];
const warn = [];

/* ---------- load fragments ---------- */
const tasks = [];
const seen = new Map();
for (const f of fs.readdirSync(FRAG_DIR).filter((n) => n.endsWith('.json')).sort()) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(FRAG_DIR, f), 'utf8'));
  } catch (e) {
    errors.push(`fragment ${f}: invalid JSON — ${e.message}`);
    continue;
  }
  if (!Array.isArray(parsed)) {
    errors.push(`fragment ${f}: expected a JSON array`);
    continue;
  }
  for (const t of parsed) {
    if (!t || typeof t.id !== 'string') {
      errors.push(`fragment ${f}: a task has no string id`);
      continue;
    }
    if (seen.has(t.id)) errors.push(`duplicate id ${t.id} (in ${seen.get(t.id)} and ${f})`);
    else seen.set(t.id, f);
    tasks.push({
      id: t.id,
      file: t.file ?? null,
      title: t.title ?? '',
      layer: t.layer ?? null,
      kind: t.kind ?? null,
      wave: t.wave ?? null,
      contract: t.contract ?? [],
      design: t.design ?? [],
      depends_on: Array.isArray(t.depends_on) ? t.depends_on : [],
      status: t.status ?? 'TODO',
      started_at: t.started_at ?? null,
      builder: t.builder ?? null,
      verdict: t.verdict ?? null,
      evidence: t.evidence ?? null,
    });
  }
}
tasks.sort((a, b) => a.id.localeCompare(b.id));

/* ---------- validate ---------- */
const byId = new Map(tasks.map((t) => [t.id, t]));

for (const t of tasks) {
  if (!t.wave || !WAVES[t.wave]) errors.push(`${t.id}: unknown wave "${t.wave}"`);
  for (const d of t.depends_on) {
    if (d === t.id) errors.push(`${t.id}: depends on itself`);
    else if (!byId.has(d)) errors.push(`${t.id}: dangling depends_on -> ${d}`);
  }
  if (t.file) {
    const onDisk = path.join(TASK_DIR, path.basename(t.file));
    if (!fs.existsSync(onDisk)) errors.push(`${t.id}: task file missing on disk (${onDisk})`);
  } else {
    errors.push(`${t.id}: no file path`);
  }
}

// orphan task files (on disk but in no fragment)
const claimed = new Set(tasks.map((t) => t.file && path.basename(t.file)).filter(Boolean));
for (const f of fs.existsSync(TASK_DIR) ? fs.readdirSync(TASK_DIR) : []) {
  if (f.endsWith('.md') && !claimed.has(f)) warn.push(`orphan task file not in any fragment: ${f}`);
}

// cycle detection (iterative DFS, 3-colour)
const colour = new Map();
const stack = [];
function visit(id) {
  colour.set(id, 'grey');
  stack.push(id);
  for (const d of byId.get(id)?.depends_on ?? []) {
    if (!byId.has(d)) continue;
    const c = colour.get(d);
    if (c === 'grey') {
      errors.push(`cycle: ${stack.slice(stack.indexOf(d)).join(' -> ')} -> ${d}`);
    } else if (c !== 'black') {
      visit(d);
    }
  }
  stack.pop();
  colour.set(id, 'black');
}
for (const t of tasks) if (colour.get(t.id) !== 'black') visit(t.id);

if (errors.length) {
  console.error(`DAG INVALID — ${errors.length} error(s):`);
  for (const e of errors) console.error('  ✗ ' + e);
  process.exit(1);
}
for (const w of warn) console.warn('  ! ' + w);

/* ---------- rollups ---------- */
const isDone = (t) => t.status === 'DONE';
const ready = tasks.filter(
  (t) => t.status === 'TODO' && t.depends_on.every((d) => isDone(byId.get(d)))
);
const count = (pred) => tasks.filter(pred).length;
const byWave = Object.keys(WAVES).map((w) => {
  const ts = tasks.filter((t) => t.wave === w);
  return { wave: w, title: WAVES[w], total: ts.length, done: ts.filter(isDone).length, blocked: ts.filter((t) => t.status === 'BLOCKED').length };
});
const byLayer = [...new Set(tasks.map((t) => t.layer))].sort().map((l) => {
  const ts = tasks.filter((t) => t.layer === l);
  return { layer: l, total: ts.length, done: ts.filter(isDone).length };
});

if (checkOnly) {
  console.log(`DAG OK — ${tasks.length} tasks, ${ready.length} ready, 0 errors`);
  process.exit(0);
}

/* ---------- write STATE.json ---------- */
const state = {
  mission: 'st-portal-redesign',
  contracts_file: '.qa/CONTRACTS.md',
  plan_file: '.qa/PLAN.md',
  design_index: '.qa/design/screens-index.json',
  totals: {
    tasks: tasks.length,
    done: count(isDone),
    doing: count((t) => t.status === 'DOING'),
    todo: count((t) => t.status === 'TODO'),
    blocked: count((t) => t.status === 'BLOCKED'),
    ready_now: ready.length,
  },
  waves: byWave,
  tasks,
};
fs.writeFileSync(path.join(QA, 'STATE.json'), JSON.stringify(state, null, 2) + '\n');

/* ---------- write STATE.md ---------- */
const L = [];
L.push('# STATE — mission `st-portal-redesign` (human mirror of STATE.json)');
L.push('');
L.push(
  'Implement the `dashbaord-design` export across the SchoolTest parent portal, wired to the real'
);
L.push('Strapi API, inventing nothing, preserving existing behaviour, with real motion and mobile.');
L.push('Plan: `.qa/PLAN.md` · Contracts: `.qa/CONTRACTS.md` · Resume: `.qa/HANDOFF.md`');
L.push('');
L.push(
  `**Totals:** ${state.totals.tasks} tasks · DONE ${state.totals.done} · DOING ${state.totals.doing} · TODO ${state.totals.todo} · BLOCKED ${state.totals.blocked}`
);
L.push('');
L.push('## Waves');
L.push('');
L.push('| # | Slice | Tasks | Done | Blocked |');
L.push('|---|---|---|---|---|');
for (const w of byWave) L.push(`| ${w.wave} | ${w.title} | ${w.total} | ${w.done}/${w.total} | ${w.blocked} |`);
L.push('');
L.push('## Per layer');
L.push('');
L.push('| Layer | Tasks | Done |');
L.push('|---|---|---|');
for (const l of byLayer) L.push(`| ${l.layer} | ${l.total} | ${l.done} |`);
L.push('');
L.push('## Ready now (deps satisfied, status TODO)');
L.push('');
if (!ready.length) L.push('_none — every remaining task is blocked or in flight._');
for (const t of ready.slice(0, 40)) L.push(`- **${t.id}** ${t.title} _(${t.wave}, ${t.layer})_`);
if (ready.length > 40) L.push(`- …and ${ready.length - 40} more`);
L.push('');
L.push('## BLOCKED');
L.push('');
const blocked = tasks.filter((t) => t.status === 'BLOCKED');
if (!blocked.length) L.push('_none_');
for (const t of blocked) L.push(`- **${t.id}** ${t.title} — ${t.evidence ?? 'see task file'}`);
L.push('');
L.push('## DAG (adjacency list)');
L.push('');
L.push('```');
for (const t of tasks) {
  L.push(`${t.id} [${t.status}] ${t.title}`);
  L.push(`      deps: ${t.depends_on.length ? t.depends_on.join(', ') : '(none)'}`);
}
L.push('```');
fs.writeFileSync(path.join(QA, 'STATE.md'), L.join('\n') + '\n');

console.log(
  `DAG OK — ${tasks.length} tasks across ${byWave.filter((w) => w.total).length} waves; ` +
    `${ready.length} ready now. Wrote .qa/STATE.json + .qa/STATE.md`
);
