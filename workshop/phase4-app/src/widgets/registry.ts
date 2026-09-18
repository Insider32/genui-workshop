import type { WidgetKind } from './schema';
import type { WidgetComponent } from './types';
import { ChartWidget } from './ChartWidget';
import { ChecklistWidget } from './ChecklistWidget';
import { ChoiceWidget } from './ChoiceWidget';
import { CustomWidget } from './CustomWidget';
import { DiffWidget } from './DiffWidget';
import { FileWidget } from './FileWidget';
import { GraphWidget } from './GraphWidget';

/**
 * The widget registry: ui_hint -> component.
 *
 * This is the whole "generative UI" mechanism in Phase 4. The model chose
 * the hint (Phase 3) and produced the props (widgetize). This table is the
 * only thing a human wrote about *which* interface appears.
 *
 * Phase 4, edit #1: register the checklist widget.
 */
export const WIDGET_REGISTRY: { [K in WidgetKind]?: WidgetComponent<K> } = {
  diff: DiffWidget,
  graph: GraphWidget,
  choice: ChoiceWidget,
  chart: ChartWidget,
  file: FileWidget,
  custom: CustomWidget,
  // checklist: ChecklistWidget,   // TODO(phase-4, edit #1): register it
};
