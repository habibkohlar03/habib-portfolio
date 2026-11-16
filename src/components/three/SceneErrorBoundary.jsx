import { Component } from 'react';

// Catches WebGL / asset-loading failures so the rest of the site keeps working.
export default class SceneErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    if (typeof this.props.onError === 'function') this.props.onError(error);
    if (import.meta.env && import.meta.env.DEV) console.warn('[3D] scene error:', error);
  }

  render() {
    return this.state.failed ? this.props.fallback ?? null : this.props.children;
  }
}
