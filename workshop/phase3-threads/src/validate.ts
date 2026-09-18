import { emptyResult, formatIssues, type CheckResult } from '@workshop/shared';
import { SEVERITY_ORDER, ThreadsOutputSchema, type Thread } from './schema.js';

export interface ThreadValidation {
  threads: Thread[] | null;
  result: CheckResult;
}

/**
 * The Phase 3 contract. Schema violations and id coverage are errors: the
 * renderer cannot trust anything that fails them. The rest is advice.
 */
export function validateThreads(raw: unknown, knownIds: Set<string>, prFiles: Set<string>): ThreadValidation {
  const result = emptyResult();
  const parsed = ThreadsOutputSchema.safeParse(raw);
  if (!parsed.success) {
    result.errors.push('does not match ThreadsOutputSchema:', ...formatIssues(parsed.error.issues).map((l) => `  ${l}`));
    return { threads: null, result };
  }
  const threads = parsed.data.threads;

  const seen = new Map<string, string>();
  for (const t of threads) {
    for (const id of t.source_comments) {
      if (!knownIds.has(id)) result.errors.push(`${t.id} references unknown comment ${id}`);
      const prior = seen.get(id);
      if (prior && prior !== t.id) result.errors.push(`${id} appears in both ${prior} and ${t.id}`);
      seen.set(id, t.id);
    }
    for (const f of t.files) {
      if (!prFiles.has(f)) result.warnings.push(`${t.id} lists a file not in the PR: ${f}`);
    }
  }
  const missing = [...knownIds].filter((id) => !seen.has(id));
  if (missing.length) result.errors.push(`${missing.length} comment id(s) not assigned to any thread: ${missing.join(', ')}`);

  const ids = threads.map((t) => t.id);
  const expected = threads.map((_, i) => `thr-${String(i + 1).padStart(3, '0')}`);
  if (ids.join() !== expected.join()) result.warnings.push('thread ids are not sequential thr-001, thr-002, …');

  for (let i = 1; i < threads.length; i += 1) {
    const prev = SEVERITY_ORDER[threads[i - 1]!.severity] ?? 99;
    const cur = SEVERITY_ORDER[threads[i]!.severity] ?? 99;
    if (cur < prev) {
      result.warnings.push('threads are not ordered from most to least severe');
      break;
    }
  }
  if (threads.length < 6 || threads.length > 15) {
    result.warnings.push(`${threads.length} threads; 8 to 12 is the sweet spot for a reviewer`);
  }
  return { threads, result };
}

export function describeThreads(threads: Thread[]): string[] {
  return threads.map(
    (t) => `${t.id}  ${t.severity.padEnd(8)} ${t.ui_hint.padEnd(9)} ${t.title}  (${t.source_comments.length} comments)`,
  );
}
