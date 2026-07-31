export default function LoadingSpinner({ className = "h-8 w-8" }) {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-white/40 border-t-[var(--accent)] ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
