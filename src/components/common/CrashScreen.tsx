import React from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Bug } from 'lucide-react';

interface Props {
  error: Error | null;
  resetErrorBoundary: () => void;
}

export const CrashScreen: React.FC<Props> = ({ error, resetErrorBoundary }) => {
  const handleCopy = () => {
    if (error) {
      // [수정] 문법 오류 수정
      navigator.clipboard.writeText(`Message: ${error.message}\nStack: ${error.stack}`);
      alert("오류 내용이 클립보드에 복사되었습니다.");
    }
  };

  const handleHardReset = () => {
    if (confirm("정말 모든 데이터를 삭제하고 초기화하시겠습니까? (복구 불가)")) {
      localStorage.clear();
      // IndexedDB 삭제
      const req = indexedDB.deleteDatabase('GodsWar_DB_V1');
      req.onsuccess = () => window.location.reload();
      req.onerror = () => window.location.reload();
      req.onblocked = () => window.location.reload();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#0f1115', color: '#fff',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '20px', fontFamily: 'sans-serif'
    }}>
      <div style={{
        maxWidth: '800px', width: '100%',
        background: '#161b22', border: '1px solid #da3633', borderRadius: '12px',
        padding: '30px', boxShadow: '0 20px 50px rgba(0,0,0,0.8)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', borderBottom: '1px solid #da3633', paddingBottom: '15px' }}>
          <div style={{ background: '#da3633', padding: '10px', borderRadius: '50%' }}>
            <Bug size={32} color="#fff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#da3633' }}>
              시스템 치명적 오류 발생
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#8b949e', fontSize: '14px' }}>
              게임 엔진이 안전을 위해 실행을 중단했습니다.
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#da3633' }}>ERROR MESSAGE:</label>
          <div style={{ background: '#0d1117', padding: '12px', borderRadius: '6px', border: '1px solid #30363d', color: '#fff', fontWeight: 'bold', marginTop: '5px' }}>
            {error?.message || "알 수 없는 오류"}
          </div>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#8b949e' }}>STACK TRACE:</label>
          <pre style={{ 
            background: '#0d1117', padding: '15px', borderRadius: '6px', border: '1px solid #30363d', 
            color: '#ccc', fontSize: '11px', overflow: 'auto', maxHeight: '200px', marginTop: '5px',
            fontFamily: 'Consolas, monospace', whiteSpace: 'pre-wrap' 
          }}>
            {error?.stack || "스택 정보가 없습니다."}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={handleCopy} style={{ display:'flex', alignItems:'center', gap:'6px', padding: '10px 15px', background: '#21262d', border: '1px solid #30363d', color: '#ccc', borderRadius: '6px', cursor: 'pointer' }}>
            <Copy size={16} /> 오류 복사
          </button>
          <button onClick={() => window.location.reload()} style={{ display:'flex', alignItems:'center', gap:'6px', padding: '10px 15px', background: '#238636', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <RefreshCw size={16} /> 재시작 (새로고침)
          </button>
          <button onClick={handleHardReset} style={{ display:'flex', alignItems:'center', gap:'6px', padding: '10px 15px', background: '#3f1515', border: '1px solid #da3633', color: '#da3633', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            <Trash2 size={16} /> 데이터 초기화 (비상용)
          </button>
        </div>
      </div>
    </div>
  );
};
