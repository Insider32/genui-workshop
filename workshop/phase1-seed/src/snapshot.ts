/**
 * Snapshot the PR's changed files (base and head contents) into
 * fixtures/pr-files.json so Phase 4's file viewer and diff widgets can
 * render real source without touching git at runtime.
 *
 *   pnpm fixtures:snapshot
 */
import { execFileSync } from 'node:child_process';
import { FIXTURES, REPO_ROOT } from '@workshop/shared';
import { loadPr } from '@workshop/shared';
import { writeJson } from '@workshop/shared/cache';
import type { PrFile } from '@workshop/shared/schemas';

const IGNORED = new Set(['pnpm-lock.yaml']);

function git(...args: string[]): string {
  return execFileSync('git', args, { cwd: REPO_ROOT, encoding: 'utf8' });
}

function show(ref: string, path: string): string | null {
  try {
    return execFileSync('git', ['show', `${ref}:${path}`], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

const pr = loadPr();
const statusLines = git('diff', '--name-status', `${pr.base}...${pr.head}`).trim().split('\n');

const files: PrFile[] = statusLines
  .map((line) => line.split('\t'))
  .filter(([, path]) => path && !IGNORED.has(path))
  .map(([status, path]) => {
    const kind = status === 'A' ? 'added' : status === 'D' ? 'deleted' : 'modified';
    return {
      path: path!,
      status: kind,
      base: kind === 'added' ? null : show(pr.base, path!),
      head: kind === 'deleted' ? null : show(pr.head, path!),
    } satisfies PrFile;
  });

writeJson(FIXTURES.prFiles, files);
console.log(`Wrote ${files.length} files to ${FIXTURES.prFiles}`);
