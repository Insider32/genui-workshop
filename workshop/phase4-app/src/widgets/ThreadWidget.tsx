import type { Thread } from '@workshop/phase3-threads/schema';
import { widgets } from '../data';
import type { ThreadStateApi } from '../state/useThreadState';
import { WIDGET_REGISTRY } from './registry';
import type { WidgetComponent } from './types';

interface Props {
  thread: Thread;
  state: ThreadStateApi;
}

export function ThreadWidget({ thread, state }: Props) {
  if (thread.ui_hint === 'none') return null;
  const widget = widgets[thread.id];

  if (!widget) {
    return (
      <div className="widget-fallback">
        No widget props generated for this thread yet. Run <code>pnpm phase4:widgets</code>.
      </div>
    );
  }

  const Component = WIDGET_REGISTRY[widget.kind] as WidgetComponent | undefined;
  if (!Component) {
    return (
      <div className="widget-fallback">
        The model asked for <code>{widget.kind}</code>, but nothing is registered for it in{' '}
        <code>widgets/registry.ts</code>. Falling back to plain text.
      </div>
    );
  }

  return <Component widget={widget} thread={thread} state={state} />;
}
