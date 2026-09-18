import { z } from 'zod';

/**
 * The JSON UI tree: the finale of Phase 4.
 *
 * Instead of picking a widget from the registry, the model composes a
 * layout out of these primitives. The renderer interprets the tree. The
 * model never emits code, only data that conforms to this schema, which
 * is why this stays reliable while still being generative in *composition*.
 */

const Tone = z.enum(['neutral', 'info', 'success', 'warning', 'danger']);

export type UINode =
  | { type: 'stack'; direction: 'row' | 'column'; gap?: 'sm' | 'md' | 'lg'; children: UINode[] }
  | { type: 'heading'; text: string; level: 2 | 3 | 4 }
  | { type: 'text'; text: string; tone?: 'default' | 'muted' }
  | { type: 'badge'; text: string; tone: z.infer<typeof Tone> }
  | { type: 'callout'; tone: 'info' | 'success' | 'warning' | 'danger'; title?: string; text: string }
  | { type: 'card'; title?: string; children: UINode[] }
  | { type: 'table'; columns: string[]; rows: string[][] }
  | { type: 'divider' }
  | {
      type: 'button';
      label: string;
      action:
        | { type: 'resolve' }
        | { type: 'open_file'; path: string; line?: number }
        | { type: 'link'; href: string };
    }
  | {
      type: 'timeline';
      steps: Array<{
        title: string;
        description: string;
        status: 'done' | 'pending' | 'blocked';
        owner?: string;
      }>;
    };

export const UINodeSchema: z.ZodType<UINode> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('stack'),
      direction: z.enum(['row', 'column']),
      gap: z.enum(['sm', 'md', 'lg']).optional(),
      children: z.array(UINodeSchema),
    }),
    z.object({ type: z.literal('heading'), text: z.string(), level: z.union([z.literal(2), z.literal(3), z.literal(4)]) }),
    z.object({ type: z.literal('text'), text: z.string(), tone: z.enum(['default', 'muted']).optional() }),
    z.object({ type: z.literal('badge'), text: z.string(), tone: Tone }),
    z.object({
      type: z.literal('callout'),
      tone: z.enum(['info', 'success', 'warning', 'danger']),
      title: z.string().optional(),
      text: z.string(),
    }),
    z.object({ type: z.literal('card'), title: z.string().optional(), children: z.array(UINodeSchema) }),
    z.object({ type: z.literal('table'), columns: z.array(z.string()), rows: z.array(z.array(z.string())) }),
    z.object({ type: z.literal('divider') }),
    z.object({
      type: z.literal('button'),
      label: z.string(),
      action: z.discriminatedUnion('type', [
        z.object({ type: z.literal('resolve') }),
        z.object({ type: z.literal('open_file'), path: z.string(), line: z.number().optional() }),
        z.object({ type: z.literal('link'), href: z.string() }),
      ]),
    }),
    z.object({
      type: z.literal('timeline'),
      steps: z.array(
        z.object({
          title: z.string(),
          description: z.string(),
          status: z.enum(['done', 'pending', 'blocked']),
          owner: z.string().optional(),
        }),
      ),
    }),
  ]),
);

/** The primitive names, for the prompt that asks the model to compose a tree. */
export const UI_PRIMITIVE_DOCS = `
- stack { direction: "row" | "column", gap?: "sm" | "md" | "lg", children: Node[] }  layout container
- heading { text, level: 2 | 3 | 4 }
- text { text, tone?: "default" | "muted" }
- badge { text, tone: "neutral" | "info" | "success" | "warning" | "danger" }
- callout { tone: "info" | "success" | "warning" | "danger", title?, text }  a highlighted note
- card { title?, children: Node[] }  a bordered group
- table { columns: string[], rows: string[][] }
- divider {}
- button { label, action: { type: "resolve" } | { type: "open_file", path, line? } | { type: "link", href } }
- timeline { steps: [{ title, description, status: "done" | "pending" | "blocked", owner? }] }  an ordered sequence of steps
`.trim();
