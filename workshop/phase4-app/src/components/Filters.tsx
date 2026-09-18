import type { ThreadCategory, ThreadSeverity, UiHint } from '@workshop/phase3-threads/schema';

export interface FilterState {
  query: string;
  categories: Set<ThreadCategory>;
  severities: Set<ThreadSeverity>;
  status: 'all' | 'open' | 'resolved';
  hints: Set<UiHint>;
}

interface Props {
  value: FilterState;
  onChange: (next: FilterState) => void;
  categories: ThreadCategory[];
  severities: ThreadSeverity[];
  hints?: UiHint[];
  onReset: () => void;
}

function toggle<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) next.delete(item);
  else next.add(item);
  return next;
}

export function Filters({ value, onChange, categories, severities, hints, onReset }: Props) {
  return (
    <div className="filters" role="group" aria-label="Filters">
      <label className="visually-hidden" htmlFor="thread-search">
        Search threads
      </label>
      <input
        id="thread-search"
        type="search"
        placeholder="Search threads…"
        value={value.query}
        onChange={(e) => onChange({ ...value, query: e.target.value })}
      />
      <div className="chip-group" aria-label="Severity">
        {severities.map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${value.severities.has(s) ? 'active' : ''}`}
            onClick={() => onChange({ ...value, severities: toggle(value.severities, s) })}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="chip-group" aria-label="Category">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            className={`chip ${value.categories.has(c) ? 'active' : ''}`}
            onClick={() => onChange({ ...value, categories: toggle(value.categories, c) })}
          >
            {c}
          </button>
        ))}
      </div>
      {hints && (
        <div className="chip-group" aria-label="UI hint">
          {hints.map((h) => (
            <button
              key={h}
              type="button"
              className={`chip ${value.hints.has(h) ? 'active' : ''}`}
              onClick={() => onChange({ ...value, hints: toggle(value.hints, h) })}
            >
              {h}
            </button>
          ))}
        </div>
      )}
      <div className="chip-group" aria-label="Status">
        {(['all', 'open', 'resolved'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={`chip ${value.status === s ? 'active' : ''}`}
            onClick={() => onChange({ ...value, status: s })}
          >
            {s}
          </button>
        ))}
      </div>
      <span className="spacer" />
      <button type="button" className="link-button" onClick={onReset}>
        Reset demo state
      </button>
    </div>
  );
}
