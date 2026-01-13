import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CrashScreen } from '../components/common/CrashScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // CrashScreen 컴포넌트가 렌더링되다가 죽을 수도 있으므로 안전장치
      try {
        return <CrashScreen error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
      } catch (e) {
        return <div style={{color:'white', padding:20}}>Double Crash: Error Boundary failed. Check Console.</div>;
      }
    }
    return this.props.children;
  }
}
