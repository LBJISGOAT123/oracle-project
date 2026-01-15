import React, { Component, ErrorInfo, ReactNode } from 'react';
import { CrashScreen } from '../components/common/CrashScreen';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  resetKey: number; // 컴포넌트 강제 리마운트용 키
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, resetKey: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    // DOM 관련 에러나 ChunkLoad 에러는 치명적이지 않다고 판단, 자동 복구 시도
    const msg = error.message || "";
    if (
      msg.includes("removeChild") || 
      msg.includes("insertBefore") || 
      msg.includes("NotFound") || 
      msg.includes("Loading chunk")
    ) {
      // 에러 상태를 true로 만들지 않고, 그냥 넘어가거나
      // 리렌더링을 유도하기 위해 null 반환 (하지만 라이프사이클상 state 반환 필요)
      return { hasError: true, error, resetKey: 0 };
    }
    return { hasError: true, error, resetKey: 0 };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const msg = error.message || "";
    
    // [핵심] DOM 노드 불일치 에러는 무시하고 자동 복구
    if (
      msg.includes("removeChild") || 
      msg.includes("insertBefore") || 
      msg.includes("node to be removed")
    ) {
      console.warn("[Auto-Recovery] DOM Mismatch detected. Remounting app...");
      this.handleRecover();
      return;
    }
    
    console.error("React Error Boundary Caught:", error, errorInfo);
  }

  handleRecover = () => {
    // 에러 상태 해제 및 키 변경으로 리마운트 유도
    setTimeout(() => {
      this.setState(prev => ({ hasError: false, error: null, resetKey: prev.resetKey + 1 }));
    }, 50);
  };

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || "";
      
      // DOM 에러인 경우 UI를 그리지 않고 복구를 기다림 (빈 화면 0.05초)
      if (
        msg.includes("removeChild") || 
        msg.includes("insertBefore") || 
        msg.includes("node to be removed")
      ) {
        return <div style={{ background:'#0f1115', width:'100vw', height:'100vh' }} />;
      }

      // 그 외 진짜 치명적인 에러만 빨간 화면 표시
      return <CrashScreen error={this.state.error} resetErrorBoundary={this.resetErrorBoundary} />;
    }

    return (
      <React.Fragment key={this.state.resetKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}
