import React from 'react';
import { UserProfile } from '../../../types';
import { TrendingUp, Target, Brain, Zap, Activity } from 'lucide-react';

interface Props { user: UserProfile; }

export const StatsOverview: React.FC<Props> = ({ user }) => {
  // 스탯 계산 (0~100)
  const combat = Math.min(100, user.winRate + 40);
  const brain = user.brain || 50;
  const mechanics = user.mechanics || 50;
  const activity = Math.min(100, 50 + (user.activityBias * 100));
  const potential = Math.min(100, (user.hiddenMmr / 3000) * 100);

  const getBarColor = (val: number) => {
    if (val >= 80) return '#e74c3c'; // 최상위 (빨강)
    if (val >= 60) return '#f1c40f'; // 상위 (노랑)
    if (val >= 40) return '#2ecc71'; // 중위 (초록)
    return '#8b949e'; // 하위 (회색)
  };

  const StatBar = ({ label, value, icon }: any) => (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#ccc', marginBottom: '2px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>{icon} {label}</div>
        <span style={{ fontWeight: 'bold', color: getBarColor(value) }}>{value.toFixed(0)}</span>
      </div>
      <div style={{ width: '100%', height: '6px', background: '#30363d', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ width: `${value}%`, height: '100%', background: getBarColor(value), borderRadius: '3px' }} />
      </div>
    </div>
  );

  // 성향 태그 생성
  const tags = [];
  if (user.playStyle === 'HARDCORE') tags.push({ label: '🔥 폐인', color: '#da3633' });
  if (user.playStyle === 'WORKER') tags.push({ label: '💼 직장인', color: '#3498db' });
  if (user.playStyle === 'STUDENT') tags.push({ label: '🎓 급식', color: '#f1c40f' });
  if (user.playStyle === 'NIGHT_OWL') tags.push({ label: '🌙 올빼미', color: '#9b59b6' });
  
  if (user.winRate >= 55) tags.push({ label: '🏆 승리왕', color: '#e74c3c' });
  else if (user.winRate <= 45) tags.push({ label: '📉 연패중', color: '#7f8c8d' });

  if (brain > 70) tags.push({ label: '🧠 뇌지컬', color: '#2ecc71' });
  if (mechanics > 70) tags.push({ label: '⚡ 피지컬', color: '#e67e22' });

  return (
    <div style={{ background: '#1c1c1f', borderRadius: '12px', padding: '20px', border: '1px solid #30363d' }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Activity size={16} color="#58a6ff"/> 플레이어 분석
      </h3>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '20px' }}>
        {tags.map((t, i) => (
          <span key={i} style={{ fontSize: '11px', color: t.color, border: `1px solid ${t.color}44`, background: `${t.color}11`, padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>
            {t.label}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        <StatBar label="전투력" value={combat} icon={<TrendingUp size={10}/>} />
        <StatBar label="운영능력" value={brain} icon={<Brain size={10}/>} />
        <StatBar label="컨트롤" value={mechanics} icon={<Zap size={10}/>} />
        <StatBar label="성장력" value={potential} icon={<Target size={10}/>} />
      </div>
      
      <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #30363d', fontSize: '11px', color: '#888', textAlign: 'center' }}>
        * 최근 50경기 데이터를 기반으로 AI가 분석한 지표입니다.
      </div>
    </div>
  );
};
