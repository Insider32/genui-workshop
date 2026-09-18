/**
 * pnpm phase2:check — validate workshop/phase2-report/out/report.md
 */
import { OUTPUTS, loadComments, printCheck, readCache } from '@workshop/shared';
import { validateReport } from './validate.js';

const report = readCache(OUTPUTS.phase2Report);
if (!report) {
  console.error(`No report at ${OUTPUTS.phase2Report}. Produce it first (see docs/phase-2.md).`);
  process.exit(1);
}
const ids = loadComments().map((c) => c.id);
const ok = printCheck('Phase 2 · report.md', validateReport(report, ids), [
  `${report.split('\n').length} lines, ${report.length} characters`,
  `${ids.length} comment ids expected`,
]);
process.exit(ok ? 0 : 1);
