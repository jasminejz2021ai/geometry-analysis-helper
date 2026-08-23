import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time errors so the UI shows the problem instead of silently
 * breaking. Displays the error message and a reload button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Render error:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-6 shadow ring-1 ring-rose-200">
          <h2 className="text-lg font-semibold text-rose-700">
            Something went wrong rendering the page
          </h2>
          <pre className="mt-3 overflow-auto rounded-lg bg-rose-50 p-3 text-xs text-rose-800">
            {this.state.error.message}
          </pre>
          <button
            onClick={() => this.setState({ error: null })}
            className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
