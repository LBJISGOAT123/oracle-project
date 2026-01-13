// ==========================================
// FILE PATH: /src/engine/match/systems/RewardSystem.ts
// ==========================================
import { LiveMatch, LivePlayer, Hero } from '../../../types';
import { getDistance } from '../../data/MapData';

export const MINION_REWARD = {
    'MELEE': { gold: 21, xp: 60 },
    'RANGED': { gold: 14, xp: 30 },
    'SIEGE': { gold: 60, xp: 90 },
    'SUMMONED_COLOSSUS': { gold: 150, xp: 200 }
};

/**
 * 통합 보상 분배 시스템
 * - 막타 친 영웅: 골드/XP 획득
 * - 주변 아군: XP 공유
 * - 수호기사(서포터): 타곤산 골드 공유
 */
export const distributeRewards = (
    match: LiveMatch, 
    deadUnitPos: {x:number, y:number}, 
    killer: LivePlayer | null, 
    killerTeam: 'BLUE'|'RED', 
    reward: { gold: number, xp: number },
    heroes: Hero[] 
) => {
    // 1. 킬러 보상
    if (killer) {
        killer.cs++;
        killer.gold += reward.gold;

        // [서포터 타곤산 로직]
        const killerHero = heroes.find(h => h.id === killer.heroId);
        if (killerHero && killerHero.role === '수호기사') {
            const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
            let nearestAlly = null;
            let minDist = 15;
            
            for (const ally of allies) {
                if (ally !== killer && ally.currentHp > 0) {
                    const d = getDistance(killer, ally);
                    if (d < minDist) {
                        minDist = d;
                        nearestAlly = ally;
                    }
                }
            }

            if (nearestAlly) {
                nearestAlly.gold += reward.gold; // 골드 공유
                nearestAlly.cs++; // 기분 좋게 CS도 1 올려줌
            }
        }
    }

    // 2. 경험치 분배 (N빵)
    const allies = killerTeam === 'BLUE' ? match.blueTeam : match.redTeam;
    const beneficiaries = allies.filter(p => 
        p.currentHp > 0 && 
        p.respawnTimer <= 0 &&
        getDistance(p, deadUnitPos) < 18 
    );

    if (beneficiaries.length > 0) {
        const xpPerPerson = Math.floor(reward.xp / beneficiaries.length);
        beneficiaries.forEach(p => {
            (p as any).exp = ((p as any).exp || 0) + xpPerPerson;
        });
    }
};

// 어시스트 보상
export const distributeAssist = (match: LiveMatch, killer: LivePlayer, victim: LivePlayer, isBlue: boolean) => {
    const allies = isBlue ? match.blueTeam : match.redTeam;
    const assists = allies.filter(p => p !== killer && p.currentHp > 0 && getDistance(p, victim) < 20);
    
    assists.forEach(p => {
        p.assists++;
        p.gold += 150; 
        (p as any).exp = ((p as any).exp || 0) + 100;
    });
};
