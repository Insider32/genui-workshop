# Phase 2 · Objective: the markdown wall

**Time:** 10 minutes · `pnpm checkpoint phase-2-start`

## Your objective

Use your AI CLI to turn the 44 review comments into **one complete, organised Markdown review
of the PR**. You write the prompt. This is the interface most people have with AI today: a very
good document. Make it a good one, and make it long enough that nothing is lost.

## Inputs

- `fixtures/comments.json` — the 44 comments: id, author, category, severity, path, line, body
- `fixtures/pr.json` — the PR title and description
- `fixtures/personas.json` — the four bots

## Output

`workshop/phase2-report/out/report.md`. A cached example is already there; overwrite it.

## Done when

`pnpm phase2:check` passes. It fails if any comment id is missing in `[c-NN]` form, and warns if
the report lacks an overview, a by-file section, cross-cutting themes, a where-to-start list, or
statistics, or if it is under 200 lines.

Then read what your agent wrote and answer one question: **what can a reader not do with this
document?**

## Bonus

At this checkpoint `REPORT_SYSTEM_PROMPT` in `workshop/phase2-report/src/prompt.ts` is a
one-line placeholder. Put the instructions you gave your agent in there, so the API-key route
(`pnpm phase2 -- --live`) produces the same shape of report. `pnpm typecheck` afterwards.

## Stuck?

Ask a facilitator. The usual causes: the agent summarised instead of preserving every comment;
it dropped ids or wrote them without brackets; it wrote to a different path. Tell it exactly
where to write and what "done" means.

## Behind?

```sh
pnpm checkpoint phase-2-complete
```
