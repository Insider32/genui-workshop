import { Fragment } from 'react';
import { fileByPath, personas } from '../data';
import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

export function FileWidget({ widget, thread }: WidgetProps<'file'>) {
  const file = fileByPath.get(widget.path);
  const lines = (file?.head ?? '').split('\n');
  const byLine = new Map<number, typeof widget.annotations>();
  for (const a of widget.annotations) {
    byLine.set(a.line, [...(byLine.get(a.line) ?? []), a]);
  }

  return (
    <WidgetFrame title={`File · ${widget.annotations.length} remarks in place`}>
      <div className="file-jumps">
        {widget.annotations.map((a) => (
          <a key={a.comment_id} className="btn small" href={`#${thread.id}-L${a.line}`}>
            L{a.line} · {a.severity}
          </a>
        ))}
      </div>
      <div className="file-view">
        <div className="file-head">
          <span>{widget.path}</span>
          <span className="muted">{lines.length} lines</span>
        </div>
        <div className="file-body">
          {lines.map((text, i) => {
            const n = i + 1;
            const notes = byLine.get(n);
            return (
              <Fragment key={n}>
                <div className={`file-line ${notes ? 'annotated' : ''}`} id={`${thread.id}-L${n}`}>
                  <span className="n">{n}</span>
                  <pre>{text || ' '}</pre>
                </div>
                {notes?.map((a) => (
                  <div key={a.comment_id} className="file-annotation">
                    <div className="who">
                      {personas[a.author as keyof typeof personas]?.emoji} {a.author} · {a.severity} · {a.comment_id}
                    </div>
                    {a.text}
                  </div>
                ))}
              </Fragment>
            );
          })}
        </div>
      </div>
    </WidgetFrame>
  );
}
