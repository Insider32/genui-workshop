> **Facilitator reference prompt.** Participants write their own prompt from the objective in
> `docs/`. Hand this out only to unblock someone, or compare against it afterwards.

# Phase 4 finale · Compose a layout nobody wrote

You are the model for the finale. Read `AGENTS.md` first.

One thread has `ui_hint: "custom"`: the deployment-ordering thread. No registry widget fits it.
Instead of picking a component, you **compose a layout** out of primitives, as a JSON tree.

## Step 1 · Compose the tree

**Vocabulary:** `workshop/phase4-app/src/ui-tree/schema.ts`. Read `UI_PRIMITIVE_DOCS` and
`UINodeSchema`. The primitives are `stack`, `heading`, `text`, `badge`, `callout`, `card`,
`table`, `divider`, `button`, and `timeline`.

**Input:** the `custom` thread in `workshop/phase3-threads/out/threads.json` and the full text of
its `source_comments` in `fixtures/comments.json`.

**Output:** add (or replace) the entry for that thread in
**`workshop/phase4-app/src/data/widgets.json`**: `{ "kind": "custom", "tree": <UINode> }`.

Guidance: a risk wants a `callout`; an ordered sequence of steps wants a `timeline` with an
`owner` per step; a comparison wants a `table`; finish with a `button` whose action is
`{ "type": "resolve" }`. Use the primitive that fits the content, not the most primitives. Keep
it under 12 nodes.

## Step 2 · Verify, and read the warning

Run `pnpm phase4:check`. It should pass, with a warning that `timeline` is not registered in
`ui-tree/primitives.tsx`. Open the app: the callout and table render, and where the timeline
should be there is an orange box saying no such primitive exists. **Show the attendee this
before fixing it.** It is the honest moment of the workshop: the model asked for something the
renderer does not have, and the system degraded visibly instead of crashing.

## Step 3 · Add the primitive (code edit)

Open `workshop/phase4-app/src/ui-tree/primitives.tsx` and add a `timeline` entry to `PRIMITIVES`,
next to the `// TODO(phase-4 finale)` comment. It receives `node.steps` (each with `title`,
`description`, `status` of `done | pending | blocked`, optional `owner`) and should render an
ordered list with a status marker per step. The stylesheet already has `.ui-timeline`,
`.marker`, `.marker.done|pending|blocked`, `.step-title`, `.step-owner`, `.step-desc` classes.

Run `pnpm typecheck`, `pnpm phase4:check` (no warning now), and `pnpm test`. Reload the app.

Then ask the attendee the discussion question: the registry was reliable and boring, this tree
is generative in composition but bounded by a vocabulary, and a model emitting raw code would be
truly generative and fragile. Where on that line does their product want to be?
