// ==========================================
// FILE PATH: /src/engine/match/ai/tactics/RoleAI.ts
// ==========================================
import { LivePlayer, Hero } from '../../../../types';
import { MicroDecision } from '../MicroBrain';
import { TacticalComputer } from './TacticalComputer';
import { AIUtils } from '../AIUtils';

export class RoleAI {
  
  static getDecision(
    player: LivePlayer, 
    target: LivePlayer, 
    hero: Hero, 
    enemies: LivePlayer[],
    allies: LivePlayer[],
    isBlue: boolean
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

        // 카이팅 위치 계산
        const kitingPos = TacticalComputer.getOptimalKitingPosition(player, target, enemies, range);
        
        // 공격 가능하면 공격, 아니면 무빙
        // (Attack Move 로직: 쿨타임과 거리를 고려)
        if (dist <= range) {
             // 뇌지컬이 높으면 무빙샷 (이동 -> 공격 -> 이동)
             // 여기선 단순화: 50% 확률로 위치 재조정 (무빙), 50% 확률로 공격
             if (Math.random() < (brain / 200)) { 
                 return { type: 'MOVE', targetPos: kitingPos };
             }
             return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
        } else {
            return { type: 'MOVE', targetPos: kitingPos };
        }
    }

    // 2. [추적자] (암살자) -> 진입 각 보기
    if (role === '추적자') {
        // 적의 주요 스킬(CC)이 빠졌는지 체크하는 척 (뇌지컬 반영)
        const isSafeToEnter = brain < 50 || Math.random() > 0.3; 
        
        if (isSafeToEnter) {
            // 암살 시도: 적에게 붙음
            if (dist > 2.0) {
                return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
            }
            return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
        } else {
            // 간보기 (Flanking)
            const flankPos = TacticalComputer.getFlankingPosition(player, target);
            return { type: 'MOVE', targetPos: flankPos };
        }
    }

    // 3. [수호기사] (탱커) -> 아군 보호 및 앞라인
    if (role === '수호기사') {
        // 가장 강한 아군(딜러) 찾기
        const carry = allies.find(a => a !== player && (a.role === '신살자' || a.role === '선지자') && a.currentHp > 0);
        
        if (carry && brain > 60) {
            // 아군 딜러가 위협받는지 확인
            const threat = enemies.find(e => AIUtils.dist(carry, e) < 10);
            if (threat) {
                // 필링(Peeling): 적과 아군 사이로 이동
                const peelPos = TacticalComputer.getPeelingPosition(player, carry, threat);
                // 이동 후 적이 사거리 내면 공격 (CC 걸기 위해)
                if (AIUtils.dist(player, threat) < range) {
                    return { type: 'ATTACK', targetPos: { x: threat.x, y: threat.y } };
                }
                return { type: 'MOVE', targetPos: peelPos };
            }
        }
    }

    // [기본] 집행관 및 기타 -> 닥공
    if (dist > range * 0.8) {
        return { type: 'MOVE', targetPos: { x: target.x, y: target.y } };
    }
    return { type: 'ATTACK', targetPos: { x: target.x, y: target.y } };
  }
}
