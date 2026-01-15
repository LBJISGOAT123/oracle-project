// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/RoleAI.ts
// ==========================================
import { LivePlayer, Hero, LiveMatch } from '../../../../types';
import { MicroDecision } from '../MicroBrain';
import { TacticalComputer } from './TacticalComputer';
import { AIUtils } from '../AIUtils';

export class RoleAI {
  
  static getDecision(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    match: LiveMatch
  ): MicroDecision {
    const brain = player.stats.brain;
    const role = hero.role;
    const dist = AIUtils.dist(player, target);
    const range = (hero.stats.range / 100) + 1.0;

    // 1. [신살자/선지자] (원거리 딜러) -> 카이팅 필수
    if (role === '신살자' || role === '선지자') {
        // 뇌지컬 40 이하는 그냥 말뚝딜 (제자리 공격)
        if (brain < 40 && dist <= range) {
            return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
        }

        // InfluenceMap 기반 안전한 카이팅 위치 계산
        const kitingPos = TacticalComputer.getOptimalKitingPosition(player, target, match, range);
        
        // 공격 사거리 내라면? -> 무빙샷 (Attack Move)
        if (dist <= range) {
             // 뇌지컬이 높을수록 무빙 빈도 증가 (칼같은 카이팅)
             // brain 100 -> 50% 확률로 포지셔닝 조정, 50% 공격
             if (Math.random() < (brain / 200)) { 
                 return { type: 'MOVE', targetPos: kitingPos };
             }
             return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
        } else {
            // 사거리 밖이면 카이팅 위치로 이동 (추격 or 거리벌리기 자동 적용됨)
            return { type: 'MOVE', targetPos: kitingPos };
        }
    }

    // 2. [추적자] (암살자) -> 진입 각 보기
    if (role === '추적자') {
        // 간보기 (Flanking) - 적의 측후방을 노림
        const flankPos = TacticalComputer.getFlankingPosition(player, target);
        
        // 진입 타이밍: 적 주요 스킬 빠짐 or 딸피 or 뇌지컬 낮음
        const isSafeToEnter = brain < 50 || AIUtils.hpPercent(target) < 0.5 || Math.random() > 0.7; 
        
        if (isSafeToEnter) {
            if (dist > 2.0) {
                // 붙어야 때림
                return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
            }
            return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
        } else {
            // 진입 각 보는 중 (주변 배회)
            return { type: 'MOVE', targetPos: flankPos };
        }
    }

    // 3. [수호기사] (탱커) -> 아군 보호 (Peeling)
    if (role === '수호기사') {
        const isBlue = match.blueTeam.includes(player);
        const allies = isBlue ? match.blueTeam : match.redTeam;
        
        // 가장 강한 아군(딜러) 찾기
        const carry = allies.find(a => a !== player && (a.role === '신살자' || a.role === '선지자') && a.currentHp > 0);
        
        if (carry && brain > 60) {
            const enemyDistToCarry = AIUtils.dist(carry, target);
            // 적이 우리 딜러를 물려고 하면?
            if (enemyDistToCarry < 8.0) {
                // 적과 아군 사이를 가로막음
                const peelPos = TacticalComputer.getPeelingPosition(player, carry, target);
                
                // 이동 후 적이 사거리 내면 공격 (CC 걸기 위해)
                if (AIUtils.dist(player, target) < range) {
                    return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
                }
                return { type: 'MOVE', targetPos: peelPos };
            }
        }
    }

    // [기본] 집행관 및 기타 -> 닥공 (단, 너무 깊숙히는 안 들어감)
    if (dist > range * 0.8) {
        return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
    }
    return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
  }
}
