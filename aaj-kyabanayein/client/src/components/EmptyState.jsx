export default function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      {icon && <p className="text-4xl">{icon}</p>}
      {title && <h2 className="mt-4 font-display text-2xl text-[var(--text-primary)]">{title}</h2>}
      {message && <p className="mt-2 text-sm text-[var(--text-secondary)]">{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
