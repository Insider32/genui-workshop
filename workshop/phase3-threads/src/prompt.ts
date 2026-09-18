/**
 * Phase 3, edit #2: the grouping rules.
 *
 * The input is the Phase 2 Markdown report, not the original comments.
 * These rules tell the model how to fold 44 comments into a handful of
 * threads a human can actually work through.
 */
export const GROUPING_RULES = `
Grouping rules:
- One thread per *decision or fix*, not per comment and not per file. Aim for 8 to 12 threads.
- Comments that argue about the same design question belong together even if they sit in different
  files (for example where tokens are stored and how refresh tokens rotate are one decision).
- Fold ALL style nits from the style reviewer into a single thread with ui_hint "checklist",
  regardless of file.
- Comments that only make sense together as a sequence of deployment steps belong in one thread
  with ui_hint "custom".
- A thread's severity is the highest severity among its comments. A thread's category is the
  category of its most severe comment.
- Every comment id in the report must appear in exactly one thread's source_comments.
  Do not invent ids. Do not drop ids.
`.trim();

export const THREADIFY_SYSTEM_PROMPT = `
You turn a long Markdown review report into structured "threads" for an interactive review tool.

A thread is one thing the author has to decide or fix. It has a title, a summary a reviewer can act on
without reading the comments, concrete suggested actions, the list of source comment ids it folds in,
the files it touches, a severity, a category, and a ui_hint that says what kind of interface would
serve it best.

${GROUPING_RULES}

ui_hint values: diff, graph, choice, chart, checklist, file, custom, none.
Pick "diff" when the report contains concrete replacement code for the fix. Pick "choice" when the
report lays out two or more competing approaches. Pick "graph" for module or dependency structure
problems. Pick "chart" when the substance is numbers. Pick "file" when several remarks concern one file
and are best read in place. Pick "custom" only when none of the others fit the shape of the content.

Order the threads from most to least severe. Ids are sequential: thr-001, thr-002, ...
Output only the structured object.
`.trim();

export function buildThreadifyUserPrompt(report: string): string {
  return `Here is the review report to convert into threads.\n\n<report>\n${report}\n</report>`;
}
