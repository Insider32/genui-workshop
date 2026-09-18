import { z } from 'zod';

// ---------------------------------------------------------------------------
// Phase 1: the raw review comments (fixtures/comments.json)
// ---------------------------------------------------------------------------

export const PersonaName = z.enum(['sentinel-bot', 'archwise-bot', 'coverage-bot', 'nitpick-bot']);
export type PersonaName = z.infer<typeof PersonaName>;

export const Category = z.enum(['security', 'architecture', 'correctness', 'tests', 'style', 'ops']);
export type Category = z.infer<typeof Category>;

export const Severity = z.enum(['critical', 'high', 'medium', 'low']);
export type Severity = z.infer<typeof Severity>;

export const CommentSchema = z.object({
  id: z.string().regex(/^c-\d{2}$/),
  author: PersonaName,
  category: Category,
  severity: Severity,
  path: z.string(),
  line: z.number().int().positive(),
  side: z.enum(['LEFT', 'RIGHT']).default('RIGHT'),
  body: z.string().min(1),
});
export type ReviewComment = z.infer<typeof CommentSchema>;

export const CommentsFileSchema = z.array(CommentSchema);

export const PersonaSchema = z.object({
  name: PersonaName,
  emoji: z.string(),
  role: z.string(),
  focus: z.string(),
});
export const PersonasFileSchema = z.record(PersonaName, PersonaSchema);

export const PrSchema = z.object({
  number: z.number().int().nullable(),
  title: z.string(),
  base: z.string(),
  head: z.string(),
  author: z.string(),
  body: z.string(),
  labels: z.array(z.string()),
  files: z.array(z.string()),
  stats: z.object({ files: z.number(), additions: z.number(), deletions: z.number() }),
});
export type PrFixture = z.infer<typeof PrSchema>;

export const PrFileSchema = z.object({
  path: z.string(),
  status: z.enum(['added', 'modified', 'deleted']),
  base: z.string().nullable(),
  head: z.string().nullable(),
});
export const PrFilesSchema = z.array(PrFileSchema);
export type PrFile = z.infer<typeof PrFileSchema>;
