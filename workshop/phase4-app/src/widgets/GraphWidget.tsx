import { useMemo, useState } from 'react';
import type { GraphWidgetProps } from './schema';
import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

const LAYERS = ['routes', 'services', 'stores', 'providers', 'lib'] as const;
const NODE_W = 150;
const NODE_H = 34;
const COL_GAP = 60;
const ROW_GAP = 22;
const PAD = 16;

type Node = GraphWidgetProps['nodes'][number];
type Edge = { from: string; to: string; problem?: 'cycle' | 'bypass' | 'coupling' | null; note?: string | null };

function layout(nodes: Node[]) {
  const usedLayers = LAYERS.filter((l) => nodes.some((n) => n.layer === l));
  const pos = new Map<string, { x: number; y: number }>();
  let maxRows = 0;
  usedLayers.forEach((layer, col) => {
    const inLayer = nodes.filter((n) => n.layer === layer);
    maxRows = Math.max(maxRows, inLayer.length);
    inLayer.forEach((n, row) => {
      pos.set(n.id, { x: PAD + col * (NODE_W + COL_GAP), y: PAD + 18 + row * (NODE_H + ROW_GAP) });
    });
  });
  const width = PAD * 2 + usedLayers.length * NODE_W + (usedLayers.length - 1) * COL_GAP;
  const height = PAD * 2 + 18 + maxRows * (NODE_H + ROW_GAP) - ROW_GAP;
  return { pos, width, height, usedLayers };
}

function edgePath(a: { x: number; y: number }, b: { x: number; y: number }, backward: boolean) {
  if (!backward) {
    const x1 = a.x + NODE_W;
    const y1 = a.y + NODE_H / 2;
    const x2 = b.x;
    const y2 = b.y + NODE_H / 2;
    const mx = (x1 + x2) / 2;
    return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2 - 6} ${y2}`;
  }
  // backward or same-layer edge: loop over the top
  const x1 = a.x + NODE_W / 2;
  const y1 = a.y;
  const x2 = b.x + NODE_W / 2;
  const y2 = b.y;
  const lift = Math.min(y1, y2) - 26;
  return `M ${x1} ${y1} C ${x1} ${lift}, ${x2} ${lift}, ${x2} ${y2 - 6}`;
}

function Graph({ nodes, edges, caption }: { nodes: Node[]; edges: Edge[]; caption: string }) {
  const { pos, width, height, usedLayers } = useMemo(() => layout(nodes), [nodes]);
  return (
    <figure style={{ margin: 0 }}>
      <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={caption}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" />
          </marker>
        </defs>
        {usedLayers.map((layer, col) => (
          <text key={layer} className="layer" x={PAD + col * (NODE_W + COL_GAP)} y={PAD + 6} fill="currentColor" style={{ fontSize: 9, opacity: 0.6 }}>
            {layer}
          </text>
        ))}
        {edges.map((e, i) => {
          const a = pos.get(e.from);
          const b = pos.get(e.to);
          if (!a || !b) return null;
          const backward = b.x <= a.x;
          return (
            <path
              key={i}
              className={`graph-edge ${e.problem ?? ''}`}
              d={edgePath(a, b, backward)}
              markerEnd="url(#arrow)"
              style={{ color: 'inherit' }}
            >
              {e.note && <title>{e.note}</title>}
            </path>
          );
        })}
        {nodes.map((n) => {
          const p = pos.get(n.id)!;
          return (
            <g key={n.id} className="graph-node" transform={`translate(${p.x} ${p.y})`}>
              <rect width={NODE_W} height={NODE_H} rx={6} />
              <text x={10} y={NODE_H / 2 + 4}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="muted" style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
        {caption}
      </figcaption>
    </figure>
  );
}

export function GraphWidget({ widget }: WidgetProps<'graph'>) {
  const [view, setView] = useState<'current' | 'proposed'>('current');
  const problems = widget.edges.filter((e) => e.problem);
  const showing = view === 'proposed' && widget.proposed ? widget.proposed : widget;

  return (
    <WidgetFrame
      title={`Module graph · ${problems.length} problem edge${problems.length === 1 ? '' : 's'}`}
      right={
        widget.proposed ? (
          <span className="graph-toggle" role="tablist">
            <button type="button" className={view === 'current' ? 'active' : ''} onClick={() => setView('current')}>
              Current
            </button>
            <button type="button" className={view === 'proposed' ? 'active' : ''} onClick={() => setView('proposed')}>
              Proposed
            </button>
          </span>
        ) : undefined
      }
    >
      <Graph
        nodes={showing.nodes}
        edges={showing.edges}
        caption={view === 'proposed' ? 'Structure after the suggested refactor' : 'Structure as of the PR head'}
      />
      <div className="graph-legend" aria-label="Legend">
        <span>
          <span className="swatch" /> depends on
        </span>
        <span>
          <span className="swatch cycle" /> cycle
        </span>
        <span>
          <span className="swatch bypass" /> bypasses cache
        </span>
        <span>
          <span className="swatch coupling" /> unwanted coupling
        </span>
      </div>
      <p className="chart-note">{widget.explanation}</p>
    </WidgetFrame>
  );
}
