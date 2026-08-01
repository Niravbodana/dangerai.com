import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) {
      console.error("[ErrorBoundary]", error, info);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center px-4">
          <div className="max-w-md text-center">
            <p className="text-4xl">⚠️</p>
            <h1 className="mt-4 font-display text-2xl text-[var(--text-primary)]">Something went wrong</h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              An unexpected error occurred. Please refresh the page.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="premium-btn mt-6 px-6 py-2.5 text-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
