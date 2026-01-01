// ==========================================
// FILE PATH: /src/components/user/TierSettingsModal.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Settings, Trophy, Swords } from 'lucide-react';
import { TierConfig } from '../../types';

export const TierSettingsModal = ({ onClose }: { onClose: () => void }) => {
  const { gameState, updateTierConfig } = useGameStore();

  // [수정] 기존 세이브 파일 호환성 처리 (promos가 없으면 기본값 주입)
  const [config, setConfig] = useState<TierConfig>(() => {
    const current = gameState.tierConfig;
    // 만약 promos 객체가 없다면(구버전 데이터라면) 기본값으로 초기화
    if (!current.promos) {
      return {
        ...current,
        promos: {
          master: 5,
          ace: 5,
          joker: 5,
          gold: 3,
          silver: 3,
          bronze: 3
        }
      };
    }
    return current;
  });

  const handleSave = () => {
    updateTierConfig(config);
    alert('티어 시스템 설정이 변경되었습니다.\n다음 승급전부터 적용됩니다.');
    onClose();
  };

  const handlePromoChange = (tier: keyof TierConfig['promos'], value: number) => {
    setConfig(prev => ({
      ...prev,
      promos: { ...prev.promos, [tier]: value }
    }));
  };

  // 티어별 설정 행 컴포넌트
  const TierRow = ({ label, keyName, color, promoKey }: { label: string, keyName: keyof TierConfig, color: string, promoKey: keyof TierConfig['promos'] }) => (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px', background:'#252528', padding:'10px', borderRadius:'8px', border:'1px solid #333' }}>

      {/* 왼쪽: 티어 이름 및 커트라인 */}
      <div style={{ display:'flex', alignItems:'center', gap:'15px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'10px', width:'100px' }}>
          <div style={{ width:'12px', height:'12px', borderRadius:'50%', background:color }}></div>
          <span style={{ color: color, fontWeight:'bold', fontSize:'14px' }}>{label}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
          <input 
            type="number" 
            value={config[keyName] as number} 
            onChange={(e) => setConfig({ ...config, [keyName]: parseInt(e.target.value) })}
            style={{ background:'#0d1117', border:'1px solid #444', color:'#fff', padding:'6px', borderRadius:'4px', width:'70px', textAlign:'right', fontWeight:'bold' }}
          />
          <span style={{ fontSize:'12px', color:'#888' }}>LP</span>
        </div>
      </div>

      {/* 오른쪽: 승급전 판수 선택 */}
      <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
        <Swords size={14} color="#666" />
        <select 
          value={config.promos ? config.promos[promoKey] : 3} // 안전하게 접근
          onChange={(e) => handlePromoChange(promoKey, parseInt(e.target.value))}
          style={{ background:'#0d1117', border:'1px solid #444', color:'#ccc', padding:'4px 8px', borderRadius:'4px', fontSize:'12px', cursor:'pointer' }}
        >
          <option value={3}>3전 2선승</option>
          <option value={5}>5전 3선승</option>
          <option value={7}>7전 4선승</option>
          <option value={9}>9전 5선승</option>
        </select>
      </div>
    </div>
  );

  return (
    <div style={{ position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.85)', display:'flex', justifyContent:'center', alignItems:'center', zIndex:2000, backdropFilter:'blur(5px)' }}>
      <div className="panel" style={{ width:'500px', background:'#161b22', border:'1px solid #30363d', borderRadius:'12px', padding:0, overflow:'hidden', boxShadow:'0 20px 50px rgba(0,0,0,0.5)' }}>

        {/* 헤더 */}
        <div style={{ padding:'20px', background:'#21262d', borderBottom:'1px solid #333', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ margin:0, display:'flex', alignItems:'center', gap:'10px', color:'#fff', fontSize:'16px' }}>
            <Settings size={18} /> 랭크 시스템 설정
          </h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#888', cursor:'pointer' }}><X size={20}/></button>
        </div>

        <div style={{ padding:'20px' }}>

          {/* 1. 챌린저 설정 */}
          <div style={{ marginBottom:'20px', paddingBottom:'15px', borderBottom:'1px dashed #333' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                <Trophy size={16} color="#00bfff" />
                <span style={{ color:'#00bfff', fontWeight:'bold' }}>챌린저 정원 (Ranking)</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'6px' }}>
                <span style={{ fontSize:'12px', color:'#888' }}>상위</span>
                <input 
                  type="number" 
                  value={config.challengerRank} 
                  onChange={(e) => setConfig({ ...config, challengerRank: parseInt(e.target.value) })}
                  style={{ background:'#00bfff22', border:'1px solid #00bfff', color:'#fff', padding:'6px', borderRadius:'4px', width:'60px', textAlign:'center', fontWeight:'bold' }}
                />
                <span style={{ fontSize:'12px', color:'#888' }}>위</span>
              </div>
            </div>
            <div style={{ fontSize:'11px', color:'#666', marginTop:'8px', marginLeft:'26px' }}>
              * 마스터 티어 점수를 넘긴 유저 중, 설정된 등수 안에 들어야 챌린저가 됩니다.
            </div>
          </div>

          {/* 2. 티어별 커트라인 및 승급전 설정 */}
          <div style={{ display:'flex', flexDirection:'column', gap:'5px', maxHeight:'400px', overflowY:'auto' }}>
            {config.promos && (
              <>
                <TierRow label="마스터" keyName="master" color="#9b59b6" promoKey="master" />
                <TierRow label="에이스" keyName="ace" color="#e74c3c" promoKey="ace" />
                <TierRow label="조커" keyName="joker" color="#2ecc71" promoKey="joker" />
                <TierRow label="골드" keyName="gold" color="#f1c40f" promoKey="gold" />
                <TierRow label="실버" keyName="silver" color="#95a5a6" promoKey="silver" />
                <TierRow label="브론즈" keyName="bronze" color="#d35400" promoKey="bronze" />
              </>
            )}
          </div>

        </div>

        <div style={{ padding:'20px', borderTop:'1px solid #333', background:'#21262d' }}>
          <button className="btn" style={{ width:'100%', background:'#238636', color:'#fff', display:'flex', justifyContent:'center', gap:'8px', padding:'12px', fontSize:'14px', borderRadius:'8px', border:'none', cursor:'pointer', fontWeight:'bold' }} onClick={handleSave}>
            <Save size={18} /> 설정 저장하기
          </button>
        </div>
      </div>
    </div>
  );
};