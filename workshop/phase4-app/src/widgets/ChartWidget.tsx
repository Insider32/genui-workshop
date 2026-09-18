import { useState } from 'react';
import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

const ROW_H = 34;
const BAR_H = 8;
const LABEL_W = 170;
const VALUE_W = 44;
const PAD_TOP = 8;

/** Rounded right end, square left end anchored at the baseline. */
function barPath(x: number, y: number, w: number, h: number) {
  const r = Math.min(4, w, h / 2);
  return `M ${x} ${y} H ${x + w - r} Q ${x + w} ${y} ${x + w} ${y + r} V ${y + h - r} Q ${x + w} ${y + h} ${x + w - r} ${y + h} H ${x} Z`;
}

export function ChartWidget({ widget }: WidgetProps<'chart'>) {
  const [table, setTable] = useState(false);
  const width = 640;
  const plotX = LABEL_W;
  const plotW = width - LABEL_W - VALUE_W;
  const height = PAD_TOP + widget.series.length * ROW_H + 18;
  const scale = (v: number) => (Math.max(0, Math.min(100, v)) / 100) * plotW;

  return (
    <WidgetFrame
      title={widget.title}
      right={
        <button type="button" className="btn small" onClick={() => setTable((t) => !t)}>
          {table ? 'Show chart' : 'Show table'}
        </button>
      }
    >
      {widget.headline && (
        <div className="chart-headline">
          <span>{widget.headline.label}</span>
          <span className="big">{widget.headline.before}%</span>
          <span className="arrow" aria-hidden="true">
            →
          </span>
          <span className="big">{widget.headline.after}%</span>
          <span className="delta">
            {widget.headline.after - widget.headline.before > 0 ? '+' : ''}
            {widget.headline.after - widget.headline.before} pts
          </span>
        </div>
      )}

      {table ? (
        <table className="chart-table">
          <thead>
            <tr>
              <th>File</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {widget.series.map((s) => (
              <tr key={s.label}>
                <td>
                  <code>{s.label}</code>
                </td>
                <td className="num">{s.before === null ? 'new' : `${s.before}%`}</td>
                <td className="num">{s.after}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <>
          <div className="chart-legend" aria-label="Legend">
            <span>
              <span className="dot" style={{ background: 'var(--series-2)' }} /> before
            </span>
            <span>
              <span className="dot" style={{ background: 'var(--series-1)' }} /> after
            </span>
            {widget.threshold !== null && <span>┈ target {widget.threshold}%</span>}
          </div>
          <svg className="chart-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={widget.title}>
            {[0, 25, 50, 75, 100].map((tick) => (
              <g key={tick}>
                <line className="grid" x1={plotX + scale(tick)} x2={plotX + scale(tick)} y1={PAD_TOP} y2={height - 18} />
                <text x={plotX + scale(tick)} y={height - 4} textAnchor="middle">
                  {tick}
                </text>
              </g>
            ))}
            {widget.threshold !== null && (
              <line
                className="threshold"
                x1={plotX + scale(widget.threshold)}
                x2={plotX + scale(widget.threshold)}
                y1={PAD_TOP}
                y2={height - 18}
              />
            )}
            {widget.series.map((s, i) => {
              const y = PAD_TOP + i * ROW_H;
              const beforeY = y + 6;
              const afterY = y + 6 + BAR_H + 2;
              return (
                <g key={s.label}>
                  <text className="label" x={LABEL_W - 10} y={y + ROW_H / 2 + 2} textAnchor="end">
                    {s.label}
                  </text>
                  {s.before === null ? (
                    <text x={plotX + 4} y={beforeY + BAR_H - 1} style={{ fontSize: 9, opacity: 0.7 }}>
                      new file
                    </text>
                  ) : (
                    <path d={barPath(plotX, beforeY, scale(s.before), BAR_H)} fill="var(--series-2)">
                      <title>{`${s.label} before: ${s.before}%`}</title>
                    </path>
                  )}
                  <path d={barPath(plotX, afterY, scale(s.after), BAR_H)} fill="var(--series-1)">
                    <title>{`${s.label} after: ${s.after}%`}</title>
                  </path>
                  <text className="value" x={plotX + scale(s.after) + 6} y={afterY + BAR_H}>
                    {s.after}%
                  </text>
                </g>
              );
            })}
          </svg>
        </>
      )}
      <p className="chart-note">{widget.note}</p>
    </WidgetFrame>
  );
}
