// ==========================================
// FILE PATH: /src/engine/match/ai/UtilityBrain.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero } from '../../../types';
import { AIUtils } from './AIUtils';
import { EconomyEvaluator } from './evaluators/EconomyEvaluator';
import { Perception } from './Perception';
import { SquadController } from './tactics/SquadController';
import { BASES } from '../constants/MapConstants';
import { PathSystem } from '../systems/PathSystem';

export class UtilityBrain {
  
  static decideAction(player: LivePlayer, match: LiveMatch, hero: Hero): { action: string, targetPos: {x:number, y:number}, targetUnit?: any } {
    const isBlue = match.blueTeam.includes(player);
    const myBase = isBlue ? BASES.BLUE : BASES.RED;
    
    // --- [0] 생존 본능 (Override) ---
    // 우물 근처(15)에 있는데 풀피/풀마나가 아니면 무조건 리콜/대기
    if (AIUtils.dist(player, myBase) < 15) {
        if (AIUtils.hpPercent(player) < 0.95 || (player.maxMp > 0 && AIUtils.mpPercent(player) < 0.95)) {
            return { action: 'RECALL', targetPos: myBase };
        }
        // 회복 끝났으면 무조건 출격 (Economy Check 스킵하여 루프 방지)
        const pushPos = PathSystem.getNextWaypoint(player, isBlue, match);
        return { action: 'PUSH', targetPos: pushPos };
    }

    // --- [1] 점수 계산 (Scoring) ---
    const scores = {
        recall: 0,
        farm: 0,
        fight: 0,
        push: 0,
        group: 0
    };

    // 1. 귀환 점수
    // 돈이 많고(코어템), 체력이 낮을수록 점수 높음
    if (EconomyEvaluator.shouldRecallForShopping(player, match)) scores.recall += 60;
    if (Perception.needsRecall(player)) scores.recall += 80;
    
    // 2. 전투 점수
    const nearby = Perception.analyzeNearbySituation(player, match, 25);
    if (nearby.enemies.length > 0) {
        const powerRatio = nearby.allyPower / Math.max(1, nearby.enemyPower);
        if (powerRatio > 1.2) scores.fight += 80; // 이길만하면 싸움
        else if (powerRatio < 0.8) scores.recall += 50; // 불리하면 도망
        
        // 킬각(딸피) 보너스
        if (nearby.enemies.some(e => AIUtils.hpPercent(e) < 0.3)) scores.fight += 40;
    }

    // 3. 군집 점수 (후반 운영)
    const squadOrder = SquadController.getGroupOrder(player, match);
    if (squadOrder) scores.group += 70; // 뭉치라는 명령이 떨어지면 우선순위 높음

    // 4. 파밍/푸쉬 점수 (기본값)
    scores.farm = 30;
    if (player.lane === 'JUNGLE') scores.farm += 20;

    // --- [2] 최적 행동 선택 ---
    const bestAction = Object.keys(scores).reduce((a, b) => (scores as any)[a] > (scores as any)[b] ? a : b);

    // --- [3] 행동 실행 매핑 ---
    switch (bestAction) {
        case 'recall':
            return { action: 'RECALL', targetPos: myBase };
        
        case 'fight':
            const target = nearby.enemies[0];
            return { action: 'FIGHT', targetPos: {x: target.x, y: target.y}, targetUnit: target };
            
        case 'group':
            if (squadOrder && squadOrder.pos) {
                return { action: 'ASSEMBLE', targetPos: squadOrder.pos };
            }
            break;
            
        case 'push':
        case 'farm':
        default:
            const path = PathSystem.getNextWaypoint(player, isBlue, match);
            return { action: 'PUSH', targetPos: path };
    }
    
    // Fallback
    return { action: 'WAIT', targetPos: {x: player.x, y: player.y} };
  }
}
EOF# 5. PlayerSystem.ts 교체 (AI 통합)
cat << 'EOF' > src/engine/match/systems/PlayerSystem.ts
// ==========================================
// FILE PATH: /src/engine/match/systems/PlayerSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero, RoleSettings } from '../../../types';
import { updateLivePlayerStats } from './ItemManager'; 
import { SteeringSystem } from './SteeringSystem';
import { BASES } from '../constants/MapConstants';
import { getDistance } from '../../data/MapData';
import { RecallSystem } from './RecallSystem';
import { processSkillEffect } from './SkillProcessor';
import { StatusManager } from './StatusManager';

// [New AI Modules]
import { UtilityBrain } from '../ai/UtilityBrain';
import { MicroBrain } from '../ai/MicroBrain';
import { InfluenceMap } from '../ai/map/InfluenceMap';

