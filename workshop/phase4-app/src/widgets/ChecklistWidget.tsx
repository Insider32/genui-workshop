import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

export function ChecklistWidget({ widget, thread, state }: WidgetProps<'checklist'>) {
  const current = state.get(thread.id);
  const checked = new Set(current.checked ?? []);
  const remaining = widget.items.filter((i) => !checked.has(i.id)).length;

  function toggle(id: string) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    state.update(thread.id, { checked: [...next] });
    if (next.size === widget.items.length) state.resolve(thread.id, `${widget.items.length} nits resolved`);
  }

  return (
    <WidgetFrame
      title={`Checklist · ${widget.items.length - remaining}/${widget.items.length} done`}
      right={
        <button
          type="button"
          className="btn small primary"
          disabled={remaining === 0}
          onClick={() => {
            state.update(thread.id, { checked: widget.items.map((i) => i.id) });
            state.resolve(thread.id, `${widget.items.length} nits resolved in one click`);
          }}
        >
          Resolve all {widget.items.length}
        </button>
      }
    >
      <ul className="checklist">
        {widget.items.map((item) => {
          const done = checked.has(item.id);
          return (
            <li key={item.id} className={done ? 'done' : ''}>
              <input
                id={`${thread.id}-${item.id}`}
                type="checkbox"
                checked={done}
                onChange={() => toggle(item.id)}
                aria-label={item.text}
              />
              <label htmlFor={`${thread.id}-${item.id}`}>
                {item.text}
                <div className="where">
                  {item.path}:{item.line} · {item.comment_id}
                </div>
              </label>
              {item.autofix && <span className="autofix">autofix</span>}
            </li>
          );
        })}
      </ul>
    </WidgetFrame>
  );
}
