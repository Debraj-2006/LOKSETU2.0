const STATUS_CONFIG = {
  pending:     { label: 'Pending',     dot: '🟡', cls: 'badge-pending' },
  in_progress: { label: 'In Progress', dot: '🔵', cls: 'badge-in_progress' },
  resolved:    { label: 'Resolved',    dot: '🟢', cls: 'badge-resolved' },
  cancelled:   { label: 'Cancelled',   dot: '⚫', cls: 'badge-cancelled' },
};

export default function StatusBadge({ status, escalated = false }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={cfg.cls}>
      <span>{cfg.dot}</span>
      {cfg.label}
      {escalated && status !== 'resolved' && status !== 'cancelled' && (
        <span className="ml-1 badge-escalated">🔴 Escalated</span>
      )}
    </span>
  );
}
