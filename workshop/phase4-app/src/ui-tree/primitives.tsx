import type { ReactNode } from 'react';
import type { Thread } from '@workshop/phase3-threads/schema';
import type { ThreadStateApi } from '../state/useThreadState';
import type { UINode } from './schema';

export interface RenderContext {
  thread: Thread;
  state: ThreadStateApi;
}

export interface PrimitiveProps<K extends UINode['type']> {
  node: Extract<UINode, { type: K }>;
  ctx: RenderContext;
  render: (child: UINode, key: number) => ReactNode;
}

type PrimitiveRenderers = { [K in UINode['type']]?: (props: PrimitiveProps<K>) => ReactNode };

/**
 * The primitive vocabulary the JSON UI renderer understands.
 *
 * Every entry here is a human-written component. The model decides which
 * ones to use, in what nesting, with what content. If the model emits a
 * primitive that is not registered, the renderer shows a visible fallback
 * instead of crashing (see Renderer.tsx).
 *
 * Phase 4 finale: add the `timeline` primitive.
 */
export const PRIMITIVES = {
  stack: ({ node, render }) => (
    <div className={`ui-stack ${node.direction} gap-${node.gap ?? 'md'}`}>{node.children.map(render)}</div>
  ),

  heading: ({ node }) => {
    const Tag = `h${node.level}` as 'h2' | 'h3' | 'h4';
    return <Tag className="ui-heading">{node.text}</Tag>;
  },

  text: ({ node }) => <p className={`ui-text ${node.tone ?? ''}`}>{node.text}</p>,

  badge: ({ node }) => <span className={`badge ui-badge ${node.tone}`}>{node.text}</span>,

  callout: ({ node }) => (
    <div className={`ui-callout ${node.tone}`}>
      {node.title && <strong>{node.title}</strong>}
      {node.text}
    </div>
  ),

  card: ({ node, render }) => (
    <div className="ui-card">
      {node.title && <h4 className="ui-card-title">{node.title}</h4>}
      {node.children.map(render)}
    </div>
  ),

  table: ({ node }) => (
    <table className="ui-table">
      <thead>
        <tr>
          {node.columns.map((c) => (
            <th key={c}>{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {node.rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ),

  divider: () => <hr className="ui-divider" />,

  button: ({ node, ctx }) => {
    const { action } = node;
    if (action.type === 'link') {
      return (
        <a className="btn small" href={action.href} target="_blank" rel="noreferrer">
          {node.label}
        </a>
      );
    }
    if (action.type === 'open_file') {
      return (
        <button type="button" className="btn small" title={`${action.path}${action.line ? `:${action.line}` : ''}`}>
          {node.label}
        </button>
      );
    }
    return (
      <button
        type="button"
        className="btn small primary"
        onClick={() => ctx.state.resolve(ctx.thread.id, node.label)}
      >
        {node.label}
      </button>
    );
  },

  // TODO(phase-4 finale): add the `timeline` primitive here.
} satisfies PrimitiveRenderers;
