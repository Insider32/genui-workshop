import threadsJson from '@workshop/phase3-threads/threads.json';
import { ThreadsOutputSchema, type Thread } from '@workshop/phase3-threads/schema';
import { CommentsFileSchema, PersonasFileSchema, PrFilesSchema, PrSchema } from '@workshop/shared/schemas';
import commentsJson from '../../../../fixtures/comments.json';
import personasJson from '../../../../fixtures/personas.json';
import prJson from '../../../../fixtures/pr.json';
import prFilesJson from '../../../../fixtures/pr-files.json';
import widgetsJson from './widgets.json';
import { WidgetsFileSchema } from '../widgets/schema';

export const threads: Thread[] = ThreadsOutputSchema.parse(threadsJson).threads;
export const comments = CommentsFileSchema.parse(commentsJson);
export const personas = PersonasFileSchema.parse(personasJson);
export const pr = PrSchema.parse(prJson);
export const prFiles = PrFilesSchema.parse(prFilesJson);
export const widgets = WidgetsFileSchema.parse(widgetsJson);

export const commentById = new Map(comments.map((c) => [c.id, c]));
export const fileByPath = new Map(prFiles.map((f) => [f.path, f]));
