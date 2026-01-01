// src/components/battle/spectate/GlobalLogPanel.tsx
import React, { useMemo, useRef, useEffect } from 'react';

export const GlobalLogPanel = ({ logs, gameSpeed, formatTime }: any) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const visibleLogs = useMemo(() => {
    const filtered = logs.filter((log: any) => {
      if (gameSpeed === 1) return true; 
      return log.type !== 'DEBUG';      
    });
    return [...filtered].reverse().slice(0, 150); 
  }, [logs, gameSpeed]); 

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [visibleLogs.length]); 

  return (
    <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '10px', background: '#050505', maxHeight: '400px', display:'flex', flexDirection:'column', gap:'6px' }}>
      {visibleLogs.map((log: any, i: number) => {
        let badgeColor = '#888'; let badgeText = 'INFO'; 
        if (log.type === 'KILL') { badgeColor = '#ff4d4d'; badgeText = 'KILL'; }
        else if (log.type === 'DEBUG') { badgeColor = '#333'; badgeText = 'BTL'; } 
        else if (log.type === 'TOWER') { badgeColor = '#e89d40'; badgeText = 'OBJ'; }
        else if (log.type === 'START') { badgeColor = '#f1c40f'; badgeText = 'SYS'; }
        else if (log.type === 'DODGE') { badgeColor = '#7ee787'; badgeText = 'MISS'; }

        return (
          <div key={i} style={{ display: 'flex', gap: '8px', padding: '2px 0', borderBottom: '1px solid #1a1a1c', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '10px', color: '#555', fontFamily: 'monospace', minWidth: '40px' }}>{formatTime(log.time)}</span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '8px', fontWeight: '900', color: badgeColor, background: `${badgeColor}15`, padding: '0px 4px', borderRadius: '2px', border: `1px solid ${badgeColor}33`, minWidth:'28px', textAlign:'center' }}>{badgeText}</span>
                <span style={{ fontSize: log.type === 'DEBUG' ? '11px' : '12px', color: log.type === 'DEBUG' ? '#aaa' : '#fff', lineHeight: '1.4' }}>{log.message}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};