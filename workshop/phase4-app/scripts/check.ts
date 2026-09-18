/**
 * pnpm phase4:check — validate workshop/phase4-app/src/data/widgets.json
 */
import { existsSync } from 'node:fs';
import { OUTPUTS, loadComments, loadPrFiles, printCheck, readJson } from '@workshop/shared';
import { ThreadsOutputSchema } from '@workshop/phase3-threads/schema';
import { PRIMITIVES } from '../src/ui-tree/primitives';
import { validateWidgets } from './validate';

if (!existsSync(OUTPUTS.phase4Widgets)) {
  console.error(`No widgets at ${OUTPUTS.phase4Widgets}. Produce them first (see docs/phase-4.md).`);
  process.exit(1);
}
const threads = ThreadsOutputSchema.parse(readJson(OUTPUTS.phase3Threads)).threads;
const result = validateWidgets({
  raw: readJson(OUTPUTS.phase4Widgets),
  threads,
  comments: loadComments(),
  files: loadPrFiles(),
  primitives: Object.keys(PRIMITIVES),
});
const ok = printCheck(
  'Phase 4 · widgets.json',
  result,
  threads.map((t) => `${t.id}  ${t.ui_hint.padEnd(9)} ${t.title}`),
);
process.exit(ok ? 0 : 1);
