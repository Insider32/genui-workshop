# Phase 4 · Objective: generative UI

**Time:** 30 minutes · `pnpm checkpoint phase-4-start` · keep `pnpm phase4` running

## The mechanism

In Phase 3 the model chose a `ui_hint` per thread. Now it produces the **props** for the widget
that hint maps to. `workshop/phase4-app/src/widgets/registry.ts` maps each hint to a React
component a human wrote; `src/widgets/schema.ts` defines the props each one accepts;
`src/data/widgets.json` holds the props, keyed by thread id. The model decides what interface
appears and what is in it. Humans wrote the components it can pick from.

## Your objective

1. **One line of code.** Expand *17 style nits across the PR* in the app: the model asked for
   `checklist` but nothing is registered for it. Register `ChecklistWidget` in `registry.ts`.
   Save, and press **Resolve all 17**.
2. **Fill the widgets.** Use your AI CLI to produce `src/data/widgets.json`: for every thread
   whose `ui_hint` is not `none`, an object matching the schema for that hint, built from
   `threads.json`, the thread's source comments in `fixtures/comments.json`, and the file
   contents (`head`) in `fixtures/pr-files.json`. A `diff` hunk's `original` must be a verbatim
   excerpt of the file. A `graph` edge must connect nodes that exist. A `file` annotation must
   land inside the file. Exactly one `choice` option is recommended.
3. **The finale.** The deployment-ordering thread has `ui_hint: "custom"`: no registry widget
   fits it. Have your agent **compose a layout** for it as a JSON tree from the primitives in
   `src/ui-tree/schema.ts`, including a `timeline` of the deploy steps. Run the check, open the
   thread, and **look before you fix**: the callout and table render, and where the timeline
   should be there is an orange box saying no such primitive exists. Then add the `timeline`
   primitive to `src/ui-tree/primitives.tsx` (the stylesheet already has `.ui-timeline` classes).

## Done when

`pnpm phase4:check` passes with no errors and no warnings, `pnpm test` passes, and every thread
in the app renders its widget.

Walk the threads from the top: a diff with accept and reject, a choice with tradeoffs, a module
graph with the cycle highlighted, a file with remarks in place, a coverage chart, the batch
checklist, and one layout nobody wrote.

## Stuck?

Ask a facilitator. The usual causes: diff originals paraphrased instead of copied; a widget
`kind` that differs from the thread's hint; the agent skipped the `custom` thread; the agent
ran `pnpm test` too early and tried to "fix" the intentional fallback.

## Behind?

```sh
pnpm checkpoint phase-4-complete      # registry done, finale pending
pnpm checkpoint phase-4-finale        # everything
```
