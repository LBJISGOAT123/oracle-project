// ==========================================
// FILE PATH: /src/components/layout/Header.tsx
// ==========================================

import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Settings, Save, Play, Pause } from 'lucide-react';

interface Props {
  isMobile: boolean;
  onOpenSystemMenu: () => void;
}

export const Header: React.FC<Props> = ({ isMobile, onOpenSystemMenu }) => {
  const { gameState, togglePlay, setSpeed } = useGameStore();

  // [수정] 시간을 00:00:00 형태로 깔끔하게 포맷팅
  const formatTime = (h: number, m: number, s: number) => 
    `${String(h || 0).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}:${String(Math.floor(s || 0)).padStart(2, '0')}`;

  // 배속 버튼 스타일
  const getBtnStyle = (speed: number) => ({
    padding: '6px 10px', 
    background: gameState.gameSpeed === speed ? '#58a6ff' : '#30363d',
    border: '1px solid #444', 
    borderRadius: '6px', 
    color: '#fff', 
    fontSize: '11px', 
    fontWeight: 'bold',
    cursor: 'pointer',
    minWidth: '40px'
  });

  return (
    <header style={{ 
      display: 'flex', flexDirection: isMobile ? 'column' : 'row', 
      justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', 
      marginBottom: '20px', background: '#161b22', padding: '15px', 
      borderRadius: '12px', border: '1px solid #30363d', gap: isMobile ? '15px' : '0' 
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', color: '#fff' }}>
            ORACLE <span style={{ fontSize:'12px', background:'#58a6ff', color:'#000', padding:'2px 6px', borderRadius:'4px', fontWeight:'bold'}}>PRO</span>
          </h1>
          <div style={{ display: 'flex', gap: '15px', marginTop: '5px', fontSize: '14px', color: '#8b949e' }}>
            <span>📅 S{gameState.season || 1}</span>
            <span>D{gameState.day || 1}</span>
            <span style={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}>
              {/* [수정] 여기서 Math.floor를 적용하여 소수점을 제거합니다 */}
              ⏰ {formatTime(gameState.hour, gameState.minute, gameState.second)}
            </span>
          </div>
        </div>
        {isMobile && (
          <button onClick={onOpenSystemMenu} style={{ background:'none', border:'none', color:'#8b949e' }}>
            <Settings size={24} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: isMobile ? 'space-between' : 'flex-end' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          {!isMobile && (
            <button className="btn" onClick={onOpenSystemMenu} style={{ background: '#21262d', color: '#ccc', border:'1px solid #30363d', display:'flex', alignItems:'center', gap:'6px', padding: '8px 12px', marginRight:'10px' }}>
              <Save size={16}/> 저장/로드
            </button>
          )}

          <button style={getBtnStyle(1)} onClick={() => setSpeed(1)}>1초</button>
          <button style={getBtnStyle(60)} onClick={() => setSpeed(60)}>1분</button>
          <button style={getBtnStyle(600)} onClick={() => setSpeed(600)}>10분</button>
        </div>

        <button className="btn" onClick={togglePlay} style={{ background: gameState.isPlaying ? '#da3633' : '#238636', width: '80px', color:'white', fontWeight:'bold', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px' }}>
          {gameState.isPlaying ? <><Pause size={16}/> 정지</> : <><Play size={16}/> 재생</>}
        </button>
      </div>
    </header>
  );
};