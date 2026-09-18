/**
 * Render every thread with its widget to static HTML and check nothing fell
 * back. Cheap proof that the cached data, the schemas and the registry agree.
 *
 *   pnpm --filter @workshop/phase4-app test
 */
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ThreadCard } from '../components/ThreadCard';
import { threads } from '../data';
import { useThreadState } from '../state/useThreadState';

function Everything() {
  const state = useThreadState();
  return (
    <>
      {threads.map((t) => (
        <ThreadCard key={t.id} thread={t} state={state} defaultOpen />
      ))}
    </>
  );
}

describe('cached threads and widgets', () => {
  const html = renderToString(<Everything />);

  it('renders every thread title', () => {
    for (const t of threads) {
      expect(html).toContain(t.title.replace(/'/g, '&#x27;'));
    }
  });

  it('renders a widget for every thread that asked for one', () => {
    expect(html).not.toContain('widget-fallback');
  });

  it('knows every primitive the model composed', () => {
    expect(html).not.toContain('ui-unknown');
  });

  it('exercises every widget kind', () => {
    for (const cls of ['hunk', 'graph-svg', 'choice-grid', 'chart-svg', 'checklist', 'file-view', 'ui-timeline']) {
      expect(html).toContain(`class="${cls}`);
    }
  });
});
