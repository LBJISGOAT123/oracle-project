// ==========================================
// FILE PATH: /src/components/battle/BattlefieldTab.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Shield, Skull, Ghost, Circle, Wrench, Sword, Heart, Coins, Layers, Zap, Clock, Star } from 'lucide-react';
import { BattlefieldPatchModal } from './BattlefieldPatchModal';
import { JUNGLE_CONFIG } from '../../data/jungle';

export const BattlefieldTab: React.FC = () => {
  const { gameState } = useGameStore();
  const settings = gameState.fieldSettings;

  const [editingTarget, setEditingTarget] = useState<{ key: string, title: string, color: string } | null>(null);

  if (!settings) return <div>설정 로딩 중...</div>;

  // [UI 헬퍼] 스탯 배지 (아이콘 + 수치)
  const StatBadge = ({ icon, value, unit, color }: any) => (
    <div style={{ 
      display: 'flex', alignItems: 'center', gap: '4px', 
      background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '6px',
      fontSize: '11px', color: '#ccc', border: `1px solid ${color}33`
    }}>
      {React.cloneElement(icon, { size: 10, color: color })}
      <span style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
        {value}{unit}
      </span>
    </div>
  );

  // [UI 컴포넌트] 오브젝트 카드
  const ObjectCard = ({ title, engTitle, desc, icon, color, targetKey }: any) => {
    const data = (settings as any)[targetKey];

    const renderStats = () => {
      switch(targetKey) {
        case 'jungle':
          return (
            <>
              <StatBadge icon={<Layers/>} value={data.density} unit="%" color={color} />
              {/* [신규] 골드/경험치 표시 추가 */}
              <StatBadge icon={<Coins/>} value={data.gold} unit="G" color="#f1c40f" />
              <StatBadge icon={<Star/>} value={data.xp} unit="XP" color="#e89d40" />
              <StatBadge icon={<Sword/>} value={data.attack} unit="" color="#ff6b6b" />
            </>
          );
        case 'colossus':
          return (
            <>
              <StatBadge icon={<Heart/>} value={(data.hp / 1000).toFixed(0) + 'k'} unit="" color="#2ecc71" />
              <StatBadge icon={<Sword/>} value={data.attack} unit="" color="#ff6b6b" />
              <StatBadge icon={<Shield/>} value={data.armor} unit="" color="#58a6ff" />
              <StatBadge icon={<Coins/>} value={data.rewardGold} unit="G" color="#f1c40f" />
            </>
          );
        case 'watcher':
          return (
            <>
              <StatBadge icon={<Heart/>} value={(data.hp / 1000).toFixed(0) + 'k'} unit="" color="#2ecc71" />
              <StatBadge icon={<Zap/>} value={data.buffAmount} unit="%" color="#f1c40f" />
              <StatBadge icon={<Clock/>} value={data.buffDuration} unit="s" color="#ccc" />
              <StatBadge icon={<Shield/>} value={data.armor} unit="" color="#58a6ff" />
            </>
          );
        case 'tower':
          return (
            <>
              <StatBadge icon={<Heart/>} value={(data.hp / 1000).toFixed(0) + 'k'} unit="" color="#2ecc71" />
              <StatBadge icon={<Shield/>} value={data.armor} unit="" color="#58a6ff" />
              <StatBadge icon={<Coins/>} value={data.rewardGold} unit="G" color="#f1c40f" />
            </>
          );
        default: return null;
      }
    };

    return (
      <div style={{ 
        background: '#161b22', 
        border: `1px solid ${color}44`, 
        borderRadius: '12px', 
        marginBottom: '10px',
        overflow: 'hidden'
      }}>
        {/* 헤더 */}
        <div style={{ 
          padding: '12px 15px', 
          background: `linear-gradient(90deg, ${color}15, transparent)`, 
          borderBottom: `1px solid ${color}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ 
              width: '32px', height: '32px', borderRadius: '8px', 
              background: '#0d1117', border: `1px solid ${color}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {React.cloneElement(icon, { size: 18, color: color })}
            </div>
            <div style={{ display:'flex', flexDirection:'column' }}>
              <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', lineHeight:'1.2' }}>{title}</span>
              <span style={{ fontSize: '10px', color: color, fontWeight:'bold', opacity:0.8 }}>{engTitle}</span>
            </div>
          </div>

          <button 
            onClick={() => setEditingTarget({ key: targetKey, title, color })}
            style={{ 
              background: '#21262d', border: '1px solid #444', 
              color: '#fff', padding: '6px 12px', borderRadius: '6px', 
              cursor: 'pointer', fontWeight: 'bold', fontSize: '11px',
              display: 'flex', alignItems: 'center', gap: '4px'
            }}
          >
            <Wrench size={12}/> 패치
          </button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '12px 15px' }}>
          <div style={{ fontSize: '12px', color: '#8b949e', marginBottom: '10px', lineHeight:'1.4' }}>
            {desc}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {renderStats()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ paddingBottom: '80px', display:'flex', flexDirection:'column', gap:'5px' }}>

      <ObjectCard 
        title="혼돈의 균열" engTitle="CHAOS RIFT"
        desc={JUNGLE_CONFIG.DESCRIPTION} 
        icon={<Ghost/>} 
        color="#d580ff" 
        targetKey="jungle"
      />

      <ObjectCard 
        title="거신병" engTitle="COLOSSUS"
        desc="파괴 시 포탑을 철거하는 공성 병기" 
        icon={<Skull/>} 
        color="#7ee787" 
        targetKey="colossus"
      />

      <ObjectCard 
        title="공허의 주시자" engTitle="THE WATCHER"
        desc="처치 시 팀 전체에 강력한 버프 부여" 
        icon={<Circle/>} 
        color="#a371f7" 
        targetKey="watcher"
      />

      <ObjectCard 
        title="방어 포탑" engTitle="DEFENSE TOWER"
        desc="라인을 지키는 1차 방어선" 
        icon={<Shield/>} 
        color="#58a6ff" 
        targetKey="tower"
      />

      {editingTarget && (
        <BattlefieldPatchModal 
          targetKey={editingTarget.key} 
          title={editingTarget.title} 
          color={editingTarget.color} 
          onClose={() => setEditingTarget(null)} 
        />
      )}

    </div>
  );
};