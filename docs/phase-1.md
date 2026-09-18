# Phase 1 · Look at the PR

**Time:** 5 minutes

## Look

Open [pull request #1](https://github.com/Insider32/genui-workshop/pull/1):
*feat(accounts): user accounts with synced favorite locations*. It touches 20 files in the
Skylark weather app and adds login, JWT tokens, and a favorites list that syncs across devices.

Four review bots have left **44 comments** on it:

| Bot | Focus | Comments |
|---|---|---|
| 🛡️ sentinel-bot | security | 12 |
| 🏛️ archwise-bot | architecture, correctness, rollout | 11 |
| 🧪 coverage-bot | tests | 4 |
| 🔍 nitpick-bot | style | 17 |

Switch to the *Files changed* tab and scroll. Ask yourself: you have twenty minutes before
standup, where do you start? Hold that thought.

## Clone

```sh
git clone https://github.com/Insider32/genui-workshop.git && cd genui-workshop
pnpm install
pnpm typecheck                     # everything should pass
pnpm checkpoint phase-2-start      # jump to where Phase 2 begins
```

You now have the PR's code on disk and, in `fixtures/comments.json`, the exact 44 comments you
were just reading. Every later phase reads that one file. The data never changes from here on;
only the interface does.

Continue with [Phase 2](phase-2.md).
