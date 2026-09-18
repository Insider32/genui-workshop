/**
 * Phase 4: per thread, ask the model for the props of the widget it chose.
 *
 *   pnpm phase4:widgets                    # cached unless src/data/widgets.json is missing
 *   LIVE=1 pnpm phase4:widgets             # regenerate every widget
 *   LIVE=1 pnpm phase4:widgets -- thr-009  # regenerate one (the finale, on stage)
 *
 * Input per thread: the thread itself, its source comments in full, and the
 * head contents of the files it touches. Output: an object validating against
 * the schema for that thread's ui_hint (src/widgets/schema.ts). The registry
 * then renders it. The model never writes code here; it fills a contract.
 */
import { existsSync } from 'node:fs';
import {
  OUTPUTS,
  createModel,
  describeLlm,
  generateStructured,
  loadComments,
  loadPrFiles,
  readJson,
  readLlmConfig,
  writeJson,
} from '@workshop/shared';
import { ThreadsOutputSchema, type Thread } from '@workshop/phase3-threads/schema';
import { UI_PRIMITIVE_DOCS } from '../src/ui-tree/schema';
import { SCHEMA_BY_HINT, WidgetsFileSchema, type WidgetsFile } from '../src/widgets/schema';

const HINT_GUIDANCE: Record<keyof typeof SCHEMA_BY_HINT, string> = {
  diff: 'Produce one hunk per concrete fix. `original` must be copied verbatim from the file content provided (3 to 25 contiguous lines). `proposed` replaces exactly that excerpt.',
  graph:
    'Nodes are modules in the API (routes/*, store/*, lib/*, the weather provider client, and any proposed services/*). Derive edges from the import statements in the file contents. Mark the problem edges named in the comments. If the comments propose a refactor, fill `proposed` with the structure after it.',
  choice: 'One option per approach discussed in the comments, plus at most one obvious alternative. Mark exactly one option as recommended, following the reviewers where they express a preference.',
  chart: 'Extract every number the comments give. One series entry per file or area mentioned. `before` is null for files new in this PR. Put the overall PR figure in `headline`.',
  checklist: 'One item per source comment, in file order. `text` is the fix as an instruction. `autofix` is true only when a formatter, linter --fix or trivial codemod could do it.',
  file: 'Pick the single file the comments concentrate on. One annotation per comment on that file, at the line the comment was left on, condensed to one or two sentences.',
  custom: `Compose a layout from these primitives and nothing else:\n${UI_PRIMITIVE_DOCS}\nUse the primitive that fits the content best; a sequence of steps wants a timeline, a comparison wants a table, a risk wants a callout. Keep it compact: at most 12 nodes.`,
};

function systemPrompt(hint: keyof typeof SCHEMA_BY_HINT): string {
  return `
You produce the props for a UI widget in a code review tool. A previous step turned review comments into a
"thread" and chose the widget kind "${hint}" for it. You now fill in that widget's data, faithfully, from the
thread, its source comments, and the current file contents. Never invent facts that are not in the input.
Keep prose short: the widget is the interface, not an essay.

${HINT_GUIDANCE[hint]}

Output only the structured object.
`.trim();
}

function userPrompt(thread: Thread, comments: ReturnType<typeof loadComments>, files: ReturnType<typeof loadPrFiles>): string {
  const sources = comments.filter((c) => thread.source_comments.includes(c.id));
  const touched = files.filter((f) => thread.files.includes(f.path) || sources.some((c) => c.path === f.path));
  return [
    '<thread>',
    JSON.stringify(thread, null, 2),
    '</thread>',
    '',
    '<comments>',
    ...sources.map((c) => `### ${c.id} · ${c.author} · ${c.severity} · ${c.path}:${c.line}\n${c.body}`),
    '</comments>',
    '',
    '<files>',
    ...touched.map((f) => `### ${f.path}\n\`\`\`\n${f.head ?? ''}\n\`\`\``),
    '</files>',
  ].join('\n');
}

async function main() {
  const only = process.argv.slice(2).filter((a) => a.startsWith('thr-'));
  const llm = readLlmConfig();
  const cachePath = OUTPUTS.phase4Widgets;
  const hasCache = existsSync(cachePath);
  const live = llm !== null && (process.env.LIVE === '1' || !hasCache);

  console.log(`Model: ${describeLlm(llm)}`);
  console.log(`Mode:  ${live ? 'LIVE' : 'CACHED'}${only.length ? ` (only ${only.join(', ')})` : ''}`);

  const threads = ThreadsOutputSchema.parse(readJson(OUTPUTS.phase3Threads)).threads;
  const existing: WidgetsFile = hasCache ? WidgetsFileSchema.parse(readJson(cachePath)) : {};

  if (!live) {
    if (!hasCache) {
      console.error('No cached widgets and no model configured. Set LLM_API_KEY (see .env.example).');
      process.exit(1);
    }
    for (const t of threads) {
      console.log(`  ${t.id}  ${t.ui_hint.padEnd(9)} ${existing[t.id] ? 'ok' : t.ui_hint === 'none' ? '-' : 'MISSING'}  ${t.title}`);
    }
    return;
  }

  const comments = loadComments();
  const files = loadPrFiles();
  const model = createModel(llm!);
  const result: WidgetsFile = { ...existing };

  for (const thread of threads) {
    if (thread.ui_hint === 'none') continue;
    if (only.length && !only.includes(thread.id)) continue;
    const hint = thread.ui_hint;
    const started = Date.now();
    process.stdout.write(`  ${thread.id}  ${hint.padEnd(9)} generating… `);
    const widget = await generateStructured({
      model,
      system: systemPrompt(hint),
      prompt: userPrompt(thread, comments, files),
      schema: SCHEMA_BY_HINT[hint],
      schemaName: `${hint[0]!.toUpperCase()}${hint.slice(1)}Widget`,
    });
    result[thread.id] = widget;
    console.log(`${((Date.now() - started) / 1000).toFixed(1)}s`);
  }

  writeJson(cachePath, WidgetsFileSchema.parse(result));
  console.log(`\nWrote ${cachePath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
