export default function EmptyState({ icon = "📭", title, message, action, suggestions = [], onSuggestionClick }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {icon && <p className="text-4xl">{icon}</p>}
      {title && <h2 className="mt-4 font-display text-2xl text-[var(--text-primary)]">{title}</h2>}
      {message && <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>}
      {suggestions.length > 0 && (
        <div className="mt-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]">
            Try searching
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {suggestions.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => onSuggestionClick?.(term)}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-[var(--text-primary)] transition hover:border-[var(--accent)]/40 hover:bg-[var(--accent)]/10"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
