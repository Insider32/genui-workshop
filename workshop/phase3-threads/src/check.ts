/**
 * pnpm phase3:check — validate workshop/phase3-threads/out/threads.json
 */
import { existsSync } from 'node:fs';
import { OUTPUTS, loadComments, loadPr, printCheck, readJson } from '@workshop/shared';
import { describeThreads, validateThreads } from './validate.js';

if (!existsSync(OUTPUTS.phase3Threads)) {
  console.error(`No threads at ${OUTPUTS.phase3Threads}. Produce them first (see docs/phase-3.md).`);
  process.exit(1);
}
const knownIds = new Set(loadComments().map((c) => c.id));
const prFiles = new Set(loadPr().files);
const { threads, result } = validateThreads(readJson(OUTPUTS.phase3Threads), knownIds, prFiles);
const ok = printCheck('Phase 3 · threads.json', result, threads ? describeThreads(threads) : []);
process.exit(ok ? 0 : 1);
