// ==========================================
// FILE PATH: /src/engine/match/systems/JungleSystem.ts
// ==========================================
import { LiveMatch, JungleMob } from '../../../types';
import { Collision } from '../utils/Collision';
import { useGameStore } from '../../../store/useGameStore';
import { DEFAULT_JUNGLE_CONFIG } from '../../../data/jungle/jungleDefaults';
import { JungleCampType } from '../../../types/jungle';

export class JungleSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.jungleMobs || match.jungleMobs.length === 0) {
        match.jungleMobs = this.initJungle();
    }

    match.jungleMobs.forEach(mob => {
      if (!mob.isAlive) {
        mob.respawnTimer -= dt;
        if (mob.respawnTimer <= 0) {
          mob.isAlive = true;
          mob.hp = mob.maxHp;
        }
        return;
      }

      const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(
        h => h.currentHp > 0 && Collision.inRange(h, mob, 10)
      );

      if (nearbyHeroes.length > 0) {
        const dps = nearbyHeroes.reduce((sum, h) => sum + (h.level * 30) + (h.items.length * 20), 0);
        mob.hp -= dps * dt;
        nearbyHeroes.forEach(h => { h.currentHp -= (mob.atk * dt) / nearbyHeroes.length; });

        if (mob.hp <= 0) {
          mob.isAlive = false;
          mob.respawnTimer = (mob as any).configRespawnTime || 60; 
          
          const killer = Collision.findNearest(mob, nearbyHeroes);
          if (killer) {
             const bonus = killer.lane === 'JUNGLE' ? 1.2 : 1.0;
             killer.gold += Math.floor(((mob as any).rewardGold || 50) * bonus);
             (killer as any).exp = ((killer as any).exp || 0) + Math.floor(((mob as any).rewardXp || 80) * bonus);
             
             killer.cs += (mob as any).isBuffMob ? 4 : 1;
             
             if ((mob as any).isBuffMob && (mob as any).buffs) {
                const buffs = (mob as any).buffs as { type: string, value: number }[];
                const buffMsg = buffs.map(b => `${b.type} +${b.value}`).join(', ');
                buffs.forEach(b => {
                    if(!killer.buffs) killer.buffs = [];
                    killer.buffs.push(`${b.type}:${b.value}`);
                });
                if (Math.random() < 0.3) {
                    match.logs.push({
                        time: Math.floor(match.currentDuration),
                        type: 'KILL',
                        message: `Buff: ${killer.name} -> [${buffMsg}] 획득!`
                    });
                }
             }
          }
        }
      } else {
        if (mob.hp < mob.maxHp) mob.hp += mob.maxHp * 0.2 * dt;
      }
    });
  }

  private static initJungle(): JungleMob[] {
    const state = useGameStore.getState().gameState;
    const settings = state.fieldSettings.jungle as any;
    const camps = settings?.camps || DEFAULT_JUNGLE_CONFIG.camps;
    
    const mobs: JungleMob[] = [];

    (Object.keys(camps) as JungleCampType[]).forEach(campKey => {
        const campConfig = camps[campKey];

        campConfig.monsters.forEach((m: any, idx: number) => {
            // [핵심 수정] 좌표 왜곡 로직 삭제 (basePos + offset... 제거)
            // 에디터에서 설정한 좌표(m.x, m.y)가 곧 월드 좌표(0~100)입니다.
            // 그대로 대입하면 위치가 정확히 일치합니다.
            
            mobs.push({
                id: `j_${campKey}_${m.spotId}`,
                campId: idx,
                type: m.stats.isBuffMob ? 'GOLEM' : 'WOLF',
                x: m.x, // 있는 그대로 사용
                y: m.y, // 있는 그대로 사용
                hp: m.stats.hp,
                maxHp: m.stats.hp,
                atk: m.stats.atk,
                respawnTimer: 0,
                isAlive: true,
                // @ts-ignore
                rewardGold: m.stats.gold,
                // @ts-ignore
                rewardXp: m.stats.xp,
                // @ts-ignore
                configRespawnTime: m.stats.respawnTime,
                // @ts-ignore
                isBuffMob: m.stats.isBuffMob,
                // @ts-ignore
                buffs: m.stats.buffs, 
                // @ts-ignore
                name: m.stats.name
            });
        });
    });

    return mobs;
  }
}
