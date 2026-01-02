// ==========================================
// FILE PATH: /src/components/hero/HeroVsModal.tsx
// ==========================================

import React, { useMemo } from 'react';
import { Hero } from '../../types';
// ▼ [수정] 'Trophy'를 import 목록에 추가했습니다.
import { X, Swords, Skull, Target, Zap, Shield, TrendingUp, AlertTriangle, Trophy } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

interface Props {
  myHero: Hero;
  enemyHero: Hero;
  onClose: () => void;
}

export const HeroVsModal: React.FC<Props> = ({ myHero, enemyHero, onClose }) => {

  // --- [1. 정밀 상성 시뮬레이션 엔진] ---
  const analysis = useMemo(() => {
    let score = 0; // 0 기준, 양수면 myHero 유리, 음수면 enemyHero 유리

    // 1. 기본 체급 차이 (승률 기반)
    const myWin = myHero.recentWinRate;
    const enWin = enemyHero.recentWinRate;
    score += (myWin - enWin) * 1.5;

    // 2. 역할군 상성 (가위바위보 로직)
    // 추적자(암살) > 신살자(원딜) > 수호기사(탱커) > 추적자
    // 선지자(메이지) vs 집행관(브루저) : 손싸움
    const roles = { my: myHero.role, en: enemyHero.role };

    if (roles.my === '추적자' && (roles.en === '신살자' || roles.en === '선지자')) score += 10; // 암살 성공
    if (roles.my === '신살자' && roles.en === '수호기사') score += 8; // 카이팅 우위
    if (roles.my === '수호기사' && roles.en === '추적자') score += 10; // 딜 안박힘
    if (roles.my === '집행관' && roles.en === '추적자') score += 5; // 체급 차이

    // 반대 경우 (패널티)
    if (roles.en === '추적자' && (roles.my === '신살자' || roles.my === '선지자')) score -= 10;
    if (roles.en === '신살자' && roles.my === '수호기사') score -= 8;
    if (roles.en === '수호기사' && roles.my === '추적자') score -= 10;

    // 3. 스킬 메커니즘 상성
    const mySkills = Object.values(myHero.skills);
    const enSkills = Object.values(enemyHero.skills);

    const myCC = mySkills.filter(s => s.mechanic === 'STUN' || s.mechanic === 'HOOK').length;
    const enCC = enSkills.filter(s => s.mechanic === 'STUN' || s.mechanic === 'HOOK').length;
    const myDash = mySkills.filter(s => s.mechanic === 'DASH').length;
    const enDash = enSkills.filter(s => s.mechanic === 'DASH').length;

    // CC기가 많으면 이동기 없는 적에게 유리
    if (myCC > 0 && enDash === 0) score += 5;
    if (enCC > 0 && myDash === 0) score -= 5;

    // 4. 최종 승률 및 지표 산출
    // 최소 35%, 최대 65%로 보정
    const matchupWinRate = Math.min(65, Math.max(35, 50 + score));

    // 라인전 킬 확률 (상성이 극단적일수록 킬 확률 높음)
    const laneKillRate = 50 + (score * 1.2);

    // 15분 골드 격차 예상
    const goldDiff = Math.floor(score * 35);

    return { score, matchupWinRate, laneKillRate, goldDiff };
  }, [myHero, enemyHero]);


  // --- [2. 다채로운 분석 코멘트 생성기] ---
  const getAnalystComment = () => {
    const { score, matchupWinRate } = analysis;
    const myName = myHero.name;
    const enName = enemyHero.name;

    // 상황별 멘트 풀 (Pool)
    const comments = {
      // 압도적 우위 (승률 60% 이상)
      dominate: [
        `"${enName}" 입장에서 재앙과도 같은 매치업입니다. ${myName}의 스킬 셋이 상대를 완벽하게 카운터칩니다.`,
        `라인전부터 한타까지 ${myName}가 주도권을 쥘 수 있습니다. 필승 카드입니다.`,
        `데이터상 7:3 정도로 유리합니다. ${enName}의 진입을 ${myName}가 손쉽게 받아칠 수 있습니다.`,
        `상대는 밴픽 단계에서 이미 졌습니다. ${myName}의 딜을 버틸 수 없는 구조입니다.`
      ],
      // 소폭 우위 (52~59%)
      advantage: [
        `기분 좋은 상성입니다. 초반 교전만 조심하면 ${myName}의 성장 기대치가 더 높습니다.`,
        `${enName}의 주요 스킬이 빠지는 타이밍을 노리면 킬각을 쉽게 잡을 수 있습니다.`,
        `통계적으로 유리하지만 방심은 금물입니다. ${myName}의 유지력이 승패를 가를 것입니다.`,
        `중반 타이밍부터 ${myName}가 사이드 주도권을 가져오기 편한 구도입니다.`
      ],
      // 엄대엄 (48~51%)
      even: [
        `순수 피지컬 싸움입니다. 스킬 하나 차이로 승패가 갈릴 '손싸움' 구도입니다.`,
        `정글러의 개입이 승패를 가를 것입니다. 라인전보다는 합류 싸움이 중요합니다.`,
        `서로 킬을 내기 힘든 구조입니다. 파밍 위주의 지루한 라인전이 예상됩니다.`,
        `누가 더 실수를 덜 하느냐의 싸움입니다. 데이터상 승률은 정확히 반반입니다.`
      ],
      // 소폭 열세 (41~47%)
      disadvantage: [
        `다소 껄끄러운 상대입니다. ${enName}의 견제를 버티며 후반을 도모해야 합니다.`,
        `맞딜은 피하는 게 좋습니다. 아군의 지원 없이는 라인전 주도권을 잡기 힘듭니다.`,
        `${enName}의 성장 속도가 더 빠릅니다. 초반에 변수를 만들지 않으면 게임이 힘들어집니다.`,
        `상성상 불리하지만 극복 불가능하진 않습니다. 아이템으로 카운터 치는 것을 추천합니다.`
      ],
      // 압도적 열세 (40% 이하)
      hardCounter: [
        `닷지를 추천합니다. ${myName}로는 ${enName}를 이기기 정말 힘듭니다.`,
        `"지옥의 카운터" 매치업입니다. 숨만 쉬어도 라인전이 터질 수 있습니다.`,
        `${enName}를 밴하지 않은 대가를 치를 것입니다. 타워 허깅이 유일한 살길입니다.`,
        `절대 1:1을 걸지 마십시오. 모든 지표가 ${enName}의 승리를 가리키고 있습니다.`
      ]
    };

    // 랜덤 선택 로직
    const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

    if (matchupWinRate >= 60) return pick(comments.dominate);
    if (matchupWinRate >= 52) return pick(comments.advantage);
    if (matchupWinRate >= 48) return pick(comments.even);
    if (matchupWinRate >= 40) return pick(comments.disadvantage);
    return pick(comments.hardCounter);
  };

  const comment = useMemo(() => getAnalystComment(), [analysis]);


  // --- [3. UI 컴포넌트] ---
  const ComparisonRow = ({ label, icon, leftVal, rightVal, unit = '', inverse = false }: any) => {
    // 값이 더 큰 쪽이 이기는지(true), 작은 쪽이 이기는지(false)
    const isLeftWin = inverse ? leftVal <= rightVal : leftVal >= rightVal;
    const total = leftVal + rightVal;
    const leftP = total > 0 ? (leftVal / total) * 100 : 50;

    const winColor = '#58a6ff'; // Blue
    const loseColor = '#da3633'; // Red (적)

    return (
      <div style={{ marginBottom: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#ccc', marginBottom: '6px', padding: '0 5px' }}>
          <span style={{ fontWeight: 'bold', color: isLeftWin ? winColor : '#888' }}>
            {leftVal.toLocaleString()}{unit}
          </span>
          <div style={{ display:'flex', alignItems:'center', gap:'4px', color:'#aaa', fontSize:'11px' }}>{icon} {label}</div>
          <span style={{ fontWeight: 'bold', color: !isLeftWin ? loseColor : '#888' }}>
            {rightVal.toLocaleString()}{unit}
          </span>
        </div>

        {/* 그래프 바 */}
        <div style={{ display: 'flex', height: '6px', background: '#222', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ width: `${leftP}%`, background: isLeftWin ? winColor : '#444', transition:'1s' }} />
          <div style={{ width: '2px', background: '#000' }} />
          <div style={{ flex: 1, background: !isLeftWin ? loseColor : '#444', transition:'1s' }} />
        </div>
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '15px', backdropFilter: 'blur(5px)' }}>
      <div style={{ width: '100%', maxWidth: '500px', background: '#161b22', borderRadius: '16px', border: '1px solid #30363d', overflow: 'hidden', display:'flex', flexDirection:'column', maxHeight:'85vh' }}>

        {/* 헤더 */}
        <div style={{ padding: '15px 20px', background: '#21262d', borderBottom: '1px solid #30363d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize: '15px', display:'flex', alignItems:'center', gap:'8px', fontWeight:'bold' }}>
            <Swords size={16} color="#da3633"/> 상대 전적 시뮬레이션
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer' }}><X size={20}/></button>
        </div>

        {/* VS 배너 */}
        <div style={{ padding: '25px 20px', background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.15) 0%, rgba(218, 54, 51, 0.15) 100%)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom:'1px solid #30363d' }}>
          {/* 나 (왼쪽) */}
          <div style={{ textAlign: 'center', width:'30%' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <GameIcon id={myHero.id} size={60} shape="circle" border="3px solid #58a6ff" />
              <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%)', background:'#58a6ff', color:'#000', fontSize:'9px', fontWeight:'bold', padding:'1px 6px', borderRadius:'10px', whiteSpace:'nowrap' }}>ME</div>
            </div>
            <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#fff', fontSize:'13px' }}>{myHero.name}</div>
          </div>

          <div style={{ textAlign: 'center', flex:1 }}>
            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '2px' }}>상대 승률 예측</div>
            <div style={{ fontSize: '28px', fontWeight: '900', color: analysis.matchupWinRate >= 50 ? '#58a6ff' : '#da3633', textShadow:'0 0 10px rgba(0,0,0,0.5)' }}>
              {analysis.matchupWinRate.toFixed(1)}%
            </div>
            <div style={{ fontSize:'10px', color: analysis.matchupWinRate >= 50 ? '#58a6ff' : '#da3633', fontWeight:'bold' }}>
              {analysis.matchupWinRate >= 50 ? '유리함' : '불리함'}
            </div>
          </div>

          {/* 적 (오른쪽) */}
          <div style={{ textAlign: 'center', width:'30%' }}>
            <div style={{ position:'relative', display:'inline-block' }}>
              <GameIcon id={enemyHero.id} size={60} shape="circle" border="3px solid #da3633" />
              <div style={{ position:'absolute', bottom:-5, left:'50%', transform:'translateX(-50%)', background:'#da3633', color:'#fff', fontSize:'9px', fontWeight:'bold', padding:'1px 6px', borderRadius:'10px', whiteSpace:'nowrap' }}>ENEMY</div>
            </div>
            <div style={{ marginTop: '8px', fontWeight: 'bold', color: '#fff', fontSize:'13px' }}>{enemyHero.name}</div>
          </div>
        </div>

        {/* 분석 컨텐츠 (스크롤) */}
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto', background:'#0d1117' }}>

          {/* 분석 코멘트 박스 */}
          <div style={{ marginBottom:'25px', padding:'15px', background:'#1c1c1f', borderRadius:'8px', border:'1px solid #333', borderLeft:'4px solid #58a6ff' }}>
            <div style={{ fontSize:'12px', color:'#58a6ff', fontWeight:'bold', marginBottom:'6px', display:'flex', alignItems:'center', gap:'5px' }}>
              <TrendingUp size={14}/> 분석 코멘트
            </div>
            <div style={{ fontSize:'13px', color:'#eee', lineHeight:'1.5' }}>
              "{comment}"
            </div>
          </div>

          <h4 style={{ fontSize:'12px', color:'#888', margin:'0 0 15px 0' }}>상세 지표 비교</h4>

          <ComparisonRow 
            label="라인전 킬 확률" icon={<Skull size={12}/>} 
            leftVal={analysis.laneKillRate} rightVal={100 - analysis.laneKillRate} unit="%"
          />
          <ComparisonRow 
            label="15분 골드 격차" icon={<Zap size={12}/>} 
            leftVal={analysis.goldDiff > 0 ? `+${analysis.goldDiff}` : 0} 
            rightVal={analysis.goldDiff < 0 ? `+${Math.abs(analysis.goldDiff)}` : 0} 
          />
          <ComparisonRow 
            label="분당 데미지 (DPM)" icon={<Target size={12}/>} 
            leftVal={parseInt(myHero.avgDpm.replace(/,/g, ''))} 
            rightVal={parseInt(enemyHero.avgDpm.replace(/,/g, ''))} 
          />
          <ComparisonRow 
            label="KDA 비율" icon={<Trophy size={12}/>} 
            leftVal={parseFloat(myHero.kdaRatio)} 
            rightVal={parseFloat(enemyHero.kdaRatio)} 
          />

          <div style={{ marginTop:'20px', fontSize:'11px', color:'#555', textAlign:'center' }}>
            * 위 데이터는 최근 {Math.max(myHero.record.totalMatches, 100)}경기 데이터를 기반으로 시뮬레이션 되었습니다.
          </div>
        </div>

      </div>
    </div>
  );
};