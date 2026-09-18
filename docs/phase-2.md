# Phase 2 · The markdown wall

**Time:** 10 minutes · **Format:** run it, then two edits

## What happens

One LLM call. The 44 comments go in as text; an organised, exhaustive Markdown report comes
out. This is the interface most people have with AI today: a very good document.

```sh
pnpm phase2
```

Without an API key this prints the cached report from `workshop/phase2-report/out/report.md`.
Open that file. It is ~450 lines: an overview, every comment regrouped by file, cross-cutting
themes, a *Where to start* list, statistics.

## Talking points

- **Synthesis happened.** The themes section genuinely connects comments across files. The
  *Where to start* list is a reasonable plan.
- **The interface is still a scroll.** You cannot filter it, act on it, or mark anything done.
  If you fix the password hashing, the report does not know.
- The verbosity is deliberate. Asking for brevity would lose comments, and losing comments is
  worse than length. Length is the cost of completeness in prose.
- One detail that matters later: every comment id (`[c-01]` … `[c-44]`) survives in the text.
  The prompt insists on it. Phase 3 will depend on it.

## Edit 1 · Write the system prompt

Open `workshop/phase2-report/src/prompt.ts`. At the `phase-2-start` checkpoint,
`REPORT_SYSTEM_PROMPT` is a one-line placeholder. Write the prompt:

- what sections to produce (overview, by file, themes, where to start, statistics)
- what must be preserved (every comment, its id in square brackets, the bot name, the severity)
- the tone (complete sentences, thorough over brief)

The complete version at `phase-2-complete` is one reference answer, not the only one.

## Edit 2 · Flip the toggle

With a key in `.env`:

```sh
LIVE=1 pnpm phase2
```

The script prints the model, the time taken, and whether all 44 ids survived. Compare the fresh
report with the cached one. Different words, same shape. That stability is what makes the next
phase possible.

## If you fall behind

```sh
git checkout phase-2-complete
```
