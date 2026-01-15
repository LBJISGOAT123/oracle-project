import React from 'react';

interface Props {
  activeSkill?: {
    key: 'q' | 'w' | 'e' | 'r';
    timestamp: number;
  };
  currentTime: number;
  isDead: boolean;
}

export const SkillBubble: React.FC<Props> = ({ activeSkill, currentTime, isDead }) => {
  // 1.5초 동안만 표시
  const SHOW_DURATION = 1.5;
  
  if (!activeSkill || isDead) return null;
  if (currentTime - activeSkill.timestamp > SHOW_DURATION) return null;

  // 스킬별 색상 (R은 빨강, Q는 노랑, 나머지는 흰색)
  const getSkillColor = (key: string) => {
    if (key === 'r') return '#ff4d4d'; // 궁극기
    if (key === 'q') return '#f1c40f';
    return '#ffffff';
  };

  const color = getSkillColor(activeSkill.key);

  return (
    <div className="skill-bubble-anim" style={{
      position: 'absolute', 
      top: '-35px', 
      left: '50%', 
      transform: 'translateX(-50%)',
      background: color, 
      color: '#000',
      padding: '2px 6px', 
      borderRadius: '4px',
      fontSize: '12px', 
      fontWeight: '900', 
      zIndex: 30,
      boxShadow: '0 2px 5px rgba(0,0,0,0.5)',
      border: '1px solid #000',
      pointerEvents: 'none', // 클릭 방해 금지
      whiteSpace: 'nowrap'
    }}>
      {activeSkill.key.toUpperCase()}!
      
      {/* 간단한 CSS 애니메이션 주입 */}
      <style>{`
        .skill-bubble-anim {
          animation: skillPop 0.3s ease-out forwards;
        }
        @keyframes skillPop {
          0% { transform: translate(-50%, 5px) scale(0.5); opacity: 0; }
          60% { transform: translate(-50%, -5px) scale(1.2); opacity: 1; }
          100% { transform: translate(-50%, 0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
};
