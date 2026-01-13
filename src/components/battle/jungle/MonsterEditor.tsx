// ==========================================
// FILE PATH: /src/components/battle/jungle/MonsterEditor.tsx
// ==========================================
import React from 'react';
import { JungleMonsterStats, BuffType } from '../../../types/jungle';
import { Sword, Shield, Heart, Coins, Clock, Zap, Type, Plus, Trash2, TrendingUp } from 'lucide-react';
import { RangeInput } from '../ui/PatchInputs';

interface Props {
  stats: JungleMonsterStats;
  onChange: (field: keyof JungleMonsterStats, value: any) => void;
}

export const MonsterEditor: React.FC<Props> = ({ stats, onChange }) => {
  
  // 버프 추가
  const addBuff = () => {
    const newBuffs = [...(stats.buffs || []), { type: 'ATK' as BuffType, value: 10 }];
    onChange('buffs', newBuffs);
  };

  // 버프 삭제
  const removeBuff = (index: number) => {
    const newBuffs = [...(stats.buffs || [])];
    newBuffs.splice(index, 1);
    onChange('buffs', newBuffs);
  };

  // 버프 수정
  const updateBuff = (index: number, field: 'type' | 'value', val: any) => {
    const newBuffs = [...(stats.buffs || [])];
    newBuffs[index] = { ...newBuffs[index], [field]: val };
    onChange('buffs', newBuffs);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px 15px' }}>
      
      {/* 1. 기본 정보 */}
      <div style={{ background: '#1f242e', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ fontSize: '11px', color: '#8b949e', marginBottom: '6px', display: 'flex', alignItems:'center', gap:'4px' }}>
            <Type size={12}/> 몬스터 이름
          </label>
          <input 
            type="text" value={stats.name} 
            onChange={(e) => onChange('name', e.target.value)}
            style={{ width: '100%', background: '#0d1117', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '6px', fontWeight: 'bold', fontSize:'14px', boxSizing:'border-box' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: stats.isBuffMob ? '15px' : '0' }}>
          <input 
            type="checkbox" checked={stats.isBuffMob} 
            onChange={(e) => onChange('isBuffMob', e.target.checked)}
            id="buffCheck"
            style={{ width: '18px', height: '18px', cursor:'pointer', accentColor: '#f1c40f' }}
          />
          <label htmlFor="buffCheck" style={{ flex: 1, cursor:'pointer' }}>
            <div style={{ fontSize: '13px', fontWeight: 'bold', color: stats.isBuffMob ? '#f1c40f' : '#ccc' }}>버프 몬스터 여부</div>
            <div style={{ fontSize: '11px', color: '#666' }}>체크 시 처치자에게 특별 효과 부여</div>
          </label>
        </div>

        {/* [수정] 다중 버프 리스트 UI */}
        {stats.isBuffMob && (
          <div style={{ animation: 'fadeIn 0.2s', background: '#2d2b18', padding:'10px', borderRadius:'6px', border:'1px solid #f1c40f' }}>
            <div style={{ fontSize:'12px', fontWeight:'bold', color:'#f1c40f', marginBottom:'10px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span>부여할 버프 목록 ({stats.buffs?.length || 0})</span>
                <button onClick={addBuff} style={{ background:'#f1c40f', color:'#000', border:'none', borderRadius:'4px', padding:'4px 8px', fontSize:'11px', fontWeight:'bold', cursor:'pointer', display:'flex', alignItems:'center', gap:'4px' }}>
                    <Plus size={12}/> 추가
                </button>
            </div>

            {(!stats.buffs || stats.buffs.length === 0) && (
                <div style={{ fontSize:'11px', color:'#aaa', textAlign:'center', padding:'10px' }}>버프를 추가해주세요.</div>
            )}

            {stats.buffs?.map((buff, idx) => (
                <div key={idx} style={{ marginBottom:'10px', paddingBottom:'10px', borderBottom: idx < stats.buffs.length-1 ? '1px dashed #555' : 'none' }}>
                    <div style={{ display:'flex', gap:'5px', marginBottom:'5px' }}>
                        <select 
                            value={buff.type}
                            onChange={(e) => updateBuff(idx, 'type', e.target.value)}
                            style={{ flex:1, background: '#161b22', border: '1px solid #f1c40f', color: '#fff', padding: '6px', borderRadius: '4px', fontSize:'11px' }}
                        >
                            <option value="ATK">⚔️ 공격력</option>
                            <option value="DEF">🛡️ 방어력</option>
                            <option value="SPEED">💨 이동속도</option>
                            <option value="REGEN">💖 재생</option>
                            <option value="HASSTE">⚡ 스킬가속</option>
                            <option value="GOLD">💰 골드</option>
                        </select>
                        <button onClick={() => removeBuff(idx)} style={{ background:'#3f1515', border:'1px solid #5a1e1e', color:'#ff6b6b', borderRadius:'4px', padding:'6px', cursor:'pointer' }}>
                            <Trash2 size={12}/>
                        </button>
                    </div>
                    <RangeInput 
                      label="수치" icon={<TrendingUp size={10}/>} 
                      value={buff.value} onChange={(v) => updateBuff(idx, 'value', v)} 
                      min={1} max={100} step={1} unit={buff.type === 'HASSTE' ? '' : '%'} color="#f1c40f" 
                    />
                </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. 전투 스탯 */}
      <div style={{ background: '#1f242e', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 15px 0', fontSize:'12px', color:'#ccc' }}>기본 능력치</h4>
        <RangeInput label="체력" icon={<Heart size={12}/>} value={stats.hp} onChange={(v) => onChange('hp', v)} min={100} max={20000} step={100} unit="" color="#2ecc71" />
        <RangeInput label="공격력" icon={<Sword size={12}/>} value={stats.atk} onChange={(v) => onChange('atk', v)} min={0} max={1000} step={10} unit="" color="#e74c3c" />
        <RangeInput label="방어력" icon={<Shield size={12}/>} value={stats.def} onChange={(v) => onChange('def', v)} min={0} max={300} step={5} unit="" color="#3498db" />
      </div>

      {/* 3. 보상 */}
      <div style={{ background: '#1f242e', padding: '15px', borderRadius: '8px', border: '1px solid #30363d' }}>
        <h4 style={{ margin:'0 0 15px 0', fontSize:'12px', color:'#e89d40' }}>보상 및 생성</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <RangeInput label="골드" icon={<Coins size={12}/>} value={stats.gold} onChange={(v) => onChange('gold', v)} min={0} max={1000} step={10} unit=" G" color="#f1c40f" />
          <RangeInput label="경험치" icon={<Zap size={12}/>} value={stats.xp} onChange={(v) => onChange('xp', v)} min={0} max={1000} step={10} unit=" XP" color="#9b59b6" />
        </div>
        <div style={{ marginTop: '10px' }}>
          <RangeInput label="리젠 시간" icon={<Clock size={12}/>} value={stats.respawnTime} onChange={(v) => onChange('respawnTime', v)} min={10} max={600} step={10} unit=" 초" color="#ccc" />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};
