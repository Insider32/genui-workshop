import { commentById, personas } from '../data';

interface Props {
  ids: string[];
}

/** Renders a comment body with fenced code blocks as <pre>. */
function Body({ text }: { text: string }) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return (
    <div className="comment-body">
      {parts.map((part, i) =>
        part.startsWith('```') ? (
          <pre key={i}>{part.replace(/^```\w*\n?/, '').replace(/```$/, '')}</pre>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

export function CommentList({ ids }: Props) {
  const items = ids.map((id) => commentById.get(id)).filter((c) => c !== undefined);
  return (
    <details className="comments">
      <summary>
        {items.length} source comment{items.length === 1 ? '' : 's'}
      </summary>
      {items.map((c) => (
        <div className="comment" key={c.id}>
          <div className="comment-head">
            <span className="author">
              {personas[c.author].emoji} {c.author}
            </span>
            <span>{c.severity}</span>
            <code>
              {c.path}:{c.line}
            </code>
            <code>{c.id}</code>
          </div>
          <Body text={c.body} />
        </div>
      ))}
    </details>
  );
}
