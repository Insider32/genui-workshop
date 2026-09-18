import { UIRenderer } from '../ui-tree/Renderer';
import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

/**
 * The finale. No registry pick: the model composed this layout out of
 * primitives, and the renderer interprets it.
 */
export function CustomWidget({ widget, thread, state }: WidgetProps<'custom'>) {
  return (
    <WidgetFrame title="Model-composed layout">
      <UIRenderer node={widget.tree} ctx={{ thread, state }} />
    </WidgetFrame>
  );
}
