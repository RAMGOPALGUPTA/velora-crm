import React from "react";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CRM render error:", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <p className="eyebrow eyebrow-dark">UI Error</p>
            <h1 className="section-title">The CRM screen hit a render error.</h1>
            <p className="section-subtitle">
              A component crashed while loading. The error is shown below so we can fix it quickly.
            </p>
            <pre className="error-pre">{String(this.state.error?.message || this.state.error)}</pre>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AppErrorBoundary;
