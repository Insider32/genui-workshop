# Phase 4 · Generative UI inside threads

**Time:** 30 minutes · **Format:** one edit, a tour, then the finale edit

## The mechanism

Three files carry the whole idea:

- `workshop/phase4-app/src/widgets/schema.ts` — one props schema per `ui_hint`
- `workshop/phase4-app/scripts/widgetize.ts` — per thread, asks the model to fill the props for
  the hint it chose in Phase 3, validated against that schema
- `workshop/phase4-app/src/widgets/registry.ts` — a table: hint → React component

The model chose the widget (Phase 3) and produced its props (widgetize). The registry only
renders. That is the generative claim, stated precisely: **the model decides what interface
appears and what is in it; humans wrote the components it can pick from.**

```sh
pnpm phase4:widgets                       # cached
LIVE=1 pnpm phase4:widgets                # regenerate all
LIVE=1 pnpm phase4:widgets -- thr-006     # regenerate one thread
pnpm phase4                               # the app
```

## Edit 1 · Register the checklist widget

Open the app. Expand *17 style nits across the PR*. It says the model asked for `checklist`
but nothing is registered for it.

Open `src/widgets/registry.ts` and add one line:

```ts
checklist: ChecklistWidget,
```

Save. The thread now shows 17 items with checkboxes and a **Resolve all 17** button. Click it.
This is the crowd-pleaser, and it took one line, because the component and the props already
existed. The only decision a human made was *that this widget exists*.

## The tour

Expand the threads from the top:

| Thread | ui_hint | What the widget does |
|---|---|---|
| Unsalted SHA-256 | `diff` | the proposed scrypt code as a diff, accept or reject |
| Token storage and refresh | `choice` | three approaches with pros, cons and effort; choosing resolves the thread with a decision |
| Favorites ownership + validation | `diff` | three hunks across two files |
| Secret fallback + URL tokens | `diff` | two hunks |
| Circular import | `graph` | the module graph with the cycle and the cache bypass highlighted; toggle to the proposed structure |
| API and web ship order | `custom` | **falls back** at this checkpoint. See the finale. |
| 401 loop | `diff` | the single-flight refresh as a diff |
| Login hardening | `file` | `routes/auth.ts` with the three remarks in place |
| Favorites polling | `choice` | sync strategies |
| Coverage | `chart` | before/after bars per file, a target line, a headline number, table view |
| 17 nits | `checklist` | batch resolve |

Point out: none of the widgets know about weather, auth, or this PR. They know about diffs,
graphs, choices, numbers, lists and files. The model matched content to shape.

## The finale · a widget nobody wrote

Expand *API and web must ship in a fixed order*. Its hint is `custom`: the model decided no
registry widget fit, and instead **composed a layout** out of primitives (`stack`, `callout`,
`table`, `badge`, `button`, `timeline`, …) as a JSON tree. Look at `src/data/widgets.json`
under `thr-006`. Look at `src/ui-tree/schema.ts` for the vocabulary.

The renderer shows the callout and the table, and then an orange box: *the model composed a
`timeline` here, but no primitive with that name is registered*.

Open `src/ui-tree/primitives.tsx` and add the `timeline` primitive (the `phase-4-finale`
checkpoint has one implementation: an ordered list with a status marker per step). Save. The
rollout sequence renders as a five-step timeline with owners.

With a key, regenerate that one thread live and watch the model compose a different tree:

```sh
LIVE=1 pnpm phase4:widgets -- thr-006
```

## Discussion (10 minutes)

- **Registry vs JSON tree vs freeform.** The registry is reliable and boring. The JSON tree is
  generative in *composition* but still bounded by a vocabulary. Freeform (model emits code, you
  sandbox it) is truly generative and fragile. Where on that line does your product want to be?
- **Schema design is the skill.** Every `describe()` string and every enum in this repo is a
  decision about what the model may say. Prompts came second.
- **Where it breaks.** Run `LIVE=1 pnpm phase4:widgets` a few times. Watch a `diff` hunk whose
  `original` does not match the file verbatim. Watch a `graph` with an edge to a node that does
  not exist. The schema cannot catch semantic errors; only validation against the *data* can.
  Ask what checks you would add to `widgetize.ts`.
- **Latency.** A registry pick is instant. Generating props takes seconds per thread. Composing a
  tree takes longer. Caching is not an optimisation here, it is the architecture.

## If you fall behind

```sh
git checkout phase-4-complete      # registry done, finale pending
git checkout phase-4-finale        # everything
```
