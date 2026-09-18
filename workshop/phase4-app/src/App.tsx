import { useMemo, useState } from 'react';
import { SEVERITY_ORDER } from '@workshop/phase3-threads/schema';
import { Filters, type FilterState } from './components/Filters';
import { ThreadCard } from './components/ThreadCard';
import { comments, pr, threads } from './data';
import { useThreadState } from './state/useThreadState';

const INITIAL_FILTERS: FilterState = {
  query: '',
  categories: new Set(),
  severities: new Set(),
  status: 'all',
  hints: new Set(),
};

export function App() {
  const state = useThreadState();
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);

  const visible = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    return [...threads]
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99))
      .filter((t) => {
        if (filters.categories.size && !filters.categories.has(t.category)) return false;
        if (filters.severities.size && !filters.severities.has(t.severity)) return false;
        if (filters.hints.size && !filters.hints.has(t.ui_hint)) return false;
        const status = state.get(t.id).status;
        if (filters.status !== 'all' && status !== filters.status) return false;
        if (q) {
          const hay = `${t.title} ${t.summary} ${t.files.join(' ')} ${t.category}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [filters, state]);

  // Derived from the data, so the filters only offer values that exist.
  const usedSeverities = [...new Set(threads.map((t) => t.severity))].sort(
    (a, b) => (SEVERITY_ORDER[a] ?? 99) - (SEVERITY_ORDER[b] ?? 99),
  );
  const usedCategories = [...new Set(threads.map((t) => t.category))].sort();
  const usedHints = [...new Set(threads.map((t) => t.ui_hint))].sort();

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Review threads</h1>
          <p className="pr-title">
            {pr.title}
            {pr.number ? ` · #${pr.number}` : ''}
          </p>
        </div>
        <div className="stats">
          <span>
            <strong>{comments.length}</strong> comments
          </span>
          <span>
            <strong>{threads.length}</strong> threads
          </span>
          <span>
            <strong>{state.resolvedCount}</strong> resolved
          </span>
        </div>
      </header>

      <Filters
        value={filters}
        onChange={setFilters}
        categories={usedCategories}
        severities={usedSeverities}
        hints={usedHints}
        onReset={() => {
          state.reset();
          setFilters(INITIAL_FILTERS);
        }}
      />

      {visible.length === 0 ? (
        <p className="empty">No threads match these filters.</p>
      ) : (
        <div className="thread-list">
          {visible.map((t, i) => (
            <ThreadCard key={t.id} thread={t} state={state} defaultOpen={i === 0} />
          ))}
        </div>
      )}
    </main>
  );
}
