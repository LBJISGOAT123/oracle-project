import React from 'react';
import { X, Play, Pause } from 'lucide-react';
import { SpeedButton } from '../SpectateUI';

interface Props {
  score: { blue: number; red: number };
  timeStr: string;
  isGameEnded: boolean;
  isPlaying: boolean;
  gameSpeed: number;
  onTogglePlay: () => void;
  onSetSpeed: (s: number) => void;
  onClose: () => void;
  isMobile: boolean;
  mobileTab: 'LIST' | 'MAP';
  setMobileTab: (t: 'LIST' | 'MAP') => void;
}

export const SpectateHeader: React.FC<Props> = ({ 
  score, timeStr, isGameEnded, isPlaying, gameSpeed, 
  onTogglePlay, onSetSpeed, onClose, isMobile, mobileTab, setMobileTab 
}) => {
  return (
    <div style={{ flexShrink: 0, background: '#1a1a1a', borderBottom: '1px solid #333', padding: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom:'8px' }}>
        <div style={{ display:'flex', gap:'20px', alignItems:'center', flex:1, justifyContent:'center' }}>
            <span style={{ color: '#58a6ff', fontWeight: '900', fontSize:'22px', minWidth:'30px', textAlign:'right' }}>{score.blue}</span>
            <div style={{ background:'#000', padding:'4px 12px', borderRadius:'20px', border:'1px solid #444', color:'#fff', fontSize:'14px', fontFamily:'monospace', fontWeight:'bold' }}>
              {isGameEnded ? 'END' : timeStr}
            </div>
            <span style={{ color: '#e84057', fontWeight: '900', fontSize:'22px', minWidth:'30px', textAlign:'left' }}>{score.red}</span>
        </div>
        <button onClick={onClose} style={{ position:'absolute', right:'10px', top:'10px', background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={24}/></button>
      </div>
      
      <div style={{ display:'flex', justifyContent:'center', gap:'8px' }}>
          <button onClick={onTogglePlay} style={{ width:'50px', height:'28px', borderRadius:'4px', background: isPlaying ? '#ff7675' : '#55efc4', color:'#000', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
          </button>
          
          {/* [수정] 배속 옵션 변경: 1배, 5배, 10배 */}
          {[1, 5, 10].map(s => (
            <SpeedButton key={s} label={`${s}배`} speed={s} currentSpeed={gameSpeed} setSpeed={onSetSpeed} />
          ))}
      </div>
      
      {isMobile && (
        <div style={{ display:'flex', marginTop:'10px', borderTop:'1px solid #333', paddingTop:'8px' }}>
          <button onClick={()=>setMobileTab('LIST')} style={{ flex:1, padding:'8px', background: mobileTab==='LIST'?'#333':'transparent', border:'none', color: mobileTab==='LIST'?'#fff':'#777', fontWeight:'bold', borderBottom: mobileTab==='LIST'?'2px solid #fff':'none' }}>📋 선수 정보</button>
          <button onClick={()=>setMobileTab('MAP')} style={{ flex:1, padding:'8px', background: mobileTab==='MAP'?'#333':'transparent', border:'none', color: mobileTab==='MAP'?'#fff':'#777', fontWeight:'bold', borderBottom: mobileTab==='MAP'?'2px solid #fff':'none' }}>🗺️ 실시간 맵</button>
        </div>
      )}
    </div>
  );
};
