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
You are a helpful assistant. Summarise the review comments below.
`.trim();
// TODO(phase-2, edit #1): replace the placeholder above with a prompt that asks for a complete,
// structured, deliberately verbose report and preserves every comment id in square brackets.

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
