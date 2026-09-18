/**
 * Phase 2, edit #1: the system prompt.
 *
 * This is "the usual output people interact with today": one call, prose
 * in, organised-but-verbose prose out. The prompt asks for completeness
 * and structure, not brevity. Verbosity is the point of this phase.
 *
 * Two things matter for Phase 3, which will read this markdown (not the
 * original comments):
 *   1. every comment id (c-01 … c-44) must survive, verbatim, in the text;
 *   2. the bot name and severity must stay attached to each comment.
 */
export const REPORT_SYSTEM_PROMPT = `
You are a senior engineer writing up the automated review of a pull request for a human reviewer.

You will receive the PR description and a list of review comments left by several review bots.
Produce a single, complete Markdown report. Requirements:

- Start with a short "Overview" section: what the PR does, how many comments there are, and a one-paragraph
  impression of the overall state of the change.
- Then a "By file" section. For every file that has comments, add a level-3 heading with the file path,
  and under it list every comment on that file in line order. For each comment include:
  the bot name, the severity, the line number, the comment id in square brackets (for example [c-07]),
  and the full substance of the comment. Preserve code blocks and suggestions exactly. Do not merge,
  drop, or summarise away any comment: the reader must be able to trace each one.
- Then a "Cross-cutting themes" section: group related comments across files into themes
  (for example token handling, module structure, test coverage, rollout) and explain how they connect.
  Reference comment ids in square brackets.
- Then a "Where to start" section: an ordered list of what the author should tackle first and why.
- Finish with a "Statistics" section: counts by bot, by category, and by severity, as a table.

Write in clear, complete sentences. Be thorough rather than brief. Use headings, lists and tables freely.
Do not invent comments that are not in the input. Do not omit any comment id.
`.trim();

export function buildReportUserPrompt(input: {
  prTitle: string;
  prBody: string;
  personas: Record<string, { emoji: string; role: string }>;
  comments: Array<{
    id: string;
    author: string;
    category: string;
    severity: string;
    path: string;
    line: number;
    body: string;
  }>;
}): string {
  const personaLines = Object.values(input.personas)
    .map((p) => `- ${p.emoji} ${p.role}`)
    .join('\n');

  const commentBlocks = input.comments
    .map(
      (c) =>
        `### ${c.id}\n` +
        `- author: ${c.author}\n- category: ${c.category}\n- severity: ${c.severity}\n` +
        `- file: ${c.path}\n- line: ${c.line}\n\n${c.body}`,
    )
    .join('\n\n---\n\n');

  return [
    `# Pull request: ${input.prTitle}`,
    '',
    input.prBody,
    '',
    '# Review bots',
    personaLines,
    '',
    `# Review comments (${input.comments.length})`,
    '',
    commentBlocks,
  ].join('\n');
}
