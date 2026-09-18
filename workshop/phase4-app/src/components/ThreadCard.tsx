import { useState } from 'react';
import type { Thread } from '@workshop/phase3-threads/schema';
import type { ThreadStateApi } from '../state/useThreadState';
import { Badge, SeverityBadge } from './Badge';
import { CommentList } from './CommentList';

interface Props {
  thread: Thread;
  state: ThreadStateApi;
  defaultOpen?: boolean;
}

export function ThreadCard({ thread, state, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const current = state.get(thread.id);
  const resolved = current.status === 'resolved';

  return (
    <article className={`thread ${resolved ? 'resolved' : ''}`} id={thread.id}>
      <header
        className="thread-header"
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen((o) => !o);
          }
        }}
      >
        <span className={`chevron ${open ? 'open' : ''}`} aria-hidden="true">
          ▶
        </span>
        <div>
          <h2>{thread.title}</h2>
          <div className="meta">
            <SeverityBadge severity={thread.severity} />
            <Badge>{thread.category}</Badge>
            {resolved && <Badge className="status-resolved">resolved</Badge>}
            <Badge className="hint" title="ui_hint chosen by the model in Phase 3">
              {thread.ui_hint}
            </Badge>
            <span>{thread.source_comments.length} comments</span>
            <span className="files">{thread.files.length === 1 ? thread.files[0] : `${thread.files.length} files`}</span>
          </div>
        </div>
        <span className="muted">{thread.id}</span>
      </header>

      {open && (
        <div className="thread-body">
          <p className="thread-summary">{thread.summary}</p>
          {current.decision && (
            <p className="thread-summary">
              <strong>Decision:</strong> {current.decision}
            </p>
          )}

          <ul className="thread-actions">
            {thread.suggested_actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>

          <CommentList ids={thread.source_comments} />

          <div className="thread-footer">
            {resolved ? (
              <button type="button" className="btn small" onClick={() => state.reopen(thread.id)}>
                Reopen
              </button>
            ) : (
              <button type="button" className="btn small primary" onClick={() => state.resolve(thread.id)}>
                Resolve thread
              </button>
            )}
            <span className="muted" style={{ fontSize: '0.8rem' }}>
              {thread.files.join(' · ')}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}
