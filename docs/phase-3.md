# Phase 3 · The pivot: Threads

**Time:** 25 minutes · **Format:** two edits, then run and explore

## The one idea

Up to now the model wrote prose for a human. From here on it writes **data for a renderer**.

The input to this phase is the Phase 2 report. Not the comments. The markdown that was written
for you is now read by a tool instead, and turned into a strict JSON structure called a Thread:

```json
{
  "id": "thr-002",
  "title": "Token storage and refresh strategy need one decision",
  "category": "security",
  "severity": "high",
  "status": "open",
  "source_comments": ["c-02", "c-07", "c-08", "c-18"],
  "files": ["apps/weather-web/src/auth/AuthContext.tsx", "..."],
  "summary": "Four comments describe one design question. ...",
  "suggested_actions": ["Choose one of the storage and refresh approaches", "..."],
  "ui_hint": "choice"
}
```

A thread is one thing to decide or fix. 44 comments become 11 threads.

## Edit 1 · Fill in the enums

Open `workshop/phase3-threads/src/schema.ts`. At `phase-3-start` two enums are stubs:

- `ThreadSeverity` — add the ladder: `critical`, `high`, `medium`, `low`
- `UiHint` — add the interaction shapes: `diff`, `graph`, `choice`, `chart`, `checklist`, `file`, `custom`, `none`

Read the doc comment on `UiHint`. It is planted here and **unused in this phase**. Notice that
the descriptions are about the *shape of the interaction*, not about visuals.

## Edit 2 · Write the grouping rules

Open `workshop/phase3-threads/src/prompt.ts`. `GROUPING_RULES` is empty at the start checkpoint.
Write rules such as:

- one thread per decision or fix, not per file, not per comment
- fold every style nit into one thread with `ui_hint: "checklist"`
- comments that only make sense as a sequence of steps go together with `ui_hint: "custom"`
- every comment id appears in exactly one thread

## Run it

```sh
pnpm phase3                 # cached: prints the 11 threads and id coverage
LIVE=1 pnpm phase3          # with a key: regenerate from the Phase 2 report
```

The script validates the output against the schema and reports every comment id that was
dropped or duplicated. That report is the point: **the schema is the contract**, and a
violation is caught before anything renders.

## Look at it

```sh
pnpm phase4
```

Open http://localhost:5174. At this checkpoint the app is a plain thread list: collapsible
cards, filters by severity, category and status, a resolve button. No widgets yet. Even so,
compare it with the Phase 2 scroll:

- filter to `critical` and `high`: seven things to look at instead of 44
- resolve the password hashing thread; the count updates; it stays resolved on reload
- expand *source comments* on any thread: nothing was lost, the originals are one click away

The `ui_hint` badge on each card is the cliffhanger. The model already said what kind of
interface each thread wants. Nothing is listening yet.

## Talking points

- Schema design is the real skill in this phase. The `describe()` strings on each field are
  prompt engineering that lives next to the type.
- The `source_comments` array is what makes this trustworthy: every thread is traceable back
  to the raw input, and the script checks the trace is complete.
- Ask: what other fields would you add? Owner? Estimated effort? Blocking or not?

## If you fall behind

```sh
git checkout phase-3-complete
```
