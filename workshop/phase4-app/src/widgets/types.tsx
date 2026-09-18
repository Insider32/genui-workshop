import type { ReactNode } from 'react';
import type { Thread } from '@workshop/phase3-threads/schema';
import type { ThreadStateApi } from '../state/useThreadState';
import type { Widget, WidgetKind } from './schema';

export interface WidgetProps<K extends WidgetKind = WidgetKind> {
  widget: Extract<Widget, { kind: K }>;
  thread: Thread;
  state: ThreadStateApi;
}

export type WidgetComponent<K extends WidgetKind = WidgetKind> = (props: WidgetProps<K>) => ReactNode;

export function WidgetFrame({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section className="widget">
      <h3 className="widget-title">
        <span>{title}</span>
        {right}
      </h3>
      {children}
    </section>
  );
}
