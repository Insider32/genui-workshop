import { z } from 'zod';

/**
 * Phase 3: the Thread. This schema is the pivot of the whole workshop.
 *
 * Up to now the model produced prose for a human. From here on it produces
 * data for a renderer. Everything the UI can do in Phase 3 and Phase 4 is
 * bounded by what this schema allows, which is why designing it is the
 * real skill.
 */

/** Phase 3, edit #1a: the severity ladder the model may use. */
export const ThreadSeverity = z.string(); // TODO(phase-3, edit #1a): constrain to an enum
export type ThreadSeverity = z.infer<typeof ThreadSeverity>;

export const ThreadCategory = z.enum(['security', 'architecture', 'correctness', 'tests', 'style', 'ops']);
export type ThreadCategory = z.infer<typeof ThreadCategory>;

export const ThreadStatus = z.enum(['open', 'resolved']);
export type ThreadStatus = z.infer<typeof ThreadStatus>;

/**
 * Phase 3, edit #1b: the UI hint.
 *
 * Planted here, unused until Phase 4. The model picks the *shape* of the
 * interaction each thread deserves; Phase 4 maps each hint to a widget.
 *
 *   diff       a concrete code change the author can accept or reject
 *   graph      a dependency or module-structure problem
 *   choice     competing approaches with tradeoffs, needs a decision
 *   chart      numbers worth seeing (coverage, counts)
 *   checklist  many small independent items to tick off
 *   file       several remarks about one file, best read in place
 *   custom     none of the above fits; a bespoke layout is warranted
 *   none       plain text is fine
 */
export const UiHint = z.string(); // TODO(phase-3, edit #1b): constrain to the shapes documented above
export type UiHint = z.infer<typeof UiHint>;

export const ThreadSchema = z.object({
  id: z.string().regex(/^thr-\d{3}$/).describe('Sequential id, thr-001, thr-002, ...'),
  title: z.string().min(8).max(90).describe('Short, specific, written as a statement of the problem'),
  category: ThreadCategory,
  severity: ThreadSeverity.describe('The highest severity among the source comments'),
  status: ThreadStatus.default('open'),
  source_comments: z
    .array(z.string().regex(/^c-\d{2}$/))
    .min(1)
    .describe('Every comment id folded into this thread. Each id appears in exactly one thread.'),
  files: z.array(z.string()).min(1).describe('Repo-relative paths this thread touches'),
  summary: z
    .string()
    .min(40)
    .describe('Two to four sentences a reviewer can act on without opening the comments'),
  suggested_actions: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('Concrete next steps, imperative mood'),
  ui_hint: UiHint,
});
export type Thread = z.infer<typeof ThreadSchema>;

export const ThreadsOutputSchema = z.object({
  threads: z.array(ThreadSchema).min(1),
});
export type ThreadsOutput = z.infer<typeof ThreadsOutputSchema>;

export const SEVERITY_ORDER: Record<string, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};
