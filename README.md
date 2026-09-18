# GenUI workshop · from 44 review comments to generative UI

> **The thesis:** the same 44 pull-request review comments, rendered at four levels of UI
> generativity. The data never changes. Only the interface does.

| Phase | What the audience sees | The interface | Doc |
|---|---|---|---|
| 1 | A real GitHub PR with 44 bot comments | GitHub | [docs/phase-1.md](docs/phase-1.md) |
| 2 | One LLM call → a 450-line Markdown report | a scroll | [docs/phase-2.md](docs/phase-2.md) |
| 3 | That Markdown → 11 schema-validated **threads** | a filterable list | [docs/phase-3.md](docs/phase-3.md) |
| 4 | Each thread → the widget the model asked for | diffs, graphs, choices, charts, checklists, a file viewer, and one model-composed layout | [docs/phase-4.md](docs/phase-4.md) |

The pivot is Phase 3, where the model stops producing prose for a human and starts producing
data for a renderer.

## Prerequisites

- Node 20 or newer, and pnpm (`corepack enable` gives you the pinned version)
- git
- Optional: an LLM API key. **Without one everything still runs** from committed cached output.

## Setup

```sh
git clone <this repo> && cd genui-workshop
pnpm install
cp .env.example .env        # add a key if you have one; see "LLM configuration"
pnpm typecheck              # everything should pass
```

## Layout

```
apps/weather-web/          the Skylark weather app (React), subject of the PR
apps/weather-api/          its API (Hono)
packages/weather-core/     shared types and the Open-Meteo client
fixtures/                  the 44 comments, the PR, its diff and file snapshots (source of truth)
workshop/shared/           schemas, the provider-agnostic LLM factory, cache helpers
workshop/phase1-seed/      pushes fixtures to a real GitHub PR
workshop/phase2-report/    comments → Markdown            out/report.md    (cached)
workshop/phase3-threads/   Markdown → threads             out/threads.json (cached)
workshop/phase4-app/       the thread UI, widget registry, JSON UI renderer, widgetize script
docs/                      one guide per phase
```

## Running the phases

```sh
pnpm phase1:seed -- --dry-run   # Phase 1: print what the seed script would post
pnpm phase2                     # Phase 2: the Markdown report (cached)
pnpm phase3                     # Phase 3: threads (cached) + id coverage report
pnpm phase4:widgets             # Phase 4: widget props (cached)
pnpm phase4                     # Phase 4: the app on http://localhost:5174
```

Prefix any generating script with `LIVE=1` to call the model instead of reading the cache.
Every script prints which model it used and how long it took.

The weather app itself is not part of the exercise, but it runs:
`pnpm weather:api` and `pnpm weather:web`, then http://localhost:5173. No API key needed;
it uses Open-Meteo.

## Checkpoints

This is a build-along. Each phase ships complete, with two or three small edits reverted to
`TODO` stubs at its start tag. If you fall behind, jump to the next tag:

| Tag | State |
|---|---|
| `phase-1` | fixtures, seed script, weather app, the PR branch |
| `phase-2-start` / `phase-2-complete` | report prompt stubbed / written |
| `phase-3-start` / `phase-3-complete` | thread schema enums and grouping rules stubbed / written; plain thread list app |
| `phase-4-start` / `phase-4-complete` | checklist widget unregistered / registered |
| `phase-4-finale` | the `timeline` primitive added; everything renders |

```sh
git checkout phase-3-start
pnpm install                               # each checkpoint has a matching lockfile
git diff phase-3-start phase-3-complete    # the answer key for that phase
```

The PR itself lives on the `feature/user-accounts` branch and stays open permanently.

## LLM configuration

Everything goes through the Vercel AI SDK, so the provider is a config choice. Set these in
`.env` (see `.env.example`):

| Variable | Meaning |
|---|---|
| `LLM_PROVIDER` | `anthropic` (default), `openai`, `google`, or `openai-compatible` |
| `LLM_MODEL` | model id; defaults to `claude-sonnet-5` for anthropic, required otherwise |
| `LLM_API_KEY` | your key; the provider's own env var (e.g. `ANTHROPIC_API_KEY`) also works |
| `LLM_BASE_URL` | only for `openai-compatible`, e.g. a gateway |
| `LIVE=1` | regenerate even when a cache exists |

**Bring your own key** if you have one. If you do not, the organizer hands out a fallback key
for a cheap model on the day; put it in `.env` as shown in `.env.example`. That key is spend-capped
and is revoked after the event, so do not build anything on it.

## Facilitator notes

- **Seeding the PR.** Once, from a machine logged into `gh`:
  `pnpm phase1:seed -- --push`. It pushes `main` and `feature/user-accounts`, opens the PR,
  labels it, posts the 44 comments with a 1.2 s pause between them, and writes the PR number back
  into `fixtures/pr.json`. Re-running only posts comments that are missing.
- **Refreshing the file snapshot** after any change to the PR branch: `pnpm fixtures:snapshot`.
- **Regenerating caches** before the event: `LIVE=1 pnpm phase2 && LIVE=1 pnpm phase3 && LIVE=1 pnpm phase4:widgets`,
  then read the outputs. Threads are re-sorted by severity and re-numbered; check the id coverage
  line says 44/44.
- **Smoke test** that cached data and widgets agree: `pnpm --filter @workshop/phase4-app test`.
- **The 90 minutes:** 10 framing · 5 Phase 1 · 10 Phase 2 · 25 Phase 3 · 30 Phase 4 · 10 discussion.
