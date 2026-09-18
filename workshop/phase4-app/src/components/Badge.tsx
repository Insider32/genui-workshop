interface Props {
  children: string;
  className?: string;
  title?: string;
}

export function Badge({ children, className = '', title }: Props) {
  return (
    <span className={`badge ${className}`} title={title}>
      {children}
    </span>
  );
}

const SEVERITY_ICON: Record<string, string> = {
  critical: '⛔',
  high: '▲',
  medium: '●',
  low: '○',
};

export function SeverityBadge({ severity }: { severity: string }) {
  return <Badge className={`severity-${severity}`}>{`${SEVERITY_ICON[severity] ?? ''} ${severity}`}</Badge>;
}
