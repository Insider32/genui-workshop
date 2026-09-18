> **Facilitator reference prompt.** Participants write their own prompt from the objective in
> `docs/`. Hand this out only to unblock someone, or compare against it afterwards.

# Phase 4 · Fill the widgets

You are the model for Phase 4. Read `AGENTS.md` first.

In Phase 3 you chose a `ui_hint` per thread. Now you produce the props for the widget that hint
maps to. The app has a registry (`workshop/phase4-app/src/widgets/registry.ts`) mapping each
hint to a React component someone already wrote. You decide *what appears in it*.

## Step 1 · Register the checklist widget (code edit)

Open `workshop/phase4-app/src/widgets/registry.ts`. The `checklist` line is commented out.
Uncomment it so `checklist: ChecklistWidget,` is in the table. Run `pnpm typecheck`.

## Step 2 · Produce the widget props

**Input:**
- `workshop/phase3-threads/out/threads.json` — the threads and their `ui_hint`
- `fixtures/comments.json` — the full text of each thread's `source_comments`
- `fixtures/pr-files.json` — `head` is the current content of every changed file

**Contract:** `workshop/phase4-app/src/widgets/schema.ts`. One schema per hint. Read the
`describe()` strings; they are the spec.

**Output:** write **`workshop/phase4-app/src/data/widgets.json`** (overwrite it): an object
keyed by thread id, one entry for every thread whose `ui_hint` is not `none`, each entry
matching the schema for that thread's hint (`kind` equals the hint).

Rules per kind:

- `diff` — one hunk per concrete fix. `original` must be a **verbatim** contiguous excerpt
  (3 to 25 lines) copied from that file's `head` in `pr-files.json`; `proposed` replaces exactly
  that excerpt; `comment_ids` are the thread's comments the hunk addresses.
- `graph` — nodes are API modules (`routes/*`, `store/*`, `lib/*`, the provider client, and any
  proposed `services/*`); derive edges from the `import` lines in the file contents; mark the
  problem edges the comments name; fill `proposed` if the comments propose a refactor.
- `choice` — one option per approach the comments discuss, plus at most one obvious alternative;
  exactly one `recommended: true`, following the reviewers' stated preference.
- `chart` — every number the comments give; `before: null` for files new in this PR; the overall
  PR figure goes in `headline`.
- `checklist` — one item per source comment, in file order; `text` is the fix as an instruction;
  `autofix` only when a formatter or trivial codemod could do it.
- `file` — the one file the comments concentrate on; one annotation per comment at the line it
  was left on, condensed to one or two sentences.
- `custom` — see `facilitator/prompts/phase-4-finale.md`. For now you may leave this thread out; the check
  will report it as an error until the finale.

## Verify

Run `pnpm phase4:check`. Beyond the schema it checks that diff originals are really in the file,
that graph edges point at real nodes, and that file annotations are within the file. Fix until
only the `custom` thread is reported (or nothing, if you did the finale already).

Run `pnpm phase4` and walk the attendee through the threads from the top. Expand the nits
thread and press **Resolve all 17**.
