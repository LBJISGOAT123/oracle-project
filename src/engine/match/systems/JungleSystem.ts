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
        const dps = nearbyHeroes.reduce((sum, h) => sum + (h.level * 20) + (h.items.length * 15), 0);
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
             
             if ((mob as any).isBuffMob && (mob as any).buffs) {
                const buffs = (mob as any).buffs as { type: string, value: number }[];
                const buffMsg = buffs.map(b => `${b.type} +${b.value}`).join(', ');
                buffs.forEach(b => {
                    if(!killer.buffs) killer.buffs = [];
                    killer.buffs.push(`${b.type}:${b.value}`);
                });
                match.logs.push({
                    time: Math.floor(match.currentDuration),
                    type: 'KILL',
                    message: `Buff: ${killer.name} -> [${buffMsg}] 획득!`
                });
             }
          }
        }
      } else {
        if (mob.hp < mob.maxHp) mob.hp += mob.maxHp * 0.2 * dt;
      }
    });
  }

  // [핵심 수정] 하드코딩 좌표 제거 -> 스토어의 positions 참조
  private static initJungle(): JungleMob[] {
    const state = useGameStore.getState().gameState;
    
    // 1. 몬스터 스펙 (HP, 골드 등)
    const settings = state.fieldSettings.jungle as any;
    const camps = settings?.camps || DEFAULT_JUNGLE_CONFIG.camps;
    
    // 2. 캠프 위치 좌표 (fieldSettings.positions에서 가져옴)
    const positions = state.fieldSettings.positions;
    
    // positions.jungle 배열은 [BlueTop, BlueBot, RedTop, RedBot] 순서
    // [중요] gameSlice.ts에서 업데이트한 값을 여기서 끌어다 씀
    const CAMP_POSITIONS: Record<JungleCampType, {x:number, y:number}> = {
        TOP_BLUE: positions.jungle[0] || { x: 15, y: 42 }, // Blue Top (좌측 벽)
        BOT_BLUE: positions.jungle[1] || { x: 50, y: 82 }, // Blue Bot (우측 하단)
        TOP_RED:  positions.jungle[2] || { x: 58, y: 22 },
        BOT_RED:  positions.jungle[3] || { x: 82, y: 55 }
    };

    const mobs: JungleMob[] = [];

    (Object.keys(camps) as JungleCampType[]).forEach(campKey => {
        const campConfig = camps[campKey];
        const basePos = CAMP_POSITIONS[campKey];

        campConfig.monsters.forEach((m: any, idx: number) => {
            // 상대 좌표(0~100)를 절대 월드 좌표로 변환 (스케일 0.12)
            const worldX = basePos.x + (m.x - 50) * 0.12; 
            const worldY = basePos.y + (m.y - 50) * 0.12;

            mobs.push({
                id: `j_${campKey}_${m.spotId}`,
                campId: idx,
                type: m.stats.isBuffMob ? 'GOLEM' : 'WOLF',
                x: worldX,
                y: worldY,
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
