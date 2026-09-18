import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

/** Absolute path to the repository root. */
export const REPO_ROOT = resolve(here, '../../..');

export const FIXTURES = {
  dir: resolve(REPO_ROOT, 'fixtures'),
  comments: resolve(REPO_ROOT, 'fixtures/comments.json'),
  personas: resolve(REPO_ROOT, 'fixtures/personas.json'),
  pr: resolve(REPO_ROOT, 'fixtures/pr.json'),
  prDiff: resolve(REPO_ROOT, 'fixtures/pr.diff'),
  prFiles: resolve(REPO_ROOT, 'fixtures/pr-files.json'),
};

export const OUTPUTS = {
  phase2Report: resolve(REPO_ROOT, 'workshop/phase2-report/out/report.md'),
  phase3Threads: resolve(REPO_ROOT, 'workshop/phase3-threads/out/threads.json'),
  phase4Widgets: resolve(REPO_ROOT, 'workshop/phase4-app/src/data/widgets.json'),
};
