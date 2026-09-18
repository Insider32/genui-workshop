/**
 * Phase 3 (API-key route): the pivot. Markdown in, threads out.
 *
 * Note what the input is: the Phase 2 report. Not fixtures/comments.json.
 * The tool reads what the previous phase wrote for a human and turns it
 * into data for a renderer.
 *
 *   pnpm phase3              # cached unless out/threads.json is missing
 *   pnpm phase3 -- --live    # regenerate with the configured model (or LIVE=1)
 *
 * The AI-CLI route does not use this script: your agent writes threads.json
 * directly from the objective in docs/phase-3.md, then `pnpm phase3:check` validates it.
 */
import {
  OUTPUTS,
  createModel,
  describeLlm,
  generateStructured,
  loadComments,
  loadPr,
  printCheck,
  readCache,
  readJson,
  readLlmConfig,
  shouldRunLive,
  writeJson,
} from '@workshop/shared';
import { THREADIFY_SYSTEM_PROMPT, buildThreadifyUserPrompt } from './prompt.js';
import { SEVERITY_ORDER, ThreadsOutputSchema } from './schema.js';
import { describeThreads, validateThreads } from './validate.js';

async function main() {
  const llm = readLlmConfig();
  const cachePath = OUTPUTS.phase3Threads;
  const live = shouldRunLive(cachePath, llm !== null);
  const knownIds = new Set(loadComments().map((c) => c.id));
  const prFiles = new Set(loadPr().files);

  console.log(`Model: ${describeLlm(llm)}`);
  console.log(`Mode:  ${live ? 'LIVE (calling the model)' : 'CACHED (reading out/threads.json)'}`);

  if (!live) {
    if (!readCache(cachePath)) {
      console.error('No cached threads and no model configured. Set LLM_API_KEY (see README), or use your AI CLI (see docs/phase-3.md).');
      process.exit(1);
    }
    const { threads, result } = validateThreads(readJson(cachePath), knownIds, prFiles);
    printCheck('Phase 3 · threads.json (cached)', result, threads ? describeThreads(threads) : []);
    return;
  }

  const markdown = readCache(OUTPUTS.phase2Report);
  if (!markdown) {
    console.error('Phase 2 report not found. Run `pnpm phase2` first.');
    process.exit(1);
  }

  const started = Date.now();
  const generated = await generateStructured({
    model: createModel(llm!),
    system: THREADIFY_SYSTEM_PROMPT,
    prompt: buildThreadifyUserPrompt(markdown),
    schema: ThreadsOutputSchema,
    schemaName: 'ReviewThreads',
    schemaDescription: 'Review comments folded into actionable threads',
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  generated.threads.sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99));
  generated.threads.forEach((t, i) => {
    t.id = `thr-${String(i + 1).padStart(3, '0')}`;
  });

  writeJson(cachePath, generated);
  console.log(`\nWrote ${cachePath} in ${seconds}s.`);
  const { threads, result } = validateThreads(generated, knownIds, prFiles);
  printCheck('Phase 3 · threads.json (fresh)', result, threads ? describeThreads(threads) : []);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
