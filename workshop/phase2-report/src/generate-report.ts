/**
 * Phase 2: comments in, one big Markdown report out.
 *
 *   pnpm phase2            # uses the cached out/report.md unless it is missing
 *   LIVE=1 pnpm phase2     # regenerate with the configured model
 *
 * Phase 2, edit #2: flip the toggle. Run it cached first, then set LIVE=1
 * with your own key and compare the two reports.
 */
import {
  OUTPUTS,
  createModel,
  describeLlm,
  generateMarkdown,
  loadComments,
  loadPersonas,
  loadPr,
  readCache,
  readLlmConfig,
  shouldRunLive,
  writeCache,
} from '@workshop/shared';
import { REPORT_SYSTEM_PROMPT, buildReportUserPrompt } from './prompt.js';

async function main() {
  const llm = readLlmConfig();
  const cachePath = OUTPUTS.phase2Report;
  const live = shouldRunLive(cachePath, llm !== null);

  console.log(`Model: ${describeLlm(llm)}`);
  console.log(`Mode:  ${live ? 'LIVE (calling the model)' : 'CACHED (reading out/report.md)'}`);

  if (!live) {
    const cached = readCache(cachePath);
    if (!cached) {
      console.error('No cached report and no model configured. Set LLM_API_KEY (see .env.example).');
      process.exit(1);
    }
    console.log(`\n${cached.split('\n').length} lines, ${cached.length} characters.`);
    return;
  }

  const comments = loadComments();
  const personas = loadPersonas();
  const pr = loadPr();

  const started = Date.now();
  const report = await generateMarkdown({
    model: createModel(llm!),
    system: REPORT_SYSTEM_PROMPT,
    prompt: buildReportUserPrompt({ prTitle: pr.title, prBody: pr.body, personas, comments }),
  });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);

  const missing = comments.map((c) => c.id).filter((id) => !report.includes(id));
  writeCache(cachePath, report);

  console.log(`\nWrote ${cachePath}`);
  console.log(`${report.split('\n').length} lines, ${report.length} characters, ${seconds}s.`);
  if (missing.length > 0) {
    console.warn(`Warning: ${missing.length} comment ids did not survive into the report: ${missing.join(', ')}`);
  } else {
    console.log('All comment ids preserved.');
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
