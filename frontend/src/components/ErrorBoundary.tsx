import React, { Component, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-3xl mx-auto px-6 py-8">
                    <div className="bg-red-900/50 border border-red-500 rounded-lg p-6 text-red-200">
                        <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
                        <p className="mb-4"><strong>Error:</strong> {this.state.error?.message}</p>
                        <details className="mb-4">
                            <summary className="cursor-pointer text-red-300">Stack trace</summary>
                            <pre className="mt-2 text-xs overflow-auto bg-red-950 p-2 rounded">
                                {this.state.error?.stack}
                            </pre>
                        </details>
                        <button
                            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
