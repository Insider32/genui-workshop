# GenUI workshop · from 44 review comments to generative UI

> **The thesis:** the same 44 pull-request review comments, rendered at four levels of UI
> generativity. The data never changes. Only the interface does.

| Phase | Your objective | The interface | Guide |
|---|---|---|---|
| 1 | Read the PR with its 44 bot comments, clone the repo | GitHub | [docs/phase-1.md](docs/phase-1.md) |
| 2 | Have your agent turn the comments into one complete Markdown review | a scroll | [docs/phase-2.md](docs/phase-2.md) |
| 3 | Finish the thread contract; have your agent turn the Markdown into schema-validated **threads** | a filterable list | [docs/phase-3.md](docs/phase-3.md) |
| 4 | Have your agent fill the widget each thread asked for, then compose one from scratch | diffs, graphs, choices, charts, checklists, a file viewer, one model-composed layout | [docs/phase-4.md](docs/phase-4.md) |

The pivot is Phase 3, where the model stops producing prose for a human and starts producing
data for a renderer.

## How the workshop works

Each phase gives you an **objective**: an input, an output path, a contract, and a check that
tells you when you are done. **You write the prompt** for your own AI coding CLI, and you decide
whether to make the small code edits yourself or hand them to your agent. Facilitators unblock
you if you get stuck.

Your agent finds the ground rules on its own: Claude Code reads `CLAUDE.md`, Gemini CLI reads
`GEMINI.md`, and Codex CLI, Cursor and Copilot CLI read `AGENTS.md`; all three files carry the
same content. The rules: never touch `fixtures/`, write only to the phase's output path,
preserve every comment id, run the check, no git operations.

The checks:

```sh
pnpm phase2:check     # every [c-NN] id present, required sections
pnpm phase3:check     # schema, 44/44 ids exactly once, ordering
pnpm phase4:check     # schema per ui_hint, diff originals verbatim, graph edges valid, …
```

No API key is needed. Your CLI is the model.

## Prerequisites

- Node 20 or newer, and pnpm (`corepack enable` gives you the pinned version)
- git
- An AI coding CLI (Claude Code, Codex CLI, Gemini CLI, Cursor, Copilot CLI)

## Setup

Phase 1 is reading the PR. Then:

```sh
git clone https://github.com/Insider32/genui-workshop.git && cd genui-workshop
pnpm install
pnpm typecheck                   # everything should pass
pnpm checkpoint phase-2-start    # jump to where Phase 2 begins
```

## Layout

```
apps/weather-web/          the Skylark weather app (React), subject of the PR
apps/weather-api/          its API (Hono)
packages/weather-core/     shared types and the Open-Meteo client
fixtures/                  the 44 comments, the PR, its diff and file snapshots (source of truth)
workshop/shared/           schemas, the provider-agnostic LLM factory, cache and check helpers
workshop/phase2-report/    Phase 2 output: out/report.md             + check
workshop/phase3-threads/   Phase 3 schema + output: out/threads.json  + check
workshop/phase4-app/       the thread UI, widget schemas, registry, JSON UI renderer, output, check
docs/                      your objectives, one per phase
AGENTS.md                  the rules your agent follows (CLAUDE.md and GEMINI.md point here)
facilitator/               run-of-show and reference prompts for the people running the room
tools/seed-pr/             facilitator tooling that seeded the PR; not part of the exercise
```

## Checkpoints

Each phase ships complete, with its edits reverted to `TODO` stubs at the start tag and the
previous phase's cached output in place. Jump with:

```sh
pnpm checkpoint phase-3-start              # git checkout -f <tag> && pnpm install
git diff phase-3-start phase-3-complete    # one reference answer for a phase
```

| Tag | State |
|---|---|
| `phase-1` | fixtures, weather app, the PR branch; no phase packages yet |
| `phase-2-start` / `phase-2-complete` | report prompt stubbed / written |
| `phase-3-start` / `phase-3-complete` | thread schema enums and grouping rules stubbed / written; plain thread list app |
| `phase-4-start` / `phase-4-complete` | checklist widget unregistered / registered |
| `phase-4-finale` | the `timeline` primitive added; everything renders and `pnpm test` passes |

`checkpoint` uses `git checkout -f`, which **discards your agent's outputs and edits**. That is
deliberate: each tag ships a coherent set of cached outputs, and a regenerated `threads.json`
will not match the next tag's `widgets.json`. Stash first if you want to keep your work.

The PR itself is [#1](https://github.com/Insider32/genui-workshop/pull/1) on the
`feature/user-accounts` branch and stays open permanently.

## Alternative route: an API key

The generating scripts can call a model directly through the Vercel AI SDK, for a projector
demo or for anyone without a CLI. Copy `.env.example` to `.env` and set:

| Variable | Meaning |
|---|---|
| `LLM_PROVIDER` | `anthropic` (default), `openai`, `google`, or `openai-compatible` |
| `LLM_MODEL` | model id; defaults to `claude-sonnet-5` for anthropic, required otherwise |
| `LLM_API_KEY` | your key; the provider's own env var (e.g. `ANTHROPIC_API_KEY`) also works |
| `LLM_BASE_URL` | only for `openai-compatible`, e.g. a gateway |

```sh
pnpm phase2 -- --live                   # comments → report.md          (LIVE=1 also works)
pnpm phase3 -- --live                   # report.md → threads.json
pnpm phase4:widgets -- --live           # threads.json → widgets.json
pnpm phase4:widgets -- --live thr-006   # regenerate one thread
```

Without `--live` these scripts read and validate the cached output.

## Running the app

```sh
pnpm phase4                  # the thread app on http://localhost:5174, hot-reloads on output changes
pnpm weather:api             # the weather app itself, not part of the exercise
pnpm weather:web             # http://localhost:5173, uses Open-Meteo, no key
```

Facilitators: see [facilitator/guide.md](facilitator/guide.md).
