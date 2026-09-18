import { readJson } from './cache.js';
import { FIXTURES } from './paths.js';
import {
  CommentsFileSchema,
  PersonasFileSchema,
  PrFilesSchema,
  PrSchema,
  type PrFile,
  type PrFixture,
  type ReviewComment,
} from './schemas.js';
import { readFileSync } from 'node:fs';

export function loadComments(): ReviewComment[] {
  return CommentsFileSchema.parse(readJson(FIXTURES.comments));
}

export function loadPersonas() {
  return PersonasFileSchema.parse(readJson(FIXTURES.personas));
}

export function loadPr(): PrFixture {
  return PrSchema.parse(readJson(FIXTURES.pr));
}

export function loadPrDiff(): string {
  return readFileSync(FIXTURES.prDiff, 'utf8');
}

export function loadPrFiles(): PrFile[] {
  return PrFilesSchema.parse(readJson(FIXTURES.prFiles));
}

/** Render one comment the way it appears on GitHub, with the bot header. */
export function formatCommentHeader(comment: ReviewComment, emoji: string): string {
  return `**${emoji} ${comment.author}** · ${comment.category} · ${comment.severity} · \`${comment.id}\``;
}