const isSafeToRecall = (player: LivePlayer, match: LiveMatch, isBlue: boolean): boolean => {
  const enemies = isBlue ? match.redTeam : match.blueTeam;
  for (const enemy of enemies) {
    if (enemy.currentHp > 0 && getDistance(player, enemy) < 15) return false;
  }
  if (match.minions) {
      const nearbyMinions = match.minions.find(m => m.team !== (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && getDistance(player, m) < 10);
      if (nearbyMinions) return false;
  }
  return true;
};

export const updatePlayerBehavior = (
  player: LivePlayer,
  match: LiveMatch,
  heroes: Hero[],
  shopItems: any[],
  roleSettings: RoleSettings,
  dt: number
) => {
  // [Zombie Killer] 시작부터 죽었는지 체크
  if (player.currentHp <= 0 && player.respawnTimer <= 0) {
      player.currentHp = 0;
      player.respawnTimer = 10 + (player.level * 3);
      return; 
  }

  StatusManager.update(player, dt);
  if (player.attackTimer > 0) player.attackTimer -= dt;

  if (StatusManager.isStunned(player)) {
      RecallSystem.cancelRecall(player);
      return; 
  }

  const prevHp = (player as any)._prevHp || player.currentHp;
  if (player.currentHp < prevHp - 0.1 && player.isRecalling) {
      RecallSystem.cancelRecall(player);
  }
  (player as any)._prevHp = player.currentHp;

  // 쿨타임 감소
  if (!player.cooldowns) player.cooldowns = { q:0, w:0, e:0, r:0 };
  Object.keys(player.cooldowns).forEach(k => {
    if ((player.cooldowns as any)[k] > 0) (player.cooldowns as any)[k] -= dt;
  });

  // 부활 로직
  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
    player.isRecalling = false;
    player.currentRecallTime = 0;
    if (player.respawnTimer <= 0) {
      player.respawnTimer = 0;
      const heroData = heroes.find(h => h.id === player.heroId);
      if (heroData) updateLivePlayerStats(player, heroData);
      player.currentHp = player.maxHp;
      player.currentMp = player.maxMp;
      const isBlueStart = match.blueTeam.includes(player);
      player.x = isBlueStart ? BASES.BLUE.x : BASES.RED.x;
      player.y = isBlueStart ? BASES.BLUE.y : BASES.RED.y;
      (player as any).pathIdx = 0;
      (player as any)._prevHp = player.maxHp;
      player.attackTimer = 0; 
      StatusManager.init(player);
    }
    return;
  }

  RecallSystem.update(player, match, heroes, shopItems, dt);
  if (player.isRecalling) return;

  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const isBlue = match.blueTeam.includes(player);
  const allies = isBlue ? match.blueTeam : match.redTeam;

  // [AI Upgrade] MacroBrain 대신 UtilityBrain 사용 (점수 기반 판단)
  const decision = UtilityBrain.decideAction(player, match, hero);
  let finalTargetPos = decision.targetPos;
  let moveSpeed = (player as any).moveSpeed || hero.stats.speed;

  switch (decision.action) {
    case 'RECALL':
      const myBase = isBlue ? BASES.BLUE : BASES.RED;
      if (!isSafeToRecall(player, match, isBlue)) {
          finalTargetPos = myBase; // 안전하지 않으면 우물로 뜀
      } else {
          RecallSystem.startRecall(player);
          return; // 이동 중지하고 귀환
      }
      break;

    case 'FIGHT':
      if (decision.targetUnit) {
        // [AI Upgrade] MicroBrain 사용 (무빙샷, 스킬콤보)
        const micro = MicroBrain.control(player, decision.targetUnit, hero, isBlue);
        
        if (micro.type === 'MOVE') {
          finalTargetPos = micro.targetPos;
        } else {
          finalTargetPos = { x: player.x, y: player.y }; // 공격 시 제자리 (카이팅은 MicroBrain이 처리)
          
          if (micro.skillKey) {
             const key = micro.skillKey as 'q'|'w'|'e'|'r';
             const skill = hero.skills[key];
             const cost = skill.cost || 0;
             if ((player.cooldowns as any)[key] <= 0 && player.currentMp >= cost) {
                 player.currentMp -= cost;
                 (player.cooldowns as any)[key] = skill.cd * (1 - (roleSettings.prophet.cdrPerLevel * 0.01 * player.level));
                 processSkillEffect(skill, player, decision.targetUnit);
                 player.activeSkill = { key, timestamp: match.currentDuration };
                 // 스킬 쓰면 평타 딜레이 약간 감소 (평캔 효과)
                 player.attackTimer = Math.max(0, player.attackTimer - 0.2); 

                 if (key === 'r') {
                     match.logs.push({
                         time: Math.floor(match.currentDuration),
                         type: 'KILL',
                         message: `💥 [${player.name}] 궁극기 발동! (${skill.name})`
                     });
                 }
             }
          }
        }
      }
      break;

    case 'ASSEMBLE':
    case 'PUSH':
    default:
      // [AI Upgrade] Influence Map을 이용해 안전한 경로로 보정
      // 단순히 직선으로 가는게 아니라, 위험지역을 살짝 피해서 감
      finalTargetPos = InfluenceMap.getOptimalPos(player, match, finalTargetPos);
      break;
  }

  // 이동 실행 (Steering Behavior)
  const mapScaleSpeed = (moveSpeed / 100) * dt * 0.8; 
  const steering = SteeringSystem.calculateSteering(player, finalTargetPos, allies, mapScaleSpeed);

  player.x += steering.x;
  player.y += steering.y;

  // 맵 이탈 방지
  player.x = Math.max(0, Math.min(100, player.x));
  player.y = Math.max(0, Math.min(100, player.y));
};
