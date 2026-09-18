# Phase 1 · The raw PR

**Time:** 5 minutes · **Format:** watch

## What you see

A real pull request on this repository: `feature/user-accounts` into `main`, titled
*feat(accounts): user accounts with synced favorite locations*. It touches 20 files in the
Skylark weather app and adds login, JWT tokens, and a favorites list that syncs across devices.

Four review bots have left **44 comments** on it:

| Bot | Focus | Comments |
|---|---|---|
| 🛡️ sentinel-bot | security | 12 |
| 🏛️ archwise-bot | architecture, correctness, rollout | 11 |
| 🧪 coverage-bot | tests | 4 |
| 🔍 nitpick-bot | style | 17 |

## Talking points

- **High fidelity, zero synthesis.** Every comment is precise, anchored to a line, often with
  replacement code. And yet: where do you start?
- Scroll the *Files changed* tab. Notice how the one critical issue (unsalted SHA-256 password
  hashing) sits visually equal to a comment about an `!important`.
- Notice comments that belong together but are 6 files apart: where tokens are stored
  (`AuthContext.tsx`), how long they live (`config.ts`), and whether refresh tokens rotate
  (`routes/auth.ts`) are one decision spread over three files.
- Notice the three comments about deploy ordering. They are not about code at all.

Ask the room: *"You have 20 minutes before standup. What do you do first?"*

## Where the data lives

The comments are not live. They are fixtures, and every later phase reads the same fixtures:

- `fixtures/comments.json` — the 44 comments: author, category, severity, path, line, body
- `fixtures/pr.json` — title, body, labels, file list
- `fixtures/pr.diff` — the unified diff
- `fixtures/pr-files.json` — base and head contents of every changed file (for the Phase 4 file viewer)
- `fixtures/personas.json` — the four bots

`workshop/phase1-seed/src/seed-pr.ts` pushes these to GitHub. It is idempotent: it finds the
open PR for the branch and only posts comments whose `c-NN` marker is not already there.

## Try it (optional)

```sh
pnpm phase1:seed -- --dry-run     # prints every comment, sends nothing
```

## The thesis, stated once

> Same 44 comments, four levels of UI generativity. The data never changes. Only the interface does.
