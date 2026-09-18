import { diffLines } from 'diff';
import type { WidgetProps } from './types';
import { WidgetFrame } from './types';

function Hunk({
  hunk,
  index,
  status,
  onDecide,
}: {
  hunk: WidgetProps<'diff'>['widget']['hunks'][number];
  index: number;
  status: 'accepted' | 'rejected' | undefined;
  onDecide: (s: 'accepted' | 'rejected' | undefined) => void;
}) {
  const changes = diffLines(hunk.original.trimEnd() + '\n', hunk.proposed.trimEnd() + '\n');
  return (
    <div className={`hunk ${status ?? ''}`}>
      <div className="hunk-head">
        <div>
          <strong>{hunk.title}</strong>
          <br />
          <code>{hunk.path}</code>
        </div>
        <div className="hunk-actions">
          {status ? (
            <>
              <span className="muted">{status}</span>
              <button type="button" className="btn small" onClick={() => onDecide(undefined)}>
                Undo
              </button>
            </>
          ) : (
            <>
              <button type="button" className="btn small" onClick={() => onDecide('rejected')}>
                Reject
              </button>
              <button type="button" className="btn small primary" onClick={() => onDecide('accepted')}>
                Accept
              </button>
            </>
          )}
        </div>
      </div>
      <pre aria-label={`Change ${index + 1}`}>
        {changes.flatMap((change, ci) =>
          change.value
            .replace(/\n$/, '')
            .split('\n')
            .map((line, li) => (
              <span key={`${ci}-${li}`} className={`line ${change.added ? 'add' : change.removed ? 'del' : ''}`}>
                {change.added ? '+ ' : change.removed ? '- ' : '  '}
                {line}
              </span>
            )),
        )}
      </pre>
      <div className="hunk-explanation">{hunk.explanation}</div>
    </div>
  );
}

export function DiffWidget({ widget, thread, state }: WidgetProps<'diff'>) {
  const current = state.get(thread.id);
  const hunks = current.hunks ?? {};
  const accepted = widget.hunks.filter((_, i) => hunks[String(i)] === 'accepted').length;

  function decide(index: number, status: 'accepted' | 'rejected' | undefined) {
    const next = { ...hunks };
    if (status) next[String(index)] = status;
    else delete next[String(index)];
    state.update(thread.id, { hunks: next });
    const allDecided = widget.hunks.every((_, i) => next[String(i)] !== undefined);
    if (allDecided) {
      const acceptedCount = Object.values(next).filter((s) => s === 'accepted').length;
      state.resolve(thread.id, `${acceptedCount} of ${widget.hunks.length} proposed changes accepted`);
    }
  }

  return (
    <WidgetFrame
      title={`Proposed changes · ${accepted}/${widget.hunks.length} accepted`}
      right={
        <button
          type="button"
          className="btn small"
          onClick={() => {
            const all: Record<string, 'accepted'> = {};
            widget.hunks.forEach((_, i) => (all[String(i)] = 'accepted'));
            state.update(thread.id, { hunks: all });
            state.resolve(thread.id, `All ${widget.hunks.length} proposed changes accepted`);
          }}
        >
          Accept all
        </button>
      }
    >
      {widget.hunks.map((hunk, i) => (
        <Hunk key={i} hunk={hunk} index={i} status={hunks[String(i)]} onDecide={(s) => decide(i, s)} />
      ))}
    </WidgetFrame>
  );
}
