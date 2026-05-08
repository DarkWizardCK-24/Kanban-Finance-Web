export function Loading({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="spinner" />
      {message && <p className="text-sm text-text-secondary">{message}</p>}
    </div>
  );
}
