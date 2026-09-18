import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

export function ChoiceWidget({ widget, thread, state }: WidgetProps<'choice'>) {
  const current = state.get(thread.id);
  const chosen = widget.options.find((o) => current.decision?.startsWith(o.title));

  return (
    <WidgetFrame title="Decision needed">
      <p className="choice-question">{widget.question}</p>
      <div className="choice-grid">
        {widget.options.map((option) => {
          const selected = chosen?.id === option.id;
          return (
            <div key={option.id} className={`choice ${selected ? 'selected' : ''}`}>
              <h4>
                <span>{option.title}</span>
                {option.recommended && (
                  <span className="badge hint" title="Recommended by the reviewer">
                    recommended
                  </span>
                )}
              </h4>
              <p className="summary">{option.summary}</p>
              <ul className="pros">
                {option.pros.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
              <ul className="cons">
                {option.cons.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
              <span className="effort">Effort: {option.effort}</span>
              <button
                type="button"
                className={`btn small ${selected ? '' : 'primary'}`}
                disabled={selected}
                onClick={() => state.resolve(thread.id, `${option.title} chosen`)}
              >
                {selected ? 'Chosen' : 'Choose this'}
              </button>
            </div>
          );
        })}
      </div>
    </WidgetFrame>
  );
}
