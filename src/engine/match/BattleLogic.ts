// ==========================================
// FILE PATH: /src/engine/match/BattleLogic.ts
// ==========================================
import { LivePlayer, Hero } from '../../types';
import { getDistance, Vector2 } from '../data/MapData';

// 유닛의 현재 상태
export type UnitState = 'IDLE' | 'MOVING' | 'ATTACKING' | 'RECALLING' | 'DEAD';

// --- [이동 로직] ---
// 목표 지점까지 이동. 도착했으면 true 반환
export const moveUnit = (p: LivePlayer, target: Vector2, dt: number, speedVal: number) => {
  const dist = getDistance(p, target);

  // 아주 가깝다면 도착 처리
  if (dist <= 1.0) return true; 

  // 맵 크기 100 기준, 속도 스케일 보정 (대략적인 게임 속도 조절)
  // speedVal(이속)이 보통 300~400 정도이므로 1/100 정도로 줄여서 이동
  const speed = (speedVal / 100) * dt * 0.8; 

  const dx = (target.x - p.x) / dist;
  const dy = (target.y - p.y) / dist;

  p.x += dx * speed;
  p.y += dy * speed;

  // 맵 밖으로 나가지 않게 제한 (0~100)
  p.x = Math.max(0, Math.min(100, p.x));
  p.y = Math.max(0, Math.min(100, p.y));

  return false;
};

// --- [타겟팅 로직] ---
// 사거리 내의 가장 가까운 적 찾기
export const findTarget = (me: LivePlayer, enemies: LivePlayer[], range: number): LivePlayer | null => {
  let target = null;
  // 맵 크기가 100이므로, 사거리(보통 500~600)를 맵 단위(5~6)로 변환
  let minDist = range / 10; 

  for (const e of enemies) {
    // 살아있고 부활 대기중이 아닌 적만 타겟팅
    if (e.currentHp > 0 && e.respawnTimer <= 0) {
      const d = getDistance(me, e);
      if (d < minDist) {
        minDist = d;
        target = e;
      }
    }
  }
  return target;
};

// --- [공격 실행 로직] ---
export const executeAttack = (
  attacker: LivePlayer, 
  target: LivePlayer, 
  hero: Hero, 
  dt: number,
  logs: any[],
  time: number
) => {
  // 마나 체크 (스킬 사용 조건)
  // 확률적으로 스킬 사용 (마나 50 이상일 때 30% 확률)
  const isSkill = attacker.currentMp > 50 && Math.random() < 0.3;
  let damage = 0;
  let logMsg = '';

  if (isSkill) {
    // 스킬 사용 (Q,W,E,R 중 랜덤)
    const skills = [hero.skills.q, hero.skills.w, hero.skills.e, hero.skills.r];
    const skill = skills[Math.floor(Math.random() * skills.length)];

    // 데미지 계산식 (기본뎀 + 계수)
    damage = skill.val + (hero.stats.ad * skill.adRatio) + (hero.stats.ap * skill.apRatio);
    attacker.currentMp -= 30; // 마나 소모
    logMsg = `✨ ${hero.name}의 ${skill.name}!`;
  } else {
    // 평타
    damage = hero.stats.ad;
    logMsg = `⚔️ ${hero.name}의 공격`;
  }

  // 방어력 계산 (간단한 감소 공식: 100 / (100 + 방어력))
  // target.heroId로 영웅 정보 찾기는 복잡하므로 기본 방어력 30 가정하거나, items에서 계산해야 함.
  // 여기서는 약식으로 처리
  const def = 100 / (100 + 30); 
  const finalDmg = Math.floor(damage * def);

  target.currentHp -= finalDmg;
  attacker.totalDamageDealt += finalDmg;

  // 킬 처리
  if (target.currentHp <= 0) {
    target.currentHp = 0;
    // 부활 타이머 설정 (기본 10초 + 레벨당 2초)
    target.respawnTimer = 10 + (attacker.level * 2);

    attacker.kills++;
    target.deaths++;
    attacker.gold += 300;

    // 로그 기록
    logs.push({
      time: Math.floor(time),
      message: `💀 [${hero.name}]가 [${target.name}] 처치!`,
      type: 'KILL',
      team: attacker.x < 50 ? 'BLUE' : 'RED' // 위치 기반 팀 추정 (정확히 하려면 인자로 받아야 함)
    });
  }
};