import { z } from 'zod';
import { UINodeSchema } from '../ui-tree/schema';

/**
 * Widget props. One schema per ui_hint.
 *
 * This is the generative contract of Phase 4: the model chose the ui_hint in
 * Phase 3, and here it produces the props for that widget. The registry
 * (registry.ts) only maps hint -> component. Nothing here is rendered by the
 * model; everything here is *decided* by the model.
 */

export const DiffWidgetSchema = z.object({
  kind: z.literal('diff'),
  hunks: z
    .array(
      z.object({
        path: z.string().describe('Repo-relative file path'),
        title: z.string().describe('What this change does, imperative, under 80 chars'),
        original: z.string().describe('The exact current code, verbatim from the file, 3 to 25 lines'),
        proposed: z.string().describe('The replacement for the original excerpt'),
        explanation: z.string().describe('One or two sentences on why'),
        comment_ids: z.array(z.string()),
      }),
    )
    .min(1)
    .max(4),
});

export const GraphWidgetSchema = z.object({
  kind: z.literal('graph'),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        label: z.string().describe('Short module name, e.g. routes/favorites'),
        layer: z.enum(['routes', 'services', 'stores', 'providers', 'lib']),
      }),
    )
    .min(2),
  edges: z.array(
    z.object({
      from: z.string(),
      to: z.string(),
      problem: z.enum(['cycle', 'bypass', 'coupling']).nullable(),
      note: z.string().nullable(),
    }),
  ),
  proposed: z
    .object({
      nodes: z.array(z.object({ id: z.string(), label: z.string(), layer: z.enum(['routes', 'services', 'stores', 'providers', 'lib']) })),
      edges: z.array(z.object({ from: z.string(), to: z.string() })),
    })
    .nullable()
    .describe('The structure after the suggested refactor, if the comments propose one'),
  explanation: z.string(),
});

export const ChoiceWidgetSchema = z.object({
  kind: z.literal('choice'),
  question: z.string(),
  options: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        summary: z.string(),
        pros: z.array(z.string()).min(1).max(4),
        cons: z.array(z.string()).min(1).max(4),
        effort: z.enum(['low', 'medium', 'high']),
        recommended: z.boolean(),
      }),
    )
    .min(2)
    .max(4),
});

export const ChartWidgetSchema = z.object({
  kind: z.literal('chart'),
  title: z.string(),
  unit: z.literal('%'),
  threshold: z.number().nullable().describe('A target line, e.g. 80'),
  series: z
    .array(
      z.object({
        label: z.string().describe('Short file or area name'),
        before: z.number().nullable().describe('Null when the file is new in this PR'),
        after: z.number(),
      }),
    )
    .min(1),
  headline: z
    .object({ label: z.string(), before: z.number(), after: z.number() })
    .nullable()
    .describe('The single number that matters, e.g. total PR coverage before and after'),
  note: z.string(),
});

export const ChecklistWidgetSchema = z.object({
  kind: z.literal('checklist'),
  items: z
    .array(
      z.object({
        id: z.string(),
        comment_id: z.string(),
        path: z.string(),
        line: z.number(),
        text: z.string().describe('The fix, imperative, under 100 chars'),
        autofix: z.boolean().describe('True when a formatter or codemod could do it'),
      }),
    )
    .min(1),
});

export const FileWidgetSchema = z.object({
  kind: z.literal('file'),
  path: z.string(),
  annotations: z
    .array(
      z.object({
        line: z.number(),
        comment_id: z.string(),
        author: z.string(),
        severity: z.enum(['critical', 'high', 'medium', 'low']),
        text: z.string().describe('The remark, condensed to one or two sentences'),
      }),
    )
    .min(1),
});

export const CustomWidgetSchema = z.object({
  kind: z.literal('custom'),
  tree: UINodeSchema,
});

export const WidgetSchema = z.discriminatedUnion('kind', [
  DiffWidgetSchema,
  GraphWidgetSchema,
  ChoiceWidgetSchema,
  ChartWidgetSchema,
  ChecklistWidgetSchema,
  FileWidgetSchema,
  CustomWidgetSchema,
]);
export type Widget = z.infer<typeof WidgetSchema>;
export type WidgetKind = Widget['kind'];

export type DiffWidgetProps = z.infer<typeof DiffWidgetSchema>;
export type GraphWidgetProps = z.infer<typeof GraphWidgetSchema>;
export type ChoiceWidgetProps = z.infer<typeof ChoiceWidgetSchema>;
export type ChartWidgetProps = z.infer<typeof ChartWidgetSchema>;
export type ChecklistWidgetProps = z.infer<typeof ChecklistWidgetSchema>;
export type FileWidgetProps = z.infer<typeof FileWidgetSchema>;
export type CustomWidgetProps = z.infer<typeof CustomWidgetSchema>;

/** thread id -> widget props */
export const WidgetsFileSchema = z.record(z.string(), WidgetSchema);
export type WidgetsFile = z.infer<typeof WidgetsFileSchema>;

export const SCHEMA_BY_HINT = {
  diff: DiffWidgetSchema,
  graph: GraphWidgetSchema,
  choice: ChoiceWidgetSchema,
  chart: ChartWidgetSchema,
  checklist: ChecklistWidgetSchema,
  file: FileWidgetSchema,
  custom: CustomWidgetSchema,
} as const;
