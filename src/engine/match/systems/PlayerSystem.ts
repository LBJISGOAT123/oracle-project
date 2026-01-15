// ==========================================
// FILE PATH: /src/engine/match/systems/PlayerSystem.ts
// ==========================================
import { LivePlayer, LiveMatch, Hero, RoleSettings } from '../../../types';
import { updateLivePlayerStats } from './ItemManager'; 
import { SteeringSystem } from './SteeringSystem';
import { PathSystem } from './PathSystem';
import { BASES, TOWER_COORDS } from '../constants/MapConstants';
import { MacroBrain } from '../ai/MacroBrain';
import { MicroBrain } from '../ai/MicroBrain';
import { getDistance } from '../../data/MapData';
import { RecallSystem } from './RecallSystem';
import { processSkillEffect } from './SkillProcessor';
import { AIUtils } from '../ai/AIUtils';
import { StatusManager } from './StatusManager';
import { VisualSystem } from './VisualSystem';

const isSafeToRecall = (player: LivePlayer, match: LiveMatch, isBlue: boolean): boolean => {
  const enemyTowers = isBlue ? match.stats.red.towers : match.stats.blue.towers;
  const enemies = isBlue ? match.redTeam : match.blueTeam;

  for (const enemy of enemies) {
    if (enemy.currentHp > 0 && getDistance(player, enemy) < 15) return false;
  }
  if (match.minions) {
      const nearbyMinions = match.minions.find(m => m.team !== (isBlue ? 'BLUE' : 'RED') && m.hp > 0 && getDistance(player, m) < 10);
      if (nearbyMinions) return false;
  }
  const lanes = ['top', 'mid', 'bot'] as const;
  const towerCoords = isBlue ? TOWER_COORDS.RED : TOWER_COORDS.BLUE;
  for (const lane of lanes) {
      const broken = (enemyTowers as any)[lane];
      if (broken < 3) {
          [1, 2, 3].forEach(tier => {
              if (tier > broken) {
                  // @ts-ignore
                  const tPos = towerCoords[lane.toUpperCase()][tier - 1];
                  if (tPos && getDistance(player, tPos) < 16) return false;
              }
          });
      }
  }
  if (getDistance(player, towerCoords.NEXUS) < 18) return false;
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
  StatusManager.update(player, dt);
  
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

  const macroDecision = MacroBrain.decide(player, match, hero);
  let finalTargetPos = macroDecision.targetPos;
  let moveSpeed = (player as any).moveSpeed || hero.stats.speed;

  if (macroDecision.action === 'FIGHT' && macroDecision.targetUnit) {
      const enemy = macroDecision.targetUnit;
      if (AIUtils.hpPercent(enemy) < 0.3) {
          moveSpeed *= 1.25; 
      }
  }

  switch (macroDecision.action) {
    case 'RECALL':
      const myBase = isBlue ? BASES.BLUE : BASES.RED;
      if (getDistance(player, myBase) < 8) return; 

      if (!isSafeToRecall(player, match, isBlue)) {
          finalTargetPos = myBase;
          moveSpeed *= 1.1; 
      } else {
          RecallSystem.startRecall(player);
          return;
      }
      break;

    case 'FIGHT':
    case 'DEFEND': 
      if (macroDecision.targetUnit) {
        const micro = MicroBrain.control(player, macroDecision.targetUnit, hero, isBlue);
        
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
                 processSkillEffect(skill, player, macroDecision.targetUnit);
                 
                 player.activeSkill = { key, timestamp: match.currentDuration };

                 // [신규] 스킬 시각 효과 (크고 화려하게)
                 const skillColor = key === 'r' ? '#e74c3c' : (isBlue ? '#58a6ff' : '#e84057');
                 const isAreaSkill = skill.mechanic === 'STUN' || skill.mechanic === 'GLOBAL' || skill.mechanic === 'HEAL';
                 
                 VisualSystem.addEffect(match, {
                    type: isAreaSkill ? 'AREA' : 'EXPLOSION',
                    x: macroDecision.targetUnit.x, 
                    y: macroDecision.targetUnit.y,
                    color: skillColor,
                    size: key === 'r' ? 30 : 15 // 궁극기는 30, 일반은 15 (매우 큼)
                 }, 0.8); // 0.8초 지속

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

    case 'FLEE':
    case 'SUPPORT':
    case 'GANK':
    case 'OBJECTIVE':
    case 'CHASE': 
      finalTargetPos = macroDecision.targetPos;
      break;

    case 'PUSH':
    case 'FARM':
    default:
      finalTargetPos = PathSystem.getNextWaypoint(player, isBlue, match);
      break;
  }

  const mapScaleSpeed = (moveSpeed / 100) * dt * 0.8; 
  const steering = SteeringSystem.calculateSteering(player, finalTargetPos, allies, mapScaleSpeed);

  player.x += steering.x;
  player.y += steering.y;

  player.x = Math.max(0, Math.min(100, player.x));
  player.y = Math.max(0, Math.min(100, player.y));
};
