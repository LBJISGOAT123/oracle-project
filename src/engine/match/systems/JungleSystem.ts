// ==========================================
// FILE PATH: /src/engine/match/systems/JungleSystem.ts
// ==========================================
import { LiveMatch, JungleMob } from '../../../types';
import { Collision } from '../utils/Collision';

// 정글 캠프 위치 (대칭)
const CAMPS = [
  { id: 1, x: 25, y: 75, type: 'WOLF' }, // 블루팀 늑대
  { id: 2, x: 35, y: 65, type: 'GOLEM' }, // 블루팀 골렘
  { id: 3, x: 75, y: 25, type: 'WOLF' }, // 레드팀 늑대
  { id: 4, x: 65, y: 35, type: 'GOLEM' }, // 레드팀 골렘
] as const;

export class JungleSystem {
  static update(match: LiveMatch, dt: number) {
    if (!match.jungleMobs) {
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

      // 전투 로직: 근처에 영웅이 있으면 피가 깎임
      const nearbyHeroes = [...match.blueTeam, ...match.redTeam].filter(
        h => h.currentHp > 0 && Collision.inRange(h, mob, 10)
      );

      if (nearbyHeroes.length > 0) {
        // 영웅들이 몹을 때림
        const dps = nearbyHeroes.reduce((sum, h) => sum + (h.level * 10), 0);
        mob.hp -= dps * dt;

        // 몹도 영웅을 때림 (반격)
        nearbyHeroes.forEach(h => {
            h.currentHp -= mob.atk * dt * 0.5; // 여러명이면 분산되겠지만 단순화
        });

        if (mob.hp <= 0) {
          mob.isAlive = false;
          mob.respawnTimer = 60; // 1분 뒤 리젠
          
          // 막타 보상 (가장 가까운 영웅)
          const killer = Collision.findNearest(mob, nearbyHeroes);
          if (killer) {
             killer.gold += 80;
             (killer as any).exp += 120;
             // 로그는 너무 많아질 수 있으니 생략
          }
        }
      } else {
        // 전투 중이 아니면 체력 회복
        if (mob.hp < mob.maxHp) mob.hp += mob.maxHp * 0.2 * dt;
      }
    });
  }

  private static initJungle(): JungleMob[] {
    return CAMPS.map(c => ({
      id: `jungle_${c.id}`,
      campId: c.id,
      type: c.type,
      x: c.x, y: c.y,
      hp: c.type === 'GOLEM' ? 1200 : 800,
      maxHp: c.type === 'GOLEM' ? 1200 : 800,
      atk: c.type === 'GOLEM' ? 60 : 40,
      respawnTimer: 0,
      isAlive: true
    }));
  }
}
