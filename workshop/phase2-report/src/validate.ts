import { emptyResult, type CheckResult } from '@workshop/shared';

const REQUIRED_SECTIONS = ['overview', 'by file', 'themes', 'where to start', 'statistics'];

/**
 * The Phase 2 contract is loose on purpose: prose for a human. The only hard
 * rule is that every comment id survives, because Phase 3 reads this text.
 */
export function validateReport(report: string, commentIds: string[]): CheckResult {
  const result = emptyResult();
  const missing = commentIds.filter((id) => !report.includes(`[${id}]`));
  if (missing.length) {
    result.errors.push(`${missing.length} comment id(s) missing in [c-NN] form: ${missing.join(', ')}`);
  }
  const headings = report
    .split('\n')
    .filter((l) => /^#{1,3}\s/.test(l))
    .map((l) => l.replace(/^#+\s*/, '').toLowerCase());
  for (const section of REQUIRED_SECTIONS) {
    if (!headings.some((h) => h.includes(section))) {
      result.warnings.push(`no heading containing "${section}"`);
    }
  }
  const lines = report.split('\n').length;
  if (lines < 200) result.warnings.push(`only ${lines} lines; this phase is meant to be verbose`);
  return result;
}
