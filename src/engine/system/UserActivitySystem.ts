import { UserProfile, PlayStyle } from '../../types';

/**
 * [시간대별 접속 가중치 테이블 (0시 ~ 23시)]
 * 각 성향별로 해당 시간에 접속할 확률 가중치 (1.0 = 보통)
 */
const SCHEDULE_WEIGHTS: Record<PlayStyle, number[]> = {
  // 직장인: 평일 낮(09~18)엔 접속 불가, 저녁(19~24)에 피크
  'WORKER': [
    0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.2, 0.1, 0.0, 0.0, 0.0, // 00~11
    0.1, 0.0, 0.0, 0.0, 0.1, 0.2, 0.8, 1.5, 2.5, 3.0, 2.5, 1.0  // 12~23
  ],
  // 학생: 학교 시간(09~15) 낮음, 방과 후(16~22) 피크
  'STUDENT': [
    0.2, 0.1, 0.0, 0.0, 0.0, 0.0, 0.1, 0.5, 0.2, 0.1, 0.1, 0.1, // 00~11
    0.5, 0.2, 0.2, 1.0, 2.0, 2.5, 2.5, 2.0, 1.5, 1.0, 0.5, 0.3  // 12~23
  ],
  // 올빼미: 심야(22~05)에 피크, 낮에 잠
  'NIGHT_OWL': [
    3.0, 2.5, 2.0, 1.5, 1.0, 0.5, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0, // 00~11
    0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.5, 2.0, 2.5, 3.0  // 12~23
  ],
  // 폐인: 밥 먹고 잠자는 시간 빼고 항상 접속
  'HARDCORE': Array(24).fill(1.5)
};

// 시간대별 전체 목표 접속률 (0.0 ~ 1.0) -> 전체 유저의 몇 %가 접속해 있어야 하는가
const GLOBAL_CCU_CURVE = [
  0.15, 0.10, 0.06, 0.04, 0.03, 0.04, 0.07, 0.12, 0.10, 0.09, 0.10, 0.12, // 00~11
  0.15, 0.14, 0.15, 0.18, 0.22, 0.25, 0.28, 0.32, 0.35, 0.32, 0.28, 0.22  // 12~23 (20시 피크 35%)
];

export class UserActivitySystem {
  
  static updateTraffic(hour: number, userPool: UserProfile[]) {
    if (!userPool || userPool.length === 0) return;

    // 1. 현재 시간대 목표 동접자 수 계산
    const currentHour = Math.floor(hour) % 24;
    const baseRatio = GLOBAL_CCU_CURVE[currentHour];
    // 약간의 랜덤성 (±5%) 부여하여 기계적인 느낌 제거
    const targetCCU = Math.floor(userPool.length * (baseRatio * (0.95 + Math.random() * 0.1)));

    // 2. 현재 접속자 수 (INGAME 포함)
    const onlineUsers = userPool.filter(u => u.status !== 'OFFLINE');
    const currentCCU = onlineUsers.length;
    const diff = targetCCU - currentCCU;

    // 3. 트래픽 조정 (접속 or 종료)
    if (diff > 0) {
      // [접속 필요] OFFLINE 유저를 깨움
      this.loginUsers(diff, currentHour, userPool);
    } else if (diff < 0) {
      // [종료 필요] IDLE 유저를 집에 보냄 (게임 중인 유저는 건드리지 않음)
      this.logoutUsers(Math.abs(diff), currentHour, userPool);
    }

    // 4. 휴식 상태 관리
    this.handleRestingUsers(userPool);
  }

  private static loginUsers(count: number, hour: number, pool: UserProfile[]) {
    const offlineUsers = pool.filter(u => u.status === 'OFFLINE');
    if (offlineUsers.length === 0) return;

    // 틱당 너무 많이 접속하면 렉 걸리므로 제한 (최대 30명씩)
    const limit = Math.min(count, 30);
    let loggedIn = 0;

    // 랜덤으로 유저를 뽑되, '성향'이 시간에 맞지 않으면 접속 거부
    // 예: 새벽 4시에 직장인(WORKER)을 뽑으면 접속 확률 매우 낮음
    for (let i = 0; i < limit * 3; i++) { // 시도 횟수를 넉넉히
      if (loggedIn >= limit || offlineUsers.length === 0) break;
      
      const idx = Math.floor(Math.random() * offlineUsers.length);
      const user = offlineUsers[idx];
      
      const weight = SCHEDULE_WEIGHTS[user.playStyle][hour];
      // (기본 확률 20% * 시간 가중치 * 개인 활동성)
      const prob = 0.2 * weight * (1 + user.activityBias);

      if (Math.random() < prob) {
        // 접속 성공
        user.status = 'IDLE';
        user.tiredness = 0;
        // 이번 세션 목표 판수 설정 (2~5판 + 성향 보정)
        user.sessionTarget = 2 + Math.floor(Math.random() * 4);
        if (user.playStyle === 'HARDCORE') user.sessionTarget += 5;
        
        loggedIn++;
        // 중복 방지를 위해 배열에서 제거 (Swap & Pop)
        offlineUsers[idx] = offlineUsers[offlineUsers.length - 1];
        offlineUsers.pop();
      }
    }
  }

  private static logoutUsers(count: number, hour: number, pool: UserProfile[]) {
    // 게임 대기중(IDLE)인 사람만 집에 갈 수 있음
    const idleUsers = pool.filter(u => u.status === 'IDLE');
    if (idleUsers.length === 0) return;

    const limit = Math.min(count, 30);
    let loggedOut = 0;

    for (let i = 0; i < limit * 3; i++) {
      if (loggedOut >= limit || idleUsers.length === 0) break;

      const idx = Math.floor(Math.random() * idleUsers.length);
      const user = idleUsers[idx];

      // 목표 판수를 다 채웠거나, 지금이 활동 시간이 아니면 이탈 확률 증가
      const progress = user.tiredness / (user.sessionTarget || 3);
      const weight = SCHEDULE_WEIGHTS[user.playStyle][hour];
      
      // 이탈 확률 = (목표달성도 * 0.5) + (시간대가 안맞을수록 증가)
      let prob = (progress * 0.5);
      if (weight < 0.2) prob += 0.5; // 잘 시간이다 집에 가라

      if (Math.random() < prob) {
        user.status = 'OFFLINE';
        loggedOut++;
        idleUsers[idx] = idleUsers[idleUsers.length - 1];
        idleUsers.pop();
      }
    }
  }

  private static handleRestingUsers(pool: UserProfile[]) {
    pool.forEach(u => {
      if (u.status === 'RESTING') {
        u.restTimer -= 1;
        if (u.restTimer <= 0) {
          // 휴식 끝. 한 판 했으므로 피로도 증가
          u.tiredness++;
          
          // 목표 달성했으면 50% 확률로 로그아웃, 아니면 다시 큐 돌림
          if (u.tiredness >= u.sessionTarget) {
             u.status = Math.random() < 0.5 ? 'OFFLINE' : 'IDLE';
          } else {
             u.status = 'IDLE';
          }
        }
      }
    });
  }
}
