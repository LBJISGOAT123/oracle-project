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

  if (!player.cooldowns) player.cooldowns = { q:0, w:0, e:0, r:0 };
  Object.keys(player.cooldowns).forEach(k => {
    if ((player.cooldowns as any)[k] > 0) (player.cooldowns as any)[k] -= dt;
  });

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

  const decision = UtilityBrain.decideAction(player, match, hero);
  let finalTargetPos = decision.targetPos;
  let moveSpeed = (player as any).moveSpeed || hero.stats.speed;

  switch (decision.action) {
    case 'RECALL':
      const myBase = isBlue ? BASES.BLUE : BASES.RED;
      if (!isSafeToRecall(player, match, isBlue)) {
          finalTargetPos = myBase; 
      } else {
          RecallSystem.startRecall(player);
          return;
      }
      break;

    case 'FIGHT':
      if (decision.targetUnit) {
        const micro = MicroBrain.control(player, decision.targetUnit, hero, isBlue);
        
        if (micro.type === 'MOVE') {
          finalTargetPos = micro.targetPos;
        } else {
          finalTargetPos = { x: player.x, y: player.y };
          
          if (micro.skillKey) {
             const key = micro.skillKey as 'q'|'w'|'e'|'r';
             const skill = hero.skills[key];
             const cost = skill.cost || 0;
             if ((player.cooldowns as any)[key] <= 0 && player.currentMp >= cost) {
                 player.currentMp -= cost;
                 (player.cooldowns as any)[key] = skill.cd * (1 - (roleSettings.prophet.cdrPerLevel * 0.01 * player.level));
                 processSkillEffect(skill, player, decision.targetUnit);
                 player.activeSkill = { key, timestamp: match.currentDuration };
                 
                 // [피지컬 보상] 스킬 사용 시 평타 딜레이 30% 감소 (연계 속도 증가)
                 player.attackTimer = Math.max(0, player.attackTimer - 0.3); 

                 if (key === 'r') {
                     match.logs.push({
                         time: Math.floor(match.currentDuration),
                         type: 'KILL',
                         message: `💥 [${player.name}] 궁극기 발동! (${skill.name})`
                     });
                 }
             }
          }
          
          // [피지컬 보상] 평캔 적용 (공격 후 딜레이 감소)
          if (micro.cancelAnimation && player.attackTimer > 0) {
              // 남은 딜레이의 20%를 즉시 삭제
              player.attackTimer *= 0.8;
          }
        }
      }
      break;

    case 'ASSEMBLE':
    case 'PUSH':
    default:
      finalTargetPos = InfluenceMap.getOptimalPos(player, match, finalTargetPos);
      break;
  }

  const mapScaleSpeed = (moveSpeed / 100) * dt * 0.8; 
  const steering = SteeringSystem.calculateSteering(player, finalTargetPos, allies, mapScaleSpeed);

  player.x += steering.x;
  player.y += steering.y;

  player.x = Math.max(0, Math.min(100, player.x));
  player.y = Math.max(0, Math.min(100, player.y));
};
