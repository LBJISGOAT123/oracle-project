import React, { useRef, useEffect } from 'react';
import { LiveMatch, Hero } from '../../../../types';
import { TOWER_COORDS, POI } from '../../../../engine/match/constants/MapConstants';
import { useGameStore } from '../../../../store/useGameStore';
import { globalImageCache } from '../../../../utils/ImageCache';

interface Props {
  match: LiveMatch;
  heroes: Hero[];
  onSelectHero: (id: string) => void;
  selectedHeroId: string | null;
}

export const SpectateCanvasView: React.FC<Props> = ({ match, heroes, onSelectHero, selectedHeroId }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { gameState } = useGameStore();
  
  const getImage = (src: string | undefined) => {
    if (!src) return null;
    if (globalImageCache[src]) return globalImageCache[src];
    const img = new Image();
    img.src = src;
    globalImageCache[src] = img; 
    return img;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let animationFrameId: number;

    const render = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.scale(dpr, dpr);
      const scaleX = width / 100;
      const scaleY = height / 100;

      // ------------------------------------------
      // 헬퍼 함수: 아이콘 그리기 (Canvas Path API)
      // ------------------------------------------
      
      // 해골 아이콘 (거신병)
      const drawSkullIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
        // 배경 원
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#161b22'; // 어두운 배경
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();

        // 해골 모양 그리기
        const s = r * 0.6; // 내부 아이콘 스케일
        ctx.fillStyle = color;
        
        // 머리 (위쪽 원)
        ctx.beginPath();
        ctx.arc(x, y - s * 0.2, s * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 턱 (아래쪽 사각형)
        ctx.beginPath();
        ctx.roundRect(x - s * 0.4, y + s * 0.1, s * 0.8, s * 0.6, 2);
        ctx.fill();

        // 눈 (구멍 뚫기 - composite operation 사용 안하고 어두운 색 덧칠)
        ctx.fillStyle = '#161b22';
        ctx.beginPath();
        ctx.arc(x - s * 0.25, y - s * 0.2, s * 0.22, 0, Math.PI * 2); // 왼쪽 눈
        ctx.arc(x + s * 0.25, y - s * 0.2, s * 0.22, 0, Math.PI * 2); // 오른쪽 눈
        ctx.fill();
        
        // 코 (삼각형)
        ctx.beginPath();
        ctx.moveTo(x, y + s * 0.2);
        ctx.lineTo(x - s * 0.1, y + s * 0.35);
        ctx.lineTo(x + s * 0.1, y + s * 0.35);
        ctx.closePath();
        ctx.fill();
      };

      // 눈 아이콘 (주시자)
      const drawEyeIcon = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) => {
        // 배경 원
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = '#161b22';
        ctx.fill();
        ctx.lineWidth = 3;
        ctx.strokeStyle = color;
        ctx.stroke();

        const s = r * 0.5; // 스케일

        // 눈 외곽 (아몬드 모양)
        ctx.beginPath();
        ctx.moveTo(x - s * 1.5, y);
        ctx.quadraticCurveTo(x, y - s * 1.5, x + s * 1.5, y); // 위쪽 곡선
        ctx.quadraticCurveTo(x, y + s * 1.5, x - s * 1.5, y); // 아래쪽 곡선
        ctx.closePath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = color;
        ctx.stroke();

        // 눈동자 (채워진 원)
        ctx.beginPath();
        ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      };

      // ------------------------------------------
      // 렌더링 로직 시작
      // ------------------------------------------

      // 1. 배경
      ctx.fillStyle = '#0a0f0a';
      ctx.fillRect(0, 0, width, height);
      
      const bgSrc = gameState.customImages?.['map_bg'];
      const bgImg = getImage(bgSrc);
      if (bgImg && bgImg.complete) {
        ctx.globalAlpha = 0.6;
        ctx.drawImage(bgImg, 0, 0, width, height);
        ctx.globalAlpha = 1.0;
      } else {
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for(let i=0; i<=100; i+=10) {
            ctx.moveTo(i*scaleX, 0); ctx.lineTo(i*scaleX, height);
            ctx.moveTo(0, i*scaleY); ctx.lineTo(width, i*scaleY);
        }
        ctx.stroke();
      }

      // 2. 오브젝트(거신병/주시자)
      if (match.objectives) {
          // 거신병 (바론 둥지)
          const colossus = match.objectives.colossus;
          if (colossus && colossus.status === 'ALIVE') {
              const cx = POI.BARON.x * scaleX;
              const cy = POI.BARON.y * scaleY;
              
              // 해골 아이콘 그리기 (보라색)
              drawSkullIcon(ctx, cx, cy, 18, '#a658ff');

              // HP Bar
              const hpPct = colossus.hp / colossus.maxHp;
              ctx.fillStyle = '#333';
              ctx.fillRect(cx - 15, cy + 22, 30, 4);
              ctx.fillStyle = '#a658ff';
              ctx.fillRect(cx - 15, cy + 22, 30 * hpPct, 4);
          }

          // 주시자 (용 둥지)
          const watcher = match.objectives.watcher;
          if (watcher && watcher.status === 'ALIVE') {
              const cx = POI.DRAGON.x * scaleX;
              const cy = POI.DRAGON.y * scaleY;
              
              // 눈 아이콘 그리기 (주황색/골드)
              drawEyeIcon(ctx, cx, cy, 18, '#f1c40f');

              // HP Bar
              const hpPct = watcher.hp / watcher.maxHp;
              ctx.fillStyle = '#333';
              ctx.fillRect(cx - 15, cy + 22, 30, 4);
              ctx.fillStyle = '#f1c40f'; 
              ctx.fillRect(cx - 15, cy + 22, 30 * hpPct, 4);
          }
      }

      // 3. 타워
      const drawStructure = (x: number, y: number, isDead: boolean, color: string, isNexus = false) => {
        const cx = x * scaleX;
        const cy = y * scaleY;
        const size = isNexus ? 14 : 8;
        
        ctx.fillStyle = isDead ? '#333' : color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(cx, cy, size, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

        if (!isDead) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.2;
            ctx.arc(cx, cy, (isNexus ? 15 : 12) * scaleX, 0, Math.PI * 2);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
      };

      ['top', 'mid', 'bot'].forEach(lane => {
         const broken = (match.stats.blue.towers as any)[lane];
         const coords = (TOWER_COORDS.BLUE as any)[lane.toUpperCase()];
         coords.forEach((pos:any, i:number) => drawStructure(pos.x, pos.y, i < broken, '#58a6ff'));
      });
      drawStructure(TOWER_COORDS.BLUE.NEXUS.x, TOWER_COORDS.BLUE.NEXUS.y, match.stats.blue.nexusHp <= 0, '#58a6ff', true);

      ['top', 'mid', 'bot'].forEach(lane => {
         const broken = (match.stats.red.towers as any)[lane];
         const coords = (TOWER_COORDS.RED as any)[lane.toUpperCase()];
         coords.forEach((pos:any, i:number) => drawStructure(pos.x, pos.y, i < broken, '#e84057'));
      });
      drawStructure(TOWER_COORDS.RED.NEXUS.x, TOWER_COORDS.RED.NEXUS.y, match.stats.red.nexusHp <= 0, '#e84057', true);

      // 4. 미니언 & 소환물
      match.minions?.forEach(m => {
        if (m.hp <= 0) return;
        const cx = m.x * scaleX;
        const cy = m.y * scaleY;
        const color = m.team === 'BLUE' ? '#58a6ff' : '#e84057';
        
        if (m.type === 'SUMMONED_COLOSSUS') {
            // [소환된 거신병] 작은 해골 아이콘으로 표시
            // 팀 컬러(파랑/빨강)를 따르되, 약간 보라색 섞인 느낌
            drawSkullIcon(ctx, cx, cy, 12, '#a658ff');
            
            // 소유 팀 표시 (작은 점)
            ctx.beginPath();
            ctx.arc(cx + 8, cy - 8, 4, 0, Math.PI*2);
            ctx.fillStyle = color;
            ctx.fill();
        } else {
            const size = m.type === 'SIEGE' ? 6 : 4;
            ctx.fillStyle = color;
            ctx.fillRect(cx - size/2, cy - size/2, size, size);
        }
      });

      // 5. 영웅
      [...match.blueTeam, ...match.redTeam].forEach(p => {
        const cx = p.x * scaleX;
        const cy = p.y * scaleY;
        const isSelected = selectedHeroId === p.heroId;
        const teamColor = match.blueTeam.includes(p) ? '#58a6ff' : '#e84057';
        const isDead = p.respawnTimer > 0;

        ctx.save();

        if (isDead) {
            ctx.globalAlpha = 0.6;
            ctx.filter = 'grayscale(100%)';
        }

        // [주시자 버프 이펙트] 주황색(Gold) 오라
        if (!isDead && p.buffs.includes('WATCHER_BUFF')) {
            ctx.shadowColor = '#f1c40f'; 
            ctx.shadowBlur = 15;
        }

        const heroImgSrc = gameState.customImages?.[p.heroId];
        const heroImg = getImage(heroImgSrc);

        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
            ctx.drawImage(heroImg, cx - 14, cy - 14, 28, 28);
        } else {
            ctx.fillStyle = teamColor;
            ctx.fillRect(cx - 14, cy - 14, 28, 28);
        }
        ctx.restore();

        // 테두리
        ctx.strokeStyle = isDead ? '#666' : teamColor;
        // 주시자 버프 있으면 테두리도 골드
        if (!isDead && p.buffs.includes('WATCHER_BUFF')) ctx.strokeStyle = '#f1c40f';
        
        ctx.lineWidth = isSelected ? 3 : 2;
        if (isSelected) ctx.strokeStyle = '#fff';
        
        ctx.beginPath();
        ctx.arc(cx, cy, 14, 0, Math.PI * 2);
        ctx.stroke();

        if (isDead) {
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#ff4d4d'; 
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 3;
            ctx.textAlign = 'center';
            const timeText = Math.ceil(p.respawnTimer).toString();
            ctx.strokeText(timeText, cx, cy + 6);
            ctx.fillText(timeText, cx, cy + 6);
        } 
        else {
            const hpPct = p.currentHp / p.maxHp;
            ctx.fillStyle = '#333';
            ctx.fillRect(cx - 15, cy + 16, 30, 4);
            ctx.fillStyle = hpPct < 0.3 ? '#da3633' : teamColor;
            ctx.fillRect(cx - 15, cy + 16, 30 * hpPct, 4);

            if (p.isRecalling) {
                const recallDuration = 8.0; 
                const recallPct = Math.min(1, p.currentRecallTime / recallDuration);
                
                ctx.beginPath();
                ctx.arc(cx, cy, 18, -Math.PI/2, (-Math.PI/2) + (Math.PI * 2 * recallPct));
                ctx.strokeStyle = '#3498db';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                ctx.font = 'bold 10px Arial';
                ctx.fillStyle = '#3498db';
                ctx.textAlign = 'center';
                ctx.fillText("B", cx, cy - 20);
            }

            if (p.activeSkill) {
                const timeDiff = match.currentDuration - p.activeSkill.timestamp;
                if (timeDiff < 1.0) {
                    ctx.font = 'bold 12px Arial';
                    ctx.fillStyle = '#fff';
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 3;
                    ctx.textAlign = 'center';
                    const text = `${p.activeSkill.key.toUpperCase()}!`;
                    ctx.strokeText(text, cx, cy - 25);
                    ctx.fillText(text, cx, cy - 25);
                }
            }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [match, heroes, selectedHeroId, gameState.customImages]);

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const gameX = (x / rect.width) * 100;
    const gameY = (y / rect.height) * 100;

    let bestDist = 100;
    let bestId = null;

    [...match.blueTeam, ...match.redTeam].forEach(p => {
        const dx = p.x - gameX;
        const dy = p.y - gameY;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 5 && dist < bestDist) {
            bestDist = dist;
            bestId = p.heroId;
        }
    });

    onSelectHero(bestId || '');
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas 
        ref={canvasRef} 
        onClick={handleClick}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }} 
      />
    </div>
  );
};
