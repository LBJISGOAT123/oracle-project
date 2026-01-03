// ==========================================
// FILE PATH: /src/components/battle/SpectateModal.tsx
// ==========================================
import React, { Component, ErrorInfo, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { DraftScreen } from './spectate/DraftScreen';
import { InGameScreen } from './spectate/InGameScreen';
import { AlertTriangle } from 'lucide-react';
import { Hero } from '../../types';

// 에러 바운더리 (그대로 유지)
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, errorMsg: string }> {
  constructor(props: any) { super(props); this.state = { hasError: false, errorMsg: "" }; }
  static getDerivedStateFromError(error: any) { return { hasError: true, errorMsg: error.toString() }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', color: '#ff6b6b', textAlign: 'center', background:'#111', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center' }}>
          <AlertTriangle size={40} style={{ marginBottom: '20px' }} />
          <h3>화면 로드 실패</h3>
          <p style={{ fontSize: '12px', color: '#888' }}>{this.state.errorMsg}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop:'20px', padding:'10px', cursor:'pointer' }}>새로고침</button>
        </div>
      );
    }
    return this.props.children;
  }
}

// 메인 컨텐츠 분기 처리
const SpectateContent: React.FC<any> = ({ match: initialMatch, onClose }) => {
  // Store 구독 (실시간 데이터)
  const match = useGameStore(state => state.gameState.liveMatches.find(m => m.id === initialMatch.id));
  const { heroes, setSpeed, gameState } = useGameStore();

  const [viewingBanHero, setViewingBanHero] = useState<Hero | null>(null);

  if (!match) {
    return (
      <div style={{color:'white', padding:'20px', textAlign:'center', display:'flex', flexDirection:'column', height:'100%', justifyContent:'center', alignItems:'center'}}>
        <h3 style={{marginBottom:'20px'}}>게임이 종료되었습니다.</h3>
        <button onClick={onClose} style={{padding:'10px 30px', cursor:'pointer', background:'#333', color:'#fff', border:'1px solid #555', borderRadius:'8px'}}>나가기</button>
      </div>
    );
  }

  // 밴픽 화면
  if (match.status === 'DRAFTING' && (match.draft?.turnIndex || 0) < 20) {
    return (
      <DraftScreen 
        match={match} heroes={heroes} onClose={onClose} 
        setSpeed={setSpeed} gameState={gameState}
        onBanClick={setViewingBanHero}
      />
    );
  }

  // 인게임 화면
  return <InGameScreen match={match} onClose={onClose} />;
};

export const SpectateModal: React.FC<any> = (props) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#050505', zIndex: 30000 }}>
      <ErrorBoundary>
        <SpectateContent {...props} />
      </ErrorBoundary>
    </div>
  );
};