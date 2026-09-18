# Facilitator guide

Participants get an **objective** per phase (`docs/phase-N.md`) and write their own prompts to
their AI CLI. You unblock, you narrate, you do not hand out prompts unless someone is stuck.
Reference prompts that produce a passing result are in `facilitator/prompts/`.

## Run of show · 90 minutes

| Minutes | Segment |
|---|---|
| 0–10 | Framing: the thesis, the four levels, "the data never changes, only the interface does" |
| 10–15 | Phase 1: the PR on the projector; participants clone |
| 15–25 | Phase 2: participants prompt; you show one report on the projector |
| 25–50 | Phase 3: the pivot; the schema; participants prompt; the app in plain mode |
| 50–80 | Phase 4: registry, widgets, the finale beat |
| 80–90 | Discussion |

Before the event: `pnpm install && pnpm typecheck && pnpm test` at `phase-4-finale`, and a
full pass of the phases yourself with your own agent. The cached outputs in the repo were
hand-authored; regenerate them with a real model if you want authentic examples
(`pnpm phase2 -- --live && pnpm phase3 -- --live && pnpm phase4:widgets -- --live`, then the
three checks and `pnpm test`).

## Phase 1 · talking points

- High fidelity, zero synthesis. Every comment is precise and anchored. Where do you start?
- The one critical issue (unsalted SHA-256 in `password.ts`) sits visually equal to an `!important`.
- Token storage (`AuthContext.tsx`), token lifetime (`config.ts`) and refresh rotation
  (`routes/auth.ts`) are one decision spread over three files.
- Three comments are about deploy ordering, not code.
- The comments are fixtures (`fixtures/comments.json`) posted by `tools/seed-pr`. Do not spend
  time on that; participants do not need it.

## Phase 2 · what to expect

- Most agents produce a decent report on the first try; the check catches dropped ids.
- Show two participants' reports side by side: different words, same shape. That stability is
  what Phase 3 relies on.
- Talking point: synthesis happened, the interface is still a scroll. You cannot filter, act, or
  mark anything done. Fix the hashing and the document does not know.
- Unblockers: "tell it the exact output path"; "tell it every id must appear in square
  brackets"; "ask for thorough, not brief". Reference: `facilitator/prompts/phase-2.md`.

## Phase 3 · what to expect

- The enum edit is the moment the model's freedom gets bounded. Say so. `describe()` strings are
  prompt engineering that lives next to the type.
- Common stumbles: the agent reads `comments.json` because it is "cleaner" (rule 4 in
  `AGENTS.md`); severity values like `blocker`; a thread per file; prose wrapped around the JSON.
  `pnpm phase3:check` names the problem every time.
- Show the app in plain mode. Filter to critical and high. Resolve one. Point at the `ui_hint`
  badge: the model already said what interface each thread wants. Nothing is listening yet.
- Ask: what other fields would you add? Owner, effort, blocking?
- Reference: `facilitator/prompts/phase-3.md`.

## Phase 4 · what to expect

- The one-line registry edit is the crowd-pleaser: 17 nits, one click. Emphasise that the only
  human decision was *that this widget exists*.
- `pnpm phase4:check` is where agents struggle: `diff` originals must be verbatim. Let them
  iterate; the failure message is specific. This is the discussion point about schema validation
  being necessary and not sufficient.
- **The finale beat.** When the `custom` tree renders, stop the room before anyone adds the
  primitive: the callout and table are there, and an orange box says `timeline` is not
  registered. The model asked for something the renderer does not have, and the system degraded
  visibly instead of crashing. Then add the primitive and reload.
- Unblockers: "copy `original` from `pr-files.json` head, do not retype"; "`kind` must equal the
  thread's `ui_hint`"; "do not run `pnpm test` before the finale". References:
  `facilitator/prompts/phase-4.md`, `facilitator/prompts/phase-4-finale.md`.

## Discussion prompts

- Registry vs JSON tree vs freeform code: reliable and boring, generative in composition but
  bounded, truly generative and fragile. Where does your product want to sit?
- Schema design is the skill. Every enum and `describe()` in this repo is a decision about what
  the model may say. Prompts came second.
- Where it breaks: compare two `widgets.json` files. What checks would you add to the validator?
- Latency: a registry pick is instant, props take a minute, a composed tree longer. Caching is
  the architecture, not an optimisation.

## Logistics

- **Checkpoints.** `pnpm checkpoint <tag>` runs `git checkout -f` then `pnpm install`. It discards
  participants' outputs on purpose: a regenerated `threads.json` will not match the next tag's
  `widgets.json`. Tell them to stash if they want to keep work.
- **Render test.** `pnpm --filter @workshop/phase4-app test` fails by design at `phase-4-start`
  and `phase-4-complete`. `AGENTS.md` tells agents not to run it before the finale.
- **API-key route.** For your projector demo, or participants without a CLI: `--live` on the
  three generating scripts (see README). A spend-capped fallback key can be handed out and
  revoked after the event.
- **Seeding the PR.** Already done. If you fork the workshop: `pnpm seed:pr -- --dry-run`, then
  `pnpm seed:pr -- --push` from a machine logged into `gh`. `pnpm fixtures:snapshot` refreshes the
  file snapshot after changes to the PR branch.
- **Rebuilding checkpoints.** Edit the final tree, then rebuild the linear history with stubs
  swapped in at each start tag. Each tag must carry its own lockfile and pass typecheck and its
  phase check.
