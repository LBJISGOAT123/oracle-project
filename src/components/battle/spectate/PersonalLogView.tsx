// ==========================================
// FILE PATH: /src/components/battle/spectate/PersonalLogView.tsx
// ==========================================
import React, { useMemo, useRef, useEffect } from 'react';
import { Activity } from 'lucide-react';

export const PersonalLogView = ({ logs, heroName, summonerName, formatTime }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const filteredLogs = useMemo(() => {
    return logs.filter((log: any) => 
      log.message.includes(heroName) || log.message.includes(summonerName)
    ).reverse().slice(0, 50); 
  }, [logs, heroName, summonerName]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [filteredLogs.length]);

  return (
    <div style={{ width: '100%', maxWidth: '450px', background: '#08080a', borderRadius: '8px', border: '1px solid #222', marginTop: '15px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 12px', background: '#121214', borderBottom: '1px solid #222', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={12} color="#58a6ff" />
        <span style={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}>{heroName} 활동 내역</span>
      </div>
      <div ref={scrollRef} style={{ height: '200px', overflowY: 'auto', padding: '8px' }}>
        {filteredLogs.length > 0 ? filteredLogs.map((log: any, i: number) => (
          <div key={i} style={{ fontSize: '11px', padding: '5px 0', borderBottom: '1px solid #1a1a1c', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#555', fontFamily: 'monospace', flexShrink: 0 }}>{formatTime(log.time)}</span>
            <span style={{ color: log.type === 'KILL' ? '#ff4d4d' : '#ccc', lineHeight: '1.4' }}>{log.message}</span>
          </div>
        )) : (
          <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: '11px' }}>기록이 없습니다.</div>
        )}
      </div>
    </div>
  );
};