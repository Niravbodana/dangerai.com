import { Component } from "react";
import { getEmptyState } from "./errors";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (typeof window !== "undefined" && window.__RASOIRA_DEBUG__) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    const { error } = this.state;
    if (error) {
      const empty = getEmptyState("error");
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
          <p className="text-4xl">⚠️</p>
          <h1 className="mt-4 font-display text-2xl text-[var(--text-primary)]">{empty.title}</h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {error.message || empty.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ error: null });
              window.location.href = "/";
            }}
            className="premium-btn mt-6 px-6 py-3 text-sm"
          >
            {empty.actionLabel}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
