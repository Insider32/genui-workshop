/**
 * Phase 2 (API-key route): comments in, one big Markdown report out.
 *
 *   pnpm phase2              # cached unless out/report.md is missing
 *   pnpm phase2 -- --live    # regenerate with the configured model (or LIVE=1)
 *
 * The AI-CLI route does not use this script: your agent writes report.md
 * directly from the objective in docs/phase-2.md, then `pnpm phase2:check` validates it.
 */
import {
  OUTPUTS,
  createModel,
  describeLlm,
  generateMarkdown,
  loadComments,
  loadPersonas,
  loadPr,
  printCheck,
  readCache,
  readLlmConfig,
  shouldRunLive,
  writeCache,
} from '@workshop/shared';
import { REPORT_SYSTEM_PROMPT, buildReportUserPrompt } from './prompt.js';
import { validateReport } from './validate.js';

async function main() {
  const llm = readLlmConfig();
  const cachePath = OUTPUTS.phase2Report;
  const live = shouldRunLive(cachePath, llm !== null);
  const comments = loadComments();
  const ids = comments.map((c) => c.id);

  console.log(`Model: ${describeLlm(llm)}`);
  console.log(`Mode:  ${live ? 'LIVE (calling the model)' : 'CACHED (reading out/report.md)'}`);

  if (!live) {
    const cached = readCache(cachePath);
    if (!cached) {
      console.error('No cached report and no model configured. Set LLM_API_KEY (see README), or use your AI CLI (see docs/phase-2.md).');
      process.exit(1);
    }
    printCheck('Phase 2 · report.md (cached)', validateReport(cached, ids), [
      `${cached.split('\n').length} lines, ${cached.length} characters`,
    ]);
    return;
  }

  const personas = loadPersonas();
  const pr = loadPr();
  const started = Date.now();
  const report = await generateMarkdown({
    model: createModel(llm!),
    system: REPORT_SYSTEM_PROMPT,
    prompt: buildReportUserPrompt({ prTitle: pr.title, prBody: pr.body, personas, comments }),
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  writeCache(cachePath, report);
  console.log(`\nWrote ${cachePath} in ${seconds}s.`);
  printCheck('Phase 2 · report.md (fresh)', validateReport(report, ids), [
    `${report.split('\n').length} lines, ${report.length} characters`,
  ]);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
