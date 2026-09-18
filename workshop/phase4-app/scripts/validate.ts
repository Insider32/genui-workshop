import { emptyResult, formatIssues, type CheckResult, type PrFile, type ReviewComment } from '@workshop/shared';
import type { Thread } from '@workshop/phase3-threads/schema';
import type { UINode } from '../src/ui-tree/schema';
import { WidgetsFileSchema, type Widget } from '../src/widgets/schema';

export interface WidgetValidationInput {
  raw: unknown;
  threads: Thread[];
  comments: ReviewComment[];
  files: PrFile[];
  /** Names registered in ui-tree/primitives.tsx */
  primitives: string[];
}

function walk(node: UINode, visit: (n: UINode) => void): void {
  visit(node);
  if ('children' in node) node.children.forEach((c) => walk(c, visit));
}

/**
 * The Phase 4 contract. The schema catches shape; this catches the semantic
 * errors a schema cannot express: a diff whose "original" is not in the
 * file, a graph edge to a node that does not exist, an annotation past the
 * end of the file.
 */
export function validateWidgets(input: WidgetValidationInput): CheckResult {
  const result = emptyResult();
  const parsed = WidgetsFileSchema.safeParse(input.raw);
  if (!parsed.success) {
    result.errors.push('does not match WidgetsFileSchema:', ...formatIssues(parsed.error.issues).map((l) => `  ${l}`));
    return result;
  }
  const widgets = parsed.data;
  const threadById = new Map(input.threads.map((t) => [t.id, t]));
  const fileByPath = new Map(input.files.map((f) => [f.path, f]));

  for (const id of Object.keys(widgets)) {
    if (!threadById.has(id)) result.warnings.push(`${id} has a widget but is not in threads.json`);
  }

  for (const thread of input.threads) {
    if (thread.ui_hint === 'none') continue;
    const widget: Widget | undefined = widgets[thread.id];
    if (!widget) {
      result.errors.push(`${thread.id} (${thread.ui_hint}) has no widget`);
      continue;
    }
    if (widget.kind !== thread.ui_hint) {
      result.errors.push(`${thread.id} asked for "${thread.ui_hint}" but the widget is "${widget.kind}"`);
      continue;
    }
    const sources = new Set(thread.source_comments);
    const foreign = (ids: string[]) => ids.filter((c) => !sources.has(c));

    switch (widget.kind) {
      case 'diff':
        widget.hunks.forEach((h, i) => {
          const file = fileByPath.get(h.path);
          if (!file?.head) {
            result.errors.push(`${thread.id} hunk ${i + 1}: ${h.path} is not a file in the PR`);
            return;
          }
          if (!file.head.includes(h.original.trimEnd())) {
            result.errors.push(`${thread.id} hunk ${i + 1}: "original" is not a verbatim excerpt of ${h.path}`);
          }
          const f = foreign(h.comment_ids);
          if (f.length) result.warnings.push(`${thread.id} hunk ${i + 1} cites comments outside the thread: ${f.join(', ')}`);
        });
        break;
      case 'graph': {
        const ids = new Set(widget.nodes.map((n) => n.id));
        if (ids.size !== widget.nodes.length) result.errors.push(`${thread.id}: duplicate node ids`);
        widget.edges.forEach((e) => {
          if (!ids.has(e.from) || !ids.has(e.to)) result.errors.push(`${thread.id}: edge ${e.from} -> ${e.to} references an unknown node`);
        });
        if (widget.proposed) {
          const pids = new Set(widget.proposed.nodes.map((n) => n.id));
          widget.proposed.edges.forEach((e) => {
            if (!pids.has(e.from) || !pids.has(e.to)) result.errors.push(`${thread.id}: proposed edge ${e.from} -> ${e.to} references an unknown node`);
          });
        }
        if (!widget.edges.some((e) => e.problem)) result.warnings.push(`${thread.id}: no edge is marked as a problem`);
        break;
      }
      case 'choice': {
        const rec = widget.options.filter((o) => o.recommended).length;
        if (rec !== 1) result.warnings.push(`${thread.id}: ${rec} options marked recommended (expected exactly 1)`);
        break;
      }
      case 'chart':
        widget.series.forEach((s) => {
          if (s.after < 0 || s.after > 100 || (s.before !== null && (s.before < 0 || s.before > 100))) {
            result.errors.push(`${thread.id}: ${s.label} has a value outside 0..100`);
          }
        });
        break;
      case 'checklist': {
        const cited = new Set(widget.items.map((i) => i.comment_id));
        const f = foreign([...cited]);
        if (f.length) result.warnings.push(`${thread.id}: items cite comments outside the thread: ${f.join(', ')}`);
        const uncovered = [...sources].filter((c) => !cited.has(c));
        if (uncovered.length) result.warnings.push(`${thread.id}: no item for ${uncovered.join(', ')}`);
        break;
      }
      case 'file': {
        const file = fileByPath.get(widget.path);
        if (!file?.head) {
          result.errors.push(`${thread.id}: ${widget.path} is not a file in the PR`);
          break;
        }
        const lines = file.head.split('\n').length;
        widget.annotations.forEach((a) => {
          if (a.line < 1 || a.line > lines) result.errors.push(`${thread.id}: annotation at line ${a.line} but ${widget.path} has ${lines} lines`);
        });
        const f = foreign(widget.annotations.map((a) => a.comment_id));
        if (f.length) result.warnings.push(`${thread.id}: annotations cite comments outside the thread: ${f.join(', ')}`);
        break;
      }
      case 'custom': {
        const known = new Set(input.primitives);
        const unknown = new Set<string>();
        let count = 0;
        walk(widget.tree, (n) => {
          count += 1;
          if (!known.has(n.type)) unknown.add(n.type);
        });
        for (const u of unknown) {
          result.warnings.push(`${thread.id}: primitive "${u}" is not registered in ui-tree/primitives.tsx (renders as a fallback until it is)`);
        }
        if (count > 30) result.warnings.push(`${thread.id}: ${count} nodes; keep composed layouts compact`);
        break;
      }
    }
  }
  return result;
}
