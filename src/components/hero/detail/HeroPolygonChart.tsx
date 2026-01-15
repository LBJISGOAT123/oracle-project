import React from 'react';
import { Hero } from '../../../types';

interface Props {
  hero: Hero;
}

export const HeroPolygonChart: React.FC<Props> = ({ hero }) => {
  // [Fix] 숫자가 아니면 무조건 0 반환 (NaN 방지)하여 SVG 렌더링 오류 예방
  const safeParse = (val: any) => {
    if (!val) return 0;
    // 쉼표 제거 후 파싱
    const num = parseFloat(String(val).replace(/,/g, ''));
    return isNaN(num) ? 0 : num;
  };

  const MAX_DPM = 3000;
  const MAX_DPG = 4000;
  const MAX_GOLD = 15000;
  const MAX_KDA = 5.0;
  const MAX_UTIL = 15;

  // 데이터 안전 정규화
  const stats = {
    combat: Math.min(100, (safeParse(hero.avgDpm) / MAX_DPM) * 100),
    tank: Math.min(100, (safeParse(hero.avgDpg) / MAX_DPG) * 100),
    growth: Math.min(100, (safeParse(hero.avgGold) / MAX_GOLD) * 100),
    survival: Math.min(100, (parseFloat(hero.kdaRatio || '0') / MAX_KDA) * 100),
    utility: Math.min(100, (( (hero.record?.totalAssists || 0) / Math.max(1, hero.record?.totalMatches || 1)) / MAX_UTIL) * 100)
  };

  // 모든 값이 숫자인지 최종 확인 (하나라도 NaN이면 0 처리)
  const values = [
    isNaN(stats.combat) ? 0 : stats.combat,
    isNaN(stats.tank) ? 0 : stats.tank,
    isNaN(stats.growth) ? 0 : stats.growth,
    isNaN(stats.survival) ? 0 : stats.survival,
    isNaN(stats.utility) ? 0 : stats.utility
  ];

  const labels = ["전투", "방어", "성장", "생존", "유틸"];

  // SVG 좌표 계산
  const angle = (deg: number) => (deg - 90) * (Math.PI / 180);
  const getPoint = (value: number, idx: number, total: number) => {
    const r = (value / 100) * 40;
    const a = angle((360 / total) * idx);
    return `${50 + r * Math.cos(a)},${50 + r * Math.sin(a)}`;
  };
  
  const polyPoints = values.map((v, i) => getPoint(v, i, 5)).join(" ");
  const bgPoints = values.map((_, i) => getPoint(100, i, 5)).join(" ");

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent:'center' }}>
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* 배경 오각형 */}
          <polygon points={bgPoints} fill="#1c1c1f" stroke="#333" strokeWidth="1" />
          {[80, 60, 40, 20].map((r, i) => (
             <polygon key={i} points={values.map((_, idx) => getPoint(r, idx, 5)).join(" ")} fill="none" stroke="#333" strokeWidth="0.5" strokeDasharray="2,2" />
          ))}
          
          {/* 실제 데이터 그래프 */}
          <polygon points={polyPoints} fill="rgba(88, 166, 255, 0.4)" stroke="#58a6ff" strokeWidth="2" />
          
          {/* 라벨 */}
          {labels.map((label, i) => {
            const pos = getPoint(125, i, 5).split(',');
            return (
              <text key={i} x={pos[0]} y={pos[1]} fontSize="8" fill="#aaa" textAnchor="middle" dominantBaseline="middle" fontWeight="bold">
                {label}
              </text>
            );
          })}
        </svg>
      </div>
      <div style={{ marginTop:'5px', fontSize:'11px', color:'#666' }}>능력치 분석</div>
    </div>
  );
};
