import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return <main style={{ minHeight: "100vh", padding: 32, fontFamily: "sans-serif" }}>
        <h1>Something went wrong while loading Samruddhi.</h1>
        <pre style={{ whiteSpace: "pre-wrap" }}>{this.state.error.message}</pre>
      </main>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppErrorBoundary><BrowserRouter><App /></BrowserRouter></AppErrorBoundary>
);
