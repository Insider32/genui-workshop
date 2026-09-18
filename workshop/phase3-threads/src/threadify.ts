/**
 * Phase 3: the pivot. Markdown in, threads out.
 *
 * Note what the input is: the Phase 2 report. Not fixtures/comments.json.
 * The tool reads what the previous phase wrote for a human and turns it
 * into data for a renderer.
 *
 *   pnpm phase3            # cached unless out/threads.json is missing
 *   LIVE=1 pnpm phase3     # regenerate with the configured model
 */
import {
  OUTPUTS,
  createModel,
  describeLlm,
  generateStructured,
  loadComments,
  readCache,
  readJson,
  readLlmConfig,
  shouldRunLive,
  writeJson,
} from '@workshop/shared';
import { THREADIFY_SYSTEM_PROMPT, buildThreadifyUserPrompt } from './prompt.js';
import { SEVERITY_ORDER, ThreadsOutputSchema, type Thread } from './schema.js';

function report(threads: Thread[], knownIds: Set<string>): void {
  const seen = new Map<string, string>();
  const problems: string[] = [];
  for (const thread of threads) {
    for (const id of thread.source_comments) {
      if (!knownIds.has(id)) problems.push(`${thread.id} references unknown comment ${id}`);
      const prior = seen.get(id);
      if (prior) problems.push(`${id} appears in both ${prior} and ${thread.id}`);
      seen.set(id, thread.id);
    }
  }
  const missing = [...knownIds].filter((id) => !seen.has(id));

  console.log(`\n${threads.length} threads:`);
  for (const t of threads) {
    console.log(`  ${t.id}  ${t.severity.padEnd(8)} ${t.ui_hint.padEnd(9)} ${t.title}  (${t.source_comments.length} comments)`);
  }
  console.log(`\nCoverage: ${seen.size}/${knownIds.size} comment ids assigned.`);
  if (missing.length) console.warn(`Unassigned: ${missing.join(', ')}`);
  for (const p of problems) console.warn(`Problem: ${p}`);
}

async function main() {
  const llm = readLlmConfig();
  const cachePath = OUTPUTS.phase3Threads;
  const live = shouldRunLive(cachePath, llm !== null);
  const knownIds = new Set(loadComments().map((c) => c.id));

  console.log(`Model: ${describeLlm(llm)}`);
  console.log(`Mode:  ${live ? 'LIVE (calling the model)' : 'CACHED (reading out/threads.json)'}`);

  if (!live) {
    if (!readCache(cachePath)) {
      console.error('No cached threads and no model configured. Set LLM_API_KEY (see .env.example).');
      process.exit(1);
    }
    const cached = ThreadsOutputSchema.parse(readJson(cachePath));
    report(cached.threads, knownIds);
    return;
  }

  const markdown = readCache(OUTPUTS.phase2Report);
  if (!markdown) {
    console.error('Phase 2 report not found. Run `pnpm phase2` first.');
    process.exit(1);
  }

  const started = Date.now();
  const result = await generateStructured({
    model: createModel(llm!),
    system: THREADIFY_SYSTEM_PROMPT,
    prompt: buildThreadifyUserPrompt(markdown),
    schema: ThreadsOutputSchema,
    schemaName: 'ReviewThreads',
    schemaDescription: 'Review comments folded into actionable threads',
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  result.threads.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
  result.threads.forEach((t, i) => {
    t.id = `thr-${String(i + 1).padStart(3, '0')}`;
  });

  writeJson(cachePath, result);
  console.log(`\nWrote ${cachePath} in ${seconds}s.`);
  report(result.threads, knownIds);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
