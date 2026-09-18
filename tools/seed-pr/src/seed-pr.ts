/**
 * Facilitator tooling, not part of the workshop: push the fixtures to a real
 * GitHub pull request so attendees have something to look at in Phase 1.
 *
 *   pnpm seed:pr -- --dry-run     # print what would be posted, no network
 *   pnpm seed:pr -- --push        # also git push main + the PR branch first
 *   pnpm seed:pr                  # open/find the PR and post missing comments
 *
 * Auth: GITHUB_TOKEN, or the gh CLI login (`gh auth token`).
 * Target: GITHUB_REPO=owner/name (defaults to the `origin` remote).
 */
import { execFileSync } from 'node:child_process';
import { Octokit } from '@octokit/rest';
import { FIXTURES, REPO_ROOT, loadComments, loadPersonas, loadPr, formatCommentHeader } from '@workshop/shared';
import { readJson, writeJson } from '@workshop/shared/cache';
import type { PrFixture } from '@workshop/shared/schemas';

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
const push = args.has('--push');

function sh(cmd: string, cmdArgs: string[]): string {
  return execFileSync(cmd, cmdArgs, { cwd: REPO_ROOT, encoding: 'utf8' }).trim();
}

function resolveRepo(): { owner: string; repo: string } {
  const explicit = process.env.GITHUB_REPO;
  const remote = explicit ?? sh('git', ['remote', 'get-url', 'origin']);
  const match = remote.match(/github\.com[/:]([^/]+)\/([^/.]+)(?:\.git)?$/) ?? remote.match(/^([^/]+)\/([^/]+)$/);
  if (!match) throw new Error(`Cannot parse GitHub repo from "${remote}". Set GITHUB_REPO=owner/name.`);
  return { owner: match[1]!, repo: match[2]! };
}

function resolveToken(): string {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  try {
    return sh('gh', ['auth', 'token']);
  } catch {
    throw new Error('No GITHUB_TOKEN and `gh auth token` failed. Run `gh auth login` or set GITHUB_TOKEN.');
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface PullRef {
  number: number;
  html_url: string;
  head: { sha: string };
}

async function main() {
  const pr = loadPr();
  const comments = loadComments();
  const personas = loadPersonas();
  const { owner, repo } = dryRun
    ? (() => {
        try {
          return resolveRepo();
        } catch {
          return { owner: '<owner>', repo: '<repo>' };
        }
      })()
    : resolveRepo();

  console.log(`Target: ${owner}/${repo}  (${pr.head} -> ${pr.base})`);
  console.log(`Comments in fixture: ${comments.length}`);

  if (dryRun) {
    for (const comment of comments) {
      const header = formatCommentHeader(comment, personas[comment.author].emoji);
      console.log(`\n--- ${comment.path}:${comment.line} ---\n${header}\n${comment.body.split('\n')[0]}`);
    }
    console.log('\nDry run: nothing was sent to GitHub.');
    return;
  }

  if (push) {
    console.log(`Pushing ${pr.base} and ${pr.head} to origin...`);
    console.log(sh('git', ['push', '-u', 'origin', pr.base, pr.head]));
  }

  const octokit = new Octokit({ auth: resolveToken() });

  // 1. Find or create the pull request.
  const existing = await octokit.rest.pulls.list({ owner, repo, state: 'open', head: `${owner}:${pr.head}` });
  let pull: PullRef | undefined = existing.data[0];
  if (!pull) {
    console.log('Opening pull request...');
    const created = await octokit.rest.pulls.create({
      owner,
      repo,
      title: pr.title,
      body: pr.body,
      head: pr.head,
      base: pr.base,
    });
    pull = created.data;
  } else {
    console.log(`Found open PR #${pull.number}`);
  }
  if (!pull) throw new Error('Failed to find or create the pull request');

  // 2. Labels (best effort).
  for (const label of pr.labels) {
    await octokit.rest.issues.createLabel({ owner, repo, name: label, color: 'ededed' }).catch(() => undefined);
  }
  await octokit.rest.issues.addLabels({ owner, repo, issue_number: pull.number, labels: pr.labels }).catch(() => undefined);

  // 3. Post review comments that are not already there (idempotent on the `c-NN` marker).
  const posted = await octokit.paginate(octokit.rest.pulls.listReviewComments, {
    owner,
    repo,
    pull_number: pull.number,
    per_page: 100,
  });
  const alreadyPosted = new Set(
    posted.map((c) => c.body.match(/`(c-\d{2})`/)?.[1]).filter((id): id is string => Boolean(id)),
  );

  let count = 0;
  for (const comment of comments) {
    if (alreadyPosted.has(comment.id)) continue;
    const header = formatCommentHeader(comment, personas[comment.author].emoji);
    await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number: pull.number,
      commit_id: pull.head.sha,
      path: comment.path,
      line: comment.line,
      side: comment.side,
      body: `${header}\n\n${comment.body}`,
    });
    count += 1;
    process.stdout.write(`posted ${comment.id} (${comment.path}:${comment.line})\n`);
    await sleep(1200); // stay under GitHub's secondary rate limit for content creation
  }

  // 4. Record the PR number back into the fixture.
  const fixture = readJson<PrFixture>(FIXTURES.pr);
  fixture.number = pull.number;
  writeJson(FIXTURES.pr, fixture);

  console.log(`\nDone. ${count} new comments, ${alreadyPosted.size} already present.`);
  console.log(pull.html_url);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
