# Agent instructions for the GenUI workshop

You are working inside a conference workshop repository. A participant will give you an
objective for one phase, in their own words. This file tells you the contracts those
objectives are measured against, and the rules of the room.

## What this repository is

The same 44 pull-request review comments rendered at four levels of UI generativity. In each
phase a model (you) reads an input, produces an output that satisfies a contract, and a check
verifies it:

| Phase | Input | Output | Check |
|---|---|---|---|
| 1 | GitHub PR #1 | nothing: the participant reads the PR and clones the repo | — |
| 2 | `fixtures/comments.json`, `fixtures/pr.json` | `workshop/phase2-report/out/report.md` | `pnpm phase2:check` |
| 3 | `workshop/phase2-report/out/report.md` | `workshop/phase3-threads/out/threads.json` | `pnpm phase3:check` |
| 4 | `threads.json` + `fixtures/pr-files.json` | `workshop/phase4-app/src/data/widgets.json` | `pnpm phase4:check` |

The participant guides are `docs/phase-N.md`. Contracts live in code:
`workshop/phase3-threads/src/schema.ts` (threads), `workshop/phase4-app/src/widgets/schema.ts`
(widget props), `workshop/phase4-app/src/ui-tree/schema.ts` (the JSON UI primitives). Read the
`describe()` strings; they are the spec.

## Hard rules

1. **Never modify anything under `fixtures/`.** It is the source of truth for every phase.
2. **Write only to the output path for the phase.** Overwrite what is there; the committed file
   is a cached example, and `git checkout -f <tag>` restores it.
3. **Preserve comment ids.** Every id `c-01` … `c-44` must survive into your output where the
   contract says so. Never invent ids.
4. **Read the input the phase names, not something more convenient.** Phase 3 reads the Phase 2
   Markdown, not the comments file. That is the point of the exercise.
5. **Run the phase's check and iterate until it passes.** Errors fail; warnings are advice.
6. **Do not open `facilitator/`.** It is for the people running the room. If the participant
   hands you something from it, that is their call.
7. **Do not call external APIs or run the `--live` scripts** unless the participant asks. In
   cached mode `pnpm phase2`, `pnpm phase3` and `pnpm phase4:widgets` only validate what is on disk.
8. **Keep code edits minimal and where the objective says.** After any TypeScript change run
   `pnpm typecheck`. Run `pnpm test` only after the Phase 4 finale: before it, the Phase 4 render
   test fails on purpose, because a visible fallback for an unregistered widget or primitive is
   part of the lesson.
9. Do not commit, push, create branches, or touch git state. The participant manages checkpoints.

## Useful commands

```sh
pnpm typecheck                 # every package
pnpm test                      # weather app tests + the Phase 4 render test
pnpm phase4                    # the thread app on http://localhost:5174 (hot reloads on output changes)
pnpm checkpoint <tag>          # participant-only: jump to a checkpoint
```

## Layout

```
apps/, packages/               the Skylark weather app under review (do not refactor it)
fixtures/                      read-only inputs
workshop/shared/               schemas, LLM factory, cache and check helpers
workshop/phase2-report/        Phase 2 script, prompt, output, check
workshop/phase3-threads/       Phase 3 schema, prompt, script, output, check
workshop/phase4-app/           Phase 4 app, widget schemas, registry, JSON UI renderer, output, check
docs/                          the participant's objectives, one per phase
facilitator/                   off limits
tools/seed-pr/                 facilitator tooling that seeded the PR; not part of the exercise
```
