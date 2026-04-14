"use client";

import React, { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: any;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", background: "#fee", color: "#900", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.toString()}</p>
          <details style={{ marginTop: "20px", cursor: "pointer" }}>
            <summary>Error details (check console)</summary>
            <pre>{this.state.errorInfo?.componentStack || "No component stack"}</pre>
          </details>
        </div>
      );
    }
    return this.props.children;
  }
}
