interface Props {
  emoji: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ emoji, title, subtitle, actionLabel, onAction }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
      <span className="text-5xl animate-scale-in">{emoji}</span>
      <h3 className="text-lg font-bold text-text-primary">{title}</h3>
      {subtitle && <p className="max-w-sm text-sm text-text-secondary">{subtitle}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-primary mt-4">
          {actionLabel}
        </button>
      )}
    </div>
  );
}
