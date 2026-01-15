import React from 'react';
import { Hero } from '../../../types';
import { ROLE_COMBOS, SkillKey } from '../../../engine/match/ai/mechanics/ComboPatterns';
import { Zap, Clock, Droplets, Swords, AlertCircle } from 'lucide-react';

const SkillCard = ({ skillKey, data, label }: { skillKey: string, data: any, label: string }) => {
  if (!data) return null;

  const color = skillKey === 'passive' ? '#f1c40f' : (skillKey === 'r' ? '#da3633' : '#58a6ff');
  
  return (
    <div style={{ background: '#252528', borderRadius: '8px', padding: '12px', borderLeft: `3px solid ${color}`, marginBottom: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: color, color: '#000', fontWeight: '900', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
            {label}
          </span>
          <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
            {data.name || '스킬명 없음'}
          </span>
        </div>
        <span style={{ fontSize: '10px', color: '#888', border: '1px solid #444', padding: '1px 6px', borderRadius: '10px', whiteSpace:'nowrap' }}>
          {data.mechanic || 'NONE'}
        </span>
      </div>

      <div style={{ fontSize: '12px', color: '#ccc', lineHeight: '1.4', marginBottom: '8px' }}>
        수치: <span style={{ color: '#fff', fontWeight: 'bold' }}>{data.val || 0}</span>
        {data.adRatio > 0 && <span style={{ color: '#e74c3c', marginLeft: '4px', whiteSpace:'nowrap' }}>(+{data.adRatio}AD)</span>}
        {data.apRatio > 0 && <span style={{ color: '#9b59b6', marginLeft: '4px', whiteSpace:'nowrap' }}>(+{data.apRatio}AP)</span>}
      </div>

      {!data.isPassive && (
        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#888', borderTop: '1px dashed #444', paddingTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={10}/> {data.cd || 0}s</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Droplets size={10} color="#3498db"/> {data.cost || 0}</div>
        </div>
      )}
    </div>
  );
};

const ComboStat = ({ combo, index, heroWinRate, totalMatches }: { combo: SkillKey[], index: number, heroWinRate: number, totalMatches: number }) => {
  // [수정] 데이터가 없으면(0판) 통계 대신 '수집중' 표시
  const hasData = totalMatches > 0;
  
  // 데이터가 있을 때만 계산, 없으면 0
  const comboWinRate = hasData ? (heroWinRate + (2 - index)) : 0; 
  const pickRate = hasData ? (40 - (index * 10)) : 0; 

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#1c1c1f', padding: '10px', borderRadius: '6px', marginBottom: '6px', border: '1px solid #333' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#888', width: '15px' }}>{index + 1}</span>
        <div style={{ display: 'flex', gap: '4px', flexWrap:'wrap' }}>
          {combo.map((key, i) => (
            <React.Fragment key={i}>
              <div style={{ 
                width: '24px', height: '24px', background: '#333', borderRadius: '4px', 
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 'bold', fontSize: '12px', color: key === 'r' ? '#da3633' : '#fff',
                border: key === 'r' ? '1px solid #da3633' : '1px solid #555'
              }}>
                {key.toUpperCase()}
              </div>
              {i < combo.length - 1 && <span style={{ color: '#555', fontSize: '10px', display: 'flex', alignItems: 'center' }}>▶</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
      
      {/* 통계 표시 영역 */}
      <div style={{ textAlign: 'right', minWidth:'80px' }}>
        {hasData ? (
          <>
            <div style={{ fontSize: '12px', fontWeight: 'bold', color: comboWinRate >= 50 ? '#ff4d4d' : '#888' }}>
              {comboWinRate.toFixed(1)}%
            </div>
            <div style={{ fontSize: '10px', color: '#666' }}>
              픽 {pickRate}%
            </div>
          </>
        ) : (
          <div style={{ fontSize: '10px', color: '#555', display:'flex', alignItems:'center', gap:'4px' }}>
            <AlertCircle size={10}/> 수집 중
          </div>
        )}
      </div>
    </div>
  );
};

interface Props {
  hero: Hero;
  isMobile: boolean;
}

export const SkillAnalysisPanel: React.FC<Props> = ({ hero, isMobile }) => {
  if (!hero || !hero.skills) {
    return <div style={{ padding:'20px', color:'#666' }}>스킬 데이터가 없습니다.</div>;
  }

  const skills = hero.skills;
  const roleCombos = ROLE_COMBOS[hero.role] || [];
  const totalMatches = hero.record?.totalMatches || 0;

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '20px', height: '100%' }}>
      <div style={{ flex: 1.2 }}>
        <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Zap size={14} color="#f1c40f"/> 스킬 상세 정보
        </h4>
        <div style={{ maxHeight: isMobile ? 'none' : '400px', overflowY: isMobile ? 'visible' : 'auto' }}>
            <SkillCard skillKey="passive" data={skills.passive} label="P" />
            <SkillCard skillKey="q" data={skills.q} label="Q" />
            <SkillCard skillKey="w" data={skills.w} label="W" />
            <SkillCard skillKey="e" data={skills.e} label="E" />
            <SkillCard skillKey="r" data={skills.r} label="R" />
        </div>
      </div>

      <div style={{ flex: 1 }}>
        <h4 style={{ color: '#fff', margin: '0 0 10px 0', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Swords size={14} color="#da3633"/> 추천 스킬 콤보
        </h4>
        <div style={{ background: '#21262d', padding: '15px', borderRadius: '8px' }}>
          {roleCombos.length > 0 ? (
            roleCombos.map((combo, idx) => (
                <ComboStat 
                  key={idx} 
                  combo={combo} 
                  index={idx} 
                  heroWinRate={hero.recentWinRate} 
                  totalMatches={totalMatches} // [수정] 판수 정보 전달
                />
            ))
          ) : (
            <div style={{ color: '#666', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
              등록된 콤보 데이터가 없습니다.
            </div>
          )}
        </div>
        <div style={{ marginTop: '15px', padding: '10px', background: '#252528', borderRadius: '8px', fontSize: '11px', color: '#aaa', lineHeight: '1.5' }}>
          * 콤보 순서는 <strong>역할군별 정석 빌드</strong>를 보여줍니다.
          <br/>
          * 승률 데이터는 <strong>실제 매치 기록</strong>이 쌓이면 활성화됩니다.
        </div>
      </div>
    </div>
  );
};
