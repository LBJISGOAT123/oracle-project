import { LivePlayer, LiveMatch, Hero, RoleSettings } from '../../../types';
import { attemptBuyItem, updateLivePlayerStats } from './ItemManager'; 
import { SteeringSystem } from './SteeringSystem';
import { PathSystem } from './PathSystem';
import { BASES } from '../constants/MapConstants';
import { MacroBrain } from '../ai/MacroBrain';
import { MicroBrain } from '../ai/MicroBrain';

export const updatePlayerBehavior = (
  player: LivePlayer,
  match: LiveMatch,
  heroes: Hero[],
  shopItems: any[],
  roleSettings: RoleSettings,
  dt: number
) => {
  if (!player.cooldowns) player.cooldowns = { q:0, w:0, e:0, r:0 };
  Object.keys(player.cooldowns).forEach(k => {
    if ((player.cooldowns as any)[k] > 0) (player.cooldowns as any)[k] -= dt;
  });

  if (player.respawnTimer > 0) {
    player.respawnTimer -= dt;
    (player as any).currentRecallTime = 0; 
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
    }
    return;
  }

  const hero = heroes.find(h => h.id === player.heroId);
  if (!hero) return;

  const isBlue = match.blueTeam.includes(player);
  const allies = isBlue ? match.blueTeam : match.redTeam;

  const macroDecision = MacroBrain.decide(player, match, hero);
  
  if (macroDecision.action !== 'RECALL') {
    (player as any).currentRecallTime = 0;
  }

  let finalTargetPos = macroDecision.targetPos;
  let moveSpeed = (player as any).moveSpeed || hero.stats.speed;

  switch (macroDecision.action) {
    case 'RECALL':
      handleRecall(player, isBlue, dt, hero, shopItems, match, heroes);
      return; 

    case 'FIGHT':
    case 'DEFEND': 
      if (macroDecision.targetUnit) {
        const micro = MicroBrain.control(player, macroDecision.targetUnit, hero, isBlue);
        if (micro.type === 'MOVE') {
          finalTargetPos = micro.targetPos;
        } else {
          finalTargetPos = { x: player.x, y: player.y }; 
        }
      }
      break;

    case 'FLEE':
      // [신규] 무조건 도망 (전투 X)
      finalTargetPos = macroDecision.targetPos;
      break;

    case 'SUPPORT':
    case 'GANK':
    case 'OBJECTIVE':
      finalTargetPos = macroDecision.targetPos;
      break;

    case 'PUSH':
    case 'FARM':
    default:
      finalTargetPos = PathSystem.getNextWaypoint(player, isBlue);
      break;
  }

  const mapScaleSpeed = (moveSpeed / 100) * dt * 0.8; 
  const steering = SteeringSystem.calculateSteering(player, finalTargetPos, allies, mapScaleSpeed);

  player.x += steering.x;
  player.y += steering.y;

  player.x = Math.max(0, Math.min(100, player.x));
  player.y = Math.max(0, Math.min(100, player.y));

  if (Math.random() < 0.1 * dt && player.gold > 1000) {
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(player, shopItems, heroes, enemyTeam, match.currentDuration);
  }
};

function handleRecall(p: LivePlayer, isBlue: boolean, dt: number, hero: Hero, shopItems: any[], match: LiveMatch, heroes: Hero[]) {
  const basePos = isBlue ? BASES.BLUE : BASES.RED;
  const dist = Math.sqrt(Math.pow(p.x - basePos.x, 2) + Math.pow(p.y - basePos.y, 2));

  if (dist <= 5) {
    p.currentHp += p.maxHp * 0.5 * dt;
    p.currentMp += p.maxMp * 0.5 * dt;
    if(p.currentHp > p.maxHp) p.currentHp = p.maxHp;
    if(p.currentMp > p.maxMp) p.currentMp = p.maxMp;
    (p as any).currentRecallTime = 0;
    const enemyTeam = isBlue ? match.redTeam : match.blueTeam;
    attemptBuyItem(p, shopItems, heroes, enemyTeam, match.currentDuration);
    return;
  }

  const RECALL_DURATION = 4.0;
  (p as any).currentRecallTime = ((p as any).currentRecallTime || 0) + dt;
  if ((p as any).currentRecallTime >= RECALL_DURATION) {
      p.x = basePos.x;
      p.y = basePos.y;
      (p as any).currentRecallTime = 0;
      p.currentHp += p.maxHp * 0.2;
  }
}
