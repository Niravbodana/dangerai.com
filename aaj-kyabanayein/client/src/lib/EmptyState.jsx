import { Link } from "react-router-dom";
import { getEmptyState } from "./errors";

export default function EmptyState({
  state = "generic",
  title,
  message,
  action,
  actionLabel,
  onRetry,
}) {
  const cfg = getEmptyState(state);
  const heading = title || cfg.title;
  const body = message || cfg.message;
  const href = action !== undefined ? action : cfg.action;
  const label = actionLabel || cfg.actionLabel;

  return (
    <div className="recipe-card p-8 text-center sm:p-12">
      <p className="font-display text-lg text-[var(--text-primary)]">{heading}</p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{body}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className="premium-btn-outline mt-5 px-5 py-2.5 text-sm">
          Retry
        </button>
      )}
      {!onRetry && href && label && (
        <Link to={href} className="premium-btn mt-5 inline-block px-5 py-2.5 text-sm">
          {label}
        </Link>
      )}
    </div>
  );
}
