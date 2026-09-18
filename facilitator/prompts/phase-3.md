> **Facilitator reference prompt.** Participants write their own prompt from the objective in
> `docs/`. Hand this out only to unblock someone, or compare against it afterwards.

# Phase 3 · Turn the report into threads

You are the model for Phase 3. Read `AGENTS.md` first. This is the pivot of the workshop:
until now the output was prose for a human. From here on it is data for a renderer.

## Step 1 · Finish the contract (code edit)

Open `workshop/phase3-threads/src/schema.ts`.

- `ThreadSeverity` is a plain `z.string()`. Replace it with `z.enum(['critical', 'high', 'medium', 'low'])`.
- `UiHint` is a plain `z.string()`. Replace it with
  `z.enum(['diff', 'graph', 'choice', 'chart', 'checklist', 'file', 'custom', 'none'])`.
  Read the doc comment above it: each value is a *shape of interaction*, not a visual.

Open `workshop/phase3-threads/src/prompt.ts` and write `GROUPING_RULES` (it is empty):

- one thread per decision or fix, not per file and not per comment; aim for 8 to 12 threads
- comments that argue about the same design question belong together even across files
- fold every style comment from `nitpick-bot` into one thread with `ui_hint: "checklist"`
- comments that only make sense as a sequence of deployment steps go into one thread with `ui_hint: "custom"`
- a thread's severity is the highest among its comments; its category is the category of its most severe comment
- every comment id appears in exactly one thread

Run `pnpm typecheck`.

## Step 2 · Produce the threads

**Input:** `workshop/phase2-report/out/report.md`. Read the report, **not** `fixtures/comments.json`.
The report was written for a human; you are the tool that reads it instead.

**Output:** write **`workshop/phase3-threads/out/threads.json`** (overwrite it) as
`{ "threads": [ ... ] }` where each thread matches `ThreadSchema` in `schema.ts`: `id`
(`thr-001`, `thr-002`, … in order), `title`, `category`, `severity`, `status: "open"`,
`source_comments`, `files`, `summary` (two to four actionable sentences), `suggested_actions`
(one to five, imperative), and `ui_hint`.

Choosing `ui_hint`: `diff` when the report contains concrete replacement code; `choice` when it
lays out competing approaches; `graph` for module or dependency structure; `chart` when the
substance is numbers; `file` when several remarks concern one file and are best read in place;
`checklist` for the nits; `custom` only when nothing else fits the shape of the content; `none`
when plain text is fine.

Order threads from most to least severe. Follow your own `GROUPING_RULES`.

## Verify

Run `pnpm phase3:check`. It validates against the schema and reports every comment id that is
missing, duplicated, or unknown. Fix the JSON until it passes with no errors.

Then tell the attendee to run `pnpm phase4` and open http://localhost:5174: the app renders the
threads you just wrote. Point out the `ui_hint` badge on each card and that nothing uses it yet.
