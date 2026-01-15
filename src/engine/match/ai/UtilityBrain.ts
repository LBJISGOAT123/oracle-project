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
import { MapAwareness } from './systems/MapAwareness';
import { SafetyCheck } from './systems/SafetyCheck';

export class UtilityBrain {
  
  static decideAction(player: LivePlayer, match: LiveMatch, hero: Hero): { action: string, targetPos: {x:number, y:number}, targetUnit?: any } {
    const isBlue = match.blueTeam.includes(player);
    const myBase = isBlue ? BASES.BLUE : BASES.RED;
    
    // [0] 생존 본능 (Override)
    if (AIUtils.dist(player, myBase) < 15) {
        if (AIUtils.hpPercent(player) < 0.95 || (player.maxMp > 0 && AIUtils.mpPercent(player) < 0.95)) {
            return { action: 'RECALL', targetPos: myBase };
        }
        const pushPos = PathSystem.getNextWaypoint(player, isBlue, match);
        return { action: 'PUSH', targetPos: pushPos };
    }

    // [1] 점수 계산
    const scores = {
        recall: 0,
        farm: 0,
        fight: 0,
        push: 0,
        group: 0
    };

    // 1. 귀환 점수
    if (EconomyEvaluator.shouldRecallForShopping(player, match)) scores.recall += 60;
    if (Perception.needsRecall(player)) scores.recall += 80;
    
    // 2. 전투 점수
    const nearby = Perception.analyzeNearbySituation(player, match, 25);
    if (nearby.enemies.length > 0) {
        const powerRatio = nearby.allyPower / Math.max(1, nearby.enemyPower);
        const brainFactor = player.stats.brain > 70 ? 1.2 : 1.0;
        
        if (powerRatio > 1.2 * brainFactor) scores.fight += 80; 
        else if (powerRatio < 0.8 / brainFactor) scores.recall += 50; 
        
        if (nearby.enemies.some(e => AIUtils.hpPercent(e) < 0.3)) scores.fight += 40;
    }

    // 3. 군집 점수 & [핵심 수정] 집결 후 행동 전환
    const squadOrder = SquadController.getGroupOrder(player, match);
    if (squadOrder && squadOrder.pos) {
        const distToGroup = AIUtils.dist(player, squadOrder.pos);
        
        // 아직 집결지로 가는 중이면 '모여라' 점수 높음
        if (distToGroup > 8) {
            scores.group += 70;
        } 
        else {
            // [Fix] 이미 모였으면(거리 8 이내), 그룹 점수를 낮추고 '푸쉬' 점수를 대폭 높임
            // "다 모였으니 가자!" 상태
            scores.group += 10; 
            scores.push += 100; // 강제 진격
        }
    }

    // 4. 파밍/푸쉬 점수
    scores.farm = 30;
    if (player.lane === 'JUNGLE') scores.farm += 20;

    // 5. 맵 리딩 (사리기)
    const hiddenThreat = MapAwareness.getHiddenThreatScore(player, match);
    if (hiddenThreat > 50) {
        scores.push -= hiddenThreat; 
        scores.farm -= (hiddenThreat / 2);
        scores.recall += (hiddenThreat / 3); 
        scores.group += (hiddenThreat / 2);
    }

    // [2] 최적 행동 1차 선택
    const bestActionKey = Object.keys(scores).reduce((a, b) => (scores as any)[a] > (scores as any)[b] ? a : b);
    
    let result = { action: 'WAIT', targetPos: {x: player.x, y: player.y}, targetUnit: undefined as any };

    switch (bestActionKey) {
        case 'recall':
            result = { action: 'RECALL', targetPos: myBase, targetUnit: undefined };
            break;
        case 'fight':
            const target = nearby.enemies[0];
            result = { action: 'FIGHT', targetPos: {x: target.x, y: target.y}, targetUnit: target };
            break;
        case 'group':
            if (squadOrder && squadOrder.pos) result = { action: 'ASSEMBLE', targetPos: squadOrder.pos, targetUnit: undefined };
            break;
        case 'push':
        case 'farm':
        default:
            const path = PathSystem.getNextWaypoint(player, isBlue, match);
            result = { action: 'PUSH', targetPos: path, targetUnit: undefined };
            break;
    }

    // [3] 안전성 검증
    const safeDecision = SafetyCheck.validateAction(player, match, result.action, result.targetPos);
    
    if (safeDecision.action !== result.action) {
        if (safeDecision.action === 'RECALL') {
            return { action: 'RECALL', targetPos: myBase };
        }
        return { action: safeDecision.action, targetPos: safeDecision.targetPos };
    }

    return result;
  }
}
