// ==========================================
// FILE PATH: /src/engine/match/systems/JungleSystem.ts
// ==========================================
import { LiveMatch, JungleMob } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { DEFAULT_JUNGLE_CONFIG } from '../../../data/jungle/jungleDefaults';
import { JungleCampType } from '../../../types/jungle';

export class JungleSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.jungleMobs || match.jungleMobs.length === 0) {
        match.jungleMobs = this.initJungle();
    }

    match.jungleMobs.forEach(mob => {
      // 1. 죽은 몹 리젠 타이머
      if (!mob.isAlive) {
        mob.respawnTimer -= dt;
        if (mob.respawnTimer <= 0) {
          mob.isAlive = true;
          mob.hp = mob.maxHp;
        }
        return;
      }

      // 2. [수정] 살아있는 몹 회복 (전투 중이 아니면)
      // 전투 처리는 이제 CombatPhase에서 전담하므로 여기선 회복만 신경 씀
      if (mob.hp < mob.maxHp) {
          // 맞고 있는 중인지 체크할 방법이 마땅치 않으므로, 
          // 체력이 깎여있으면 천천히 회복 (영웅이 치면 데미지가 더 세서 결국 죽음)
          mob.hp += mob.maxHp * 0.05 * dt; 
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
            mobs.push({
                id: `j_${campKey}_${m.spotId}`,
                campId: idx,
                type: m.stats.isBuffMob ? 'GOLEM' : 'WOLF',
                x: m.x, 
                y: m.y, 
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
