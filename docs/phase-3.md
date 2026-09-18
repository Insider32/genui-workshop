# Phase 3 · Objective: from prose to data

**Time:** 25 minutes · `pnpm checkpoint phase-3-start`

## Why this phase matters

Until now the model wrote prose for a human. From here on it writes **data for a renderer**.
The input to this phase is the Phase 2 report, not the comments. The document written for you
is now read by a tool instead, and turned into a strict structure called a Thread: one thing to
decide or fix, with a title, a summary, suggested actions, the comment ids it folds in, the
files it touches, a severity, a category, and a `ui_hint`.

## Your objective

1. **Finish the contract.** In `workshop/phase3-threads/src/schema.ts`, `ThreadSeverity` and
   `UiHint` are plain strings. Turn them into enums: the severity ladder `critical`, `high`,
   `medium`, `low`, and the interaction shapes `diff`, `graph`, `choice`, `chart`, `checklist`,
   `file`, `custom`, `none`. Read the doc comment on `UiHint` first. In `prompt.ts`,
   `GROUPING_RULES` is empty; write down how 44 comments should fold into threads (see the rules
   below). Do these by hand or ask your agent; then `pnpm typecheck`.
2. **Produce the threads.** Use your AI CLI to turn `workshop/phase2-report/out/report.md` into
   `workshop/phase3-threads/out/threads.json` as `{ "threads": [ ... ] }`, each thread matching
   `ThreadSchema`. Every comment id appears in exactly one thread. Aim for 8 to 12 threads: one
   per decision or fix, not per file. All style nits from `nitpick-bot` go in one thread with
   `ui_hint: "checklist"`. Comments that only make sense as a sequence of deployment steps go in
   one thread with `ui_hint: "custom"`. Order from most to least severe, ids `thr-001`, `thr-002`, …
3. **Look at it.** `pnpm phase4` and open http://localhost:5174.

## Done when

`pnpm phase3:check` passes with no errors. It validates against the schema and reports every
comment id that is missing, duplicated, or unknown; it warns on ordering and odd thread counts.

In the app: filter to `critical` and `high`; resolve one thread and reload; expand *source
comments* on any thread and confirm nothing was lost. Notice the `ui_hint` badge on every card.
Nothing uses it yet.

## Stuck?

Ask a facilitator. The usual causes: the agent read `comments.json` instead of the report; it
output prose around the JSON; ids duplicated across threads; severity values outside the enum.
The check tells you which.

## Behind?

```sh
pnpm checkpoint phase-3-complete
```
