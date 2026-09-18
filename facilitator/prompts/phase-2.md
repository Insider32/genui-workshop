> **Facilitator reference prompt.** Participants write their own prompt from the objective in
> `docs/`. Hand this out only to unblock someone, or compare against it afterwards.

# Phase 2 · Produce the Markdown report

You are the model for Phase 2. Read `AGENTS.md` first.

## Input

- `fixtures/comments.json` — 44 review comments with id, author, category, severity, path, line, body
- `fixtures/pr.json` — the pull request title and description
- `fixtures/personas.json` — the four review bots

## Output

Write **`workshop/phase2-report/out/report.md`** (overwrite it). One complete Markdown
document with these sections, in order:

1. **Overview** — what the PR does, how many comments there are, one paragraph on the overall state.
2. **By file** — a level-3 heading per file that has comments, files in alphabetical order.
   Under each, every comment on that file in line order, each with: the bot name, the severity,
   the line number, the comment id in square brackets (for example `[c-07]`), and the full
   substance of the comment. Preserve code blocks and suggestions exactly. Do not merge, drop,
   or shorten any comment.
3. **Cross-cutting themes** — group related comments across files into themes and explain how
   they connect. Reference ids in square brackets.
4. **Where to start** — an ordered list of what the author should tackle first and why.
5. **Statistics** — counts by bot, by category, by severity, as tables.

Write in complete sentences. Be thorough rather than brief; this phase is deliberately verbose.
Do not invent comments. Every one of the 44 ids must appear in `[c-NN]` form.

## Verify

Run `pnpm phase2:check`. Fix the report until it passes.

## Then, mirror what you did into code

Open `workshop/phase2-report/src/prompt.ts` and replace the placeholder `REPORT_SYSTEM_PROMPT`
with the instructions you actually followed above, so the API-key route produces the same shape
of report. Run `pnpm typecheck`.

Finally tell the attendee: how long the report is, and one thing a reader still cannot do with
it (hint: they cannot act on it).
