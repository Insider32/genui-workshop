/**
 * Every phase has a `check` script that validates the phase's output file
 * against its contract, so an attendee (or their AI agent) can iterate until
 * it passes. Errors fail the check; warnings are advice.
 */
export interface CheckResult {
  errors: string[];
  warnings: string[];
}

export function emptyResult(): CheckResult {
  return { errors: [], warnings: [] };
}

export function printCheck(title: string, result: CheckResult, notes: string[] = []): boolean {
  console.log(`\n${title}`);
  for (const n of notes) console.log(`  · ${n}`);
  for (const w of result.warnings) console.log(`  ⚠ ${w}`);
  for (const e of result.errors) console.log(`  ✖ ${e}`);
  const ok = result.errors.length === 0;
  console.log(
    ok
      ? `\nPASS · ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`
      : `\nFAIL · ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}, ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`,
  );
  return ok;
}

/** Format zod issues as `path: message` lines. */
export function formatIssues(issues: Array<{ path: PropertyKey[]; message: string }>): string[] {
  return issues.slice(0, 25).map((i) => `${i.path.map(String).join('.') || '(root)'}: ${i.message}`);
}
