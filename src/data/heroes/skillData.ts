// ==========================================
// FILE PATH: /src/data/heroes/skillData.ts
// ==========================================
import { HeroSkillSet } from '../../types';

export const HERO_SKILL_DATA: Record<string, HeroSkillSet> = {
  // 1. 집행관
  h_ragna: { 
    passive: { name: "피의 갈증", mechanic: "HEAL", val: 40, adRatio: 0.1, apRatio: 0, cd: 4, range: 0, duration: 0, isPassive: true },
    q: { name: "대검 내려찍기", mechanic: "NONE", val: 140, adRatio: 1.1, apRatio: 0, cd: 5, range: 300, duration: 0 },
    w: { name: "광폭화", mechanic: "SHIELD", val: 180, adRatio: 0.4, apRatio: 0, cd: 12, range: 0, duration: 4.0 },
    e: { name: "돌진 베기", mechanic: "DASH", val: 450, adRatio: 0.6, apRatio: 0, cd: 9, range: 450, duration: 0.2 },
    r: { name: "라그나로크", mechanic: "EXECUTE", val: 450, adRatio: 2.2, apRatio: 0, cd: 110, range: 400, duration: 0 }
  },
  h_kensei: { 
    passive: { name: "검의 극의", mechanic: "NONE", val: 30, adRatio: 0.2, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "발도술", mechanic: "NONE", val: 160, adRatio: 1.3, apRatio: 0, cd: 4, range: 350, duration: 0 },
    w: { name: "반격", mechanic: "SHIELD", val: 120, adRatio: 0.7, apRatio: 0, cd: 14, range: 0, duration: 1.5 },
    e: { name: "일섬", mechanic: "DASH", val: 500, adRatio: 0.5, apRatio: 0, cd: 8, range: 500, duration: 0.1 },
    r: { name: "오의: 무신참", mechanic: "STUN", val: 400, adRatio: 1.8, apRatio: 0, cd: 120, range: 550, duration: 1.5 }
  },
  h_baldur: { 
    passive: { name: "빛의 갑옷", mechanic: "SHIELD", val: 60, adRatio: 0.1, apRatio: 0, cd: 10, range: 0, duration: 5.0, isPassive: true },
    q: { name: "심판의 망치", mechanic: "STUN", val: 120, adRatio: 0.9, apRatio: 0, cd: 10, range: 250, duration: 1.2 },
    w: { name: "불굴", mechanic: "HEAL", val: 160, adRatio: 0.4, apRatio: 0, cd: 16, range: 0, duration: 0 },
    e: { name: "성스러운 돌격", mechanic: "DASH", val: 500, adRatio: 0.6, apRatio: 0, cd: 11, range: 500, duration: 0.3 },
    r: { name: "신성한 분노", mechanic: "NONE", val: 350, adRatio: 1.6, apRatio: 0, cd: 100, range: 600, duration: 0 }
  },
  h_freya: { 
    passive: { name: "전장의 춤", mechanic: "NONE", val: 20, adRatio: 0.1, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "투창", mechanic: "NONE", val: 130, adRatio: 1.0, apRatio: 0, cd: 6, range: 550, duration: 0 },
    w: { name: "깃털 방패", mechanic: "SHIELD", val: 110, adRatio: 0.3, apRatio: 0, cd: 13, range: 0, duration: 3.0 },
    e: { name: "비상", mechanic: "DASH", val: 550, adRatio: 0.5, apRatio: 0, cd: 14, range: 550, duration: 0.3 },
    r: { name: "발키리의 강림", mechanic: "GLOBAL", val: 400, adRatio: 1.5, apRatio: 0, cd: 140, range: 20000, duration: 0 }
  },
  h_gorgon: { 
    passive: { name: "석화의 시선", mechanic: "STUN", val: 0, adRatio: 0, apRatio: 0, cd: 25, range: 400, duration: 1.0, isPassive: true },
    q: { name: "맹독", mechanic: "NONE", val: 110, adRatio: 0.8, apRatio: 0.3, cd: 5, range: 400, duration: 0 },
    w: { name: "위협", mechanic: "NONE", val: 90, adRatio: 0.6, apRatio: 0, cd: 9, range: 300, duration: 0 },
    e: { name: "꼬리치기", mechanic: "HOOK", val: 450, adRatio: 0.7, apRatio: 0, cd: 13, range: 450, duration: 0.5 },
    r: { name: "석화의 저주", mechanic: "STUN", val: 280, adRatio: 1.1, apRatio: 0.7, cd: 110, range: 600, duration: 2.0 }
  },
  h_arthur: { 
    passive: { name: "왕의 권위", mechanic: "NONE", val: 15, adRatio: 0.1, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "엑스칼리버", mechanic: "NONE", val: 150, adRatio: 1.2, apRatio: 0, cd: 7, range: 300, duration: 0 },
    w: { name: "원탁의 가호", mechanic: "SHIELD", val: 140, adRatio: 0.4, apRatio: 0, cd: 15, range: 0, duration: 4.0 },
    e: { name: "왕의 진격", mechanic: "DASH", val: 500, adRatio: 0.7, apRatio: 0, cd: 11, range: 500, duration: 0.3 },
    r: { name: "승리의 검", mechanic: "EXECUTE", val: 500, adRatio: 2.0, apRatio: 0, cd: 130, range: 500, duration: 0 }
  },
  h_leonidas: { 
    passive: { name: "스파르타", mechanic: "SHIELD", val: 70, adRatio: 0.2, apRatio: 0, cd: 18, range: 0, duration: 3.0, isPassive: true },
    q: { name: "창 찌르기", mechanic: "NONE", val: 140, adRatio: 1.1, apRatio: 0, cd: 5, range: 400, duration: 0 },
    w: { name: "방패 밀치기", mechanic: "STUN", val: 100, adRatio: 0.5, apRatio: 0, cd: 12, range: 200, duration: 1.2 },
    e: { name: "함성", mechanic: "HEAL", val: 100, adRatio: 0.3, apRatio: 0, cd: 16, range: 0, duration: 0 },
    r: { name: "최후의 저항", mechanic: "SHIELD", val: 500, adRatio: 1.0, apRatio: 0, cd: 140, range: 0, duration: 6.0 }
  },
  h_musashi: { 
    passive: { name: "이도류", mechanic: "NONE", val: 25, adRatio: 0.3, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "십자 베기", mechanic: "NONE", val: 150, adRatio: 1.3, apRatio: 0, cd: 6, range: 300, duration: 0 },
    w: { name: "회피", mechanic: "DASH", val: 400, adRatio: 0.2, apRatio: 0, cd: 8, range: 400, duration: 0.1 },
    e: { name: "명상", mechanic: "HEAL", val: 80, adRatio: 0.3, apRatio: 0, cd: 15, range: 0, duration: 0 },
    r: { name: "오륜의 서", mechanic: "EXECUTE", val: 480, adRatio: 2.1, apRatio: 0, cd: 120, range: 400, duration: 0 }
  },
  h_lancelot: { 
    passive: { name: "호수의 기사", mechanic: "NONE", val: 10, adRatio: 0.1, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "연속 찌르기", mechanic: "DASH", val: 550, adRatio: 1.0, apRatio: 0, cd: 7, range: 550, duration: 0.2 },
    w: { name: "패링", mechanic: "SHIELD", val: 90, adRatio: 0.5, apRatio: 0, cd: 10, range: 0, duration: 1.5 },
    e: { name: "가르기", mechanic: "NONE", val: 120, adRatio: 0.9, apRatio: 0, cd: 8, range: 350, duration: 0 },
    r: { name: "아론다이트", mechanic: "NONE", val: 400, adRatio: 1.8, apRatio: 0, cd: 110, range: 400, duration: 0 }
  },
  h_siegfried: { 
    passive: { name: "용의 피", mechanic: "SHIELD", val: 100, adRatio: 0.1, apRatio: 0, cd: 20, range: 0, duration: 5.0, isPassive: true },
    q: { name: "발뭉", mechanic: "NONE", val: 160, adRatio: 1.3, apRatio: 0, cd: 8, range: 350, duration: 0 },
    w: { name: "용의 포효", mechanic: "STUN", val: 80, adRatio: 0.4, apRatio: 0, cd: 16, range: 400, duration: 1.5 },
    e: { name: "재생", mechanic: "HEAL", val: 120, adRatio: 0.3, apRatio: 0, cd: 20, range: 0, duration: 0 },
    r: { name: "드래곤 슬레이어", mechanic: "EXECUTE", val: 550, adRatio: 2.3, apRatio: 0, cd: 130, range: 450, duration: 0 }
  },

  // 2. 선지자
  h_merlin: { 
    passive: { name: "마력 과부하", mechanic: "NONE", val: 30, adRatio: 0, apRatio: 0.3, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "화염구", mechanic: "NONE", val: 160, adRatio: 0, apRatio: 1.3, cd: 5, range: 900, duration: 0 },
    w: { name: "마법 보호막", mechanic: "SHIELD", val: 140, adRatio: 0, apRatio: 0.7, cd: 14, range: 0, duration: 3.0 },
    e: { name: "점멸", mechanic: "DASH", val: 450, adRatio: 0, apRatio: 0, cd: 15, range: 450, duration: 0.1 },
    r: { name: "메테오", mechanic: "GLOBAL", val: 600, adRatio: 0, apRatio: 2.8, cd: 140, range: 20000, duration: 0 }
  },
  h_crowley: { 
    passive: { name: "흑마술", mechanic: "HEAL", val: 20, adRatio: 0, apRatio: 0.2, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "저주받은 탄환", mechanic: "NONE", val: 130, adRatio: 0, apRatio: 1.0, cd: 4, range: 800, duration: 0 },
    w: { name: "영혼 흡수", mechanic: "NONE", val: 110, adRatio: 0, apRatio: 0.8, cd: 9, range: 700, duration: 0 },
    e: { name: "공포", mechanic: "STUN", val: 70, adRatio: 0, apRatio: 0.5, cd: 16, range: 600, duration: 1.8 },
    r: { name: "지옥문", mechanic: "NONE", val: 450, adRatio: 0, apRatio: 2.2, cd: 120, range: 900, duration: 0 }
  },
  h_elara: { 
    passive: { name: "별의 축복", mechanic: "HEAL", val: 50, adRatio: 0, apRatio: 0.4, cd: 10, range: 600, duration: 0, isPassive: true },
    q: { name: "빛의 화살", mechanic: "NONE", val: 120, adRatio: 0, apRatio: 1.1, cd: 5, range: 950, duration: 0 },
    w: { name: "치유", mechanic: "HEAL", val: 150, adRatio: 0, apRatio: 0.8, cd: 10, range: 700, duration: 0 },
    e: { name: "구속", mechanic: "STUN", val: 90, adRatio: 0, apRatio: 0.7, cd: 13, range: 800, duration: 1.5 },
    r: { name: "천상의 심판", mechanic: "GLOBAL", val: 500, adRatio: 0, apRatio: 2.0, cd: 130, range: 20000, duration: 0 }
  },
  h_nix: { 
    passive: { name: "어둠의 장막", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 25, range: 0, duration: 4.0, isPassive: true },
    q: { name: "어둠의 구체", mechanic: "NONE", val: 140, adRatio: 0, apRatio: 1.2, cd: 6, range: 850, duration: 0 },
    w: { name: "그림자 속박", mechanic: "HOOK", val: 450, adRatio: 0, apRatio: 0.6, cd: 15, range: 800, duration: 1.0 },
    e: { name: "어둠 도약", mechanic: "DASH", val: 400, adRatio: 0, apRatio: 0.4, cd: 12, range: 400, duration: 0.2 },
    r: { name: "영원한 밤", mechanic: "STUN", val: 450, adRatio: 0, apRatio: 2.1, cd: 140, range: 1000, duration: 2.5 }
  },
  h_sol: { 
    passive: { name: "태양열", mechanic: "NONE", val: 20, adRatio: 0, apRatio: 0.2, cd: 0, range: 400, duration: 0, isPassive: true },
    q: { name: "플레어", mechanic: "NONE", val: 170, adRatio: 0, apRatio: 1.4, cd: 7, range: 950, duration: 0 },
    w: { name: "태양 방패", mechanic: "SHIELD", val: 130, adRatio: 0, apRatio: 0.6, cd: 14, range: 0, duration: 4.0 },
    e: { name: "열풍", mechanic: "DASH", val: 450, adRatio: 0, apRatio: 0.4, cd: 12, range: 450, duration: 0.2 },
    r: { name: "슈퍼노바", mechanic: "NONE", val: 600, adRatio: 0, apRatio: 2.7, cd: 150, range: 1100, duration: 0 }
  },
  h_gaia: { 
    passive: { name: "대지의 가호", mechanic: "SHIELD", val: 70, adRatio: 0, apRatio: 0.3, cd: 15, range: 0, duration: 5.0, isPassive: true },
    q: { name: "지진", mechanic: "NONE", val: 130, adRatio: 0, apRatio: 1.0, cd: 7, range: 800, duration: 0 },
    w: { name: "덩굴 손", mechanic: "STUN", val: 90, adRatio: 0, apRatio: 0.7, cd: 13, range: 750, duration: 1.5 },
    e: { name: "재생", mechanic: "HEAL", val: 120, adRatio: 0, apRatio: 0.6, cd: 14, range: 600, duration: 0 },
    r: { name: "대자연의 분노", mechanic: "GLOBAL", val: 450, adRatio: 0, apRatio: 2.0, cd: 130, range: 20000, duration: 0 }
  },
  h_nostra: { 
    passive: { name: "예지", mechanic: "NONE", val: 25, adRatio: 0, apRatio: 0.2, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "운명의 수레바퀴", mechanic: "NONE", val: 140, adRatio: 0, apRatio: 1.1, cd: 6, range: 900, duration: 0 },
    w: { name: "재앙", mechanic: "STUN", val: 80, adRatio: 0, apRatio: 0.6, cd: 14, range: 700, duration: 1.5 },
    e: { name: "시간 왜곡", mechanic: "DASH", val: 400, adRatio: 0, apRatio: 0, cd: 18, range: 400, duration: 0.2 },
    r: { name: "종말의 예언", mechanic: "GLOBAL", val: 500, adRatio: 0, apRatio: 2.3, cd: 150, range: 20000, duration: 0 }
  },
  h_rasputin: { 
    passive: { name: "불멸", mechanic: "HEAL", val: 40, adRatio: 0, apRatio: 0.2, cd: 10, range: 0, duration: 0, isPassive: true },
    q: { name: "독극물", mechanic: "NONE", val: 120, adRatio: 0, apRatio: 1.0, cd: 5, range: 750, duration: 0 },
    w: { name: "최면", mechanic: "STUN", val: 70, adRatio: 0, apRatio: 0.5, cd: 12, range: 650, duration: 2.0 },
    e: { name: "자가 치유", mechanic: "HEAL", val: 140, adRatio: 0, apRatio: 0.8, cd: 10, range: 0, duration: 0 },
    r: { name: "괴승의 저주", mechanic: "NONE", val: 400, adRatio: 0, apRatio: 1.9, cd: 120, range: 900, duration: 0 }
  },
  h_circe: { 
    passive: { name: "변신술", mechanic: "NONE", val: 20, adRatio: 0, apRatio: 0.2, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "독약", mechanic: "NONE", val: 130, adRatio: 0, apRatio: 1.1, cd: 6, range: 800, duration: 0 },
    w: { name: "변이", mechanic: "STUN", val: 60, adRatio: 0, apRatio: 0.5, cd: 16, range: 600, duration: 1.5 },
    e: { name: "환영", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 18, range: 0, duration: 3.0 },
    r: { name: "마녀의 연회", mechanic: "GLOBAL", val: 450, adRatio: 0, apRatio: 2.2, cd: 140, range: 20000, duration: 0 }
  },
  h_morgana: { 
    passive: { name: "타락", mechanic: "SHIELD", val: 50, adRatio: 0, apRatio: 0.3, cd: 12, range: 0, duration: 4.0, isPassive: true },
    q: { name: "어둠의 속박", mechanic: "STUN", val: 100, adRatio: 0, apRatio: 0.8, cd: 10, range: 900, duration: 2.0 },
    w: { name: "고통의 대지", mechanic: "NONE", val: 110, adRatio: 0, apRatio: 0.9, cd: 8, range: 800, duration: 0 },
    e: { name: "블랙 쉴드", mechanic: "SHIELD", val: 160, adRatio: 0, apRatio: 0.7, cd: 16, range: 650, duration: 5.0 },
    r: { name: "영혼의 족쇄", mechanic: "STUN", val: 400, adRatio: 0, apRatio: 2.0, cd: 130, range: 600, duration: 1.5 }
  },

  // 3. 추적자
  h_kage: { 
    passive: { name: "암습", mechanic: "NONE", val: 40, adRatio: 0.5, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "수리검", mechanic: "NONE", val: 120, adRatio: 1.1, apRatio: 0, cd: 4, range: 600, duration: 0 },
    w: { name: "분신술", mechanic: "SHIELD", val: 80, adRatio: 0.4, apRatio: 0, cd: 14, range: 0, duration: 3.0 },
    e: { name: "은신", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 18, range: 0, duration: 5.0 },
    r: { name: "암살 비기", mechanic: "EXECUTE", val: 500, adRatio: 2.5, apRatio: 0, cd: 100, range: 450, duration: 0 }
  },
  h_fenrir: { 
    passive: { name: "야수성", mechanic: "NONE", val: 25, adRatio: 0.3, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "물어뜯기", mechanic: "NONE", val: 140, adRatio: 1.3, apRatio: 0, cd: 5, range: 250, duration: 0 },
    w: { name: "포효", mechanic: "STUN", val: 50, adRatio: 0, apRatio: 0, cd: 15, range: 400, duration: 1.5 },
    e: { name: "도약", mechanic: "DASH", val: 550, adRatio: 0.8, apRatio: 0, cd: 10, range: 550, duration: 0.2 },
    r: { name: "라그나로크의 늑대", mechanic: "NONE", val: 400, adRatio: 2.0, apRatio: 0, cd: 110, range: 0, duration: 0 }
  },
  h_viper: { 
    passive: { name: "신경독", mechanic: "NONE", val: 20, adRatio: 0.2, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "독침", mechanic: "NONE", val: 100, adRatio: 1.0, apRatio: 0, cd: 4, range: 550, duration: 0 },
    w: { name: "연막", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 20, range: 0, duration: 4.0 },
    e: { name: "독사의 춤", mechanic: "DASH", val: 450, adRatio: 0.6, apRatio: 0, cd: 12, range: 450, duration: 0.2 },
    r: { name: "치명적인 맹독", mechanic: "EXECUTE", val: 350, adRatio: 1.8, apRatio: 0, cd: 120, range: 600, duration: 0 }
  },
  h_specter: { 
    passive: { name: "유체화", mechanic: "NONE", val: 25, adRatio: 0, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "영혼 베기", mechanic: "NONE", val: 140, adRatio: 1.2, apRatio: 0, cd: 6, range: 350, duration: 0 },
    w: { name: "빙의", mechanic: "STUN", val: 80, adRatio: 0.5, apRatio: 0, cd: 16, range: 500, duration: 1.0 },
    e: { name: "벽 통과", mechanic: "DASH", val: 600, adRatio: 0, apRatio: 0, cd: 14, range: 600, duration: 0.5 },
    r: { name: "사신의 낫", mechanic: "EXECUTE", val: 550, adRatio: 2.4, apRatio: 0, cd: 130, range: 400, duration: 0 }
  },
  h_locust: { 
    passive: { name: "군체의 의식", mechanic: "NONE", val: 15, adRatio: 0.2, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "갈퀴손", mechanic: "NONE", val: 120, adRatio: 1.1, apRatio: 0, cd: 5, range: 300, duration: 0 },
    w: { name: "갑각 강화", mechanic: "SHIELD", val: 120, adRatio: 0.3, apRatio: 0, cd: 12, range: 0, duration: 4.0 },
    e: { name: "도약 공격", mechanic: "DASH", val: 600, adRatio: 0.9, apRatio: 0, cd: 8, range: 600, duration: 0.3 },
    r: { name: "포식", mechanic: "HEAL", val: 250, adRatio: 1.5, apRatio: 0, cd: 100, range: 300, duration: 0 }
  },
  h_scarlet: { 
    passive: { name: "피의 계약", mechanic: "NONE", val: 30, adRatio: 0.2, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "혈격", mechanic: "NONE", val: 150, adRatio: 1.4, apRatio: 0, cd: 5, range: 400, duration: 0 },
    w: { name: "붉은 안개", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 18, range: 0, duration: 4.0 },
    e: { name: "회전 베기", mechanic: "NONE", val: 110, adRatio: 1.0, apRatio: 0, cd: 8, range: 350, duration: 0 },
    r: { name: "블러드 문", mechanic: "EXECUTE", val: 500, adRatio: 2.3, apRatio: 0, cd: 110, range: 600, duration: 0 }
  },
  h_hattori: { 
    passive: { name: "인술", mechanic: "NONE", val: 30, adRatio: 0.3, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "암살검", mechanic: "NONE", val: 140, adRatio: 1.3, apRatio: 0, cd: 5, range: 350, duration: 0 },
    w: { name: "연막탄", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 14, range: 0, duration: 3.5 },
    e: { name: "그림자 이동", mechanic: "DASH", val: 550, adRatio: 0.6, apRatio: 0, cd: 10, range: 550, duration: 0.2 },
    r: { name: "천본앵", mechanic: "EXECUTE", val: 450, adRatio: 2.2, apRatio: 0, cd: 110, range: 550, duration: 0 }
  },
  h_jack: { 
    passive: { name: "런던의 안개", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 20, range: 0, duration: 6.0, isPassive: true },
    q: { name: "나이프", mechanic: "NONE", val: 120, adRatio: 1.1, apRatio: 0, cd: 4, range: 600, duration: 0 },
    w: { name: "공포심", mechanic: "STUN", val: 70, adRatio: 0.5, apRatio: 0, cd: 12, range: 400, duration: 1.2 },
    e: { name: "잔혹한 일격", mechanic: "NONE", val: 150, adRatio: 1.4, apRatio: 0, cd: 8, range: 300, duration: 0 },
    r: { name: "살인귀의 밤", mechanic: "EXECUTE", val: 550, adRatio: 2.4, apRatio: 0, cd: 120, range: 500, duration: 0 }
  },
  h_arachne: { 
    passive: { name: "거미줄", mechanic: "HOOK", val: 450, adRatio: 0.3, apRatio: 0, cd: 12, range: 450, duration: 0.5, isPassive: true },
    q: { name: "맹독 주입", mechanic: "NONE", val: 110, adRatio: 1.0, apRatio: 0, cd: 5, range: 350, duration: 0 },
    w: { name: "거미줄타기", mechanic: "DASH", val: 700, adRatio: 0.5, apRatio: 0, cd: 12, range: 700, duration: 0.2 },
    e: { name: "고치", mechanic: "STUN", val: 80, adRatio: 0.6, apRatio: 0, cd: 15, range: 500, duration: 1.5 },
    r: { name: "여왕의 사냥", mechanic: "NONE", val: 400, adRatio: 1.8, apRatio: 0, cd: 110, range: 600, duration: 0 }
  },
  h_goemon: { 
    passive: { name: "의적", mechanic: "NONE", val: 20, adRatio: 0.2, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "참격", mechanic: "NONE", val: 130, adRatio: 1.2, apRatio: 0, cd: 5, range: 300, duration: 0 },
    w: { name: "동전 던지기", mechanic: "NONE", val: 100, adRatio: 0.9, apRatio: 0, cd: 8, range: 600, duration: 0 },
    e: { name: "지붕 타기", mechanic: "DASH", val: 600, adRatio: 0.7, apRatio: 0, cd: 14, range: 600, duration: 0.3 },
    r: { name: "대도둑의 연회", mechanic: "GLOBAL", val: 450, adRatio: 2.0, apRatio: 0, cd: 130, range: 1000, duration: 0 }
  },

  // 4. 수호기사
  h_aigis: { 
    passive: { name: "절대 방어", mechanic: "SHIELD", val: 80, adRatio: 0, apRatio: 0, cd: 15, range: 0, duration: 3.0, isPassive: true },
    q: { name: "방패 밀치기", mechanic: "STUN", val: 100, adRatio: 0.6, apRatio: 0, cd: 10, range: 250, duration: 1.0 },
    w: { name: "수호 태세", mechanic: "SHIELD", val: 250, adRatio: 0.2, apRatio: 0, cd: 15, range: 0, duration: 4.0 },
    e: { name: "가로막기", mechanic: "DASH", val: 450, adRatio: 0, apRatio: 0, cd: 12, range: 450, duration: 0.2 },
    r: { name: "철옹성", mechanic: "GLOBAL", val: 300, adRatio: 0, apRatio: 0, cd: 160, range: 20000, duration: 8.0 }
  },
  h_golem: { 
    passive: { name: "바위 피부", mechanic: "NONE", val: 40, adRatio: 0, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "지면 강타", mechanic: "NONE", val: 120, adRatio: 0.8, apRatio: 0, cd: 8, range: 350, duration: 0 },
    w: { name: "단단해지기", mechanic: "SHIELD", val: 200, adRatio: 0.3, apRatio: 0, cd: 14, range: 0, duration: 5.0 },
    e: { name: "바위 던지기", mechanic: "STUN", val: 110, adRatio: 0.7, apRatio: 0, cd: 12, range: 600, duration: 1.2 },
    r: { name: "대지진", mechanic: "STUN", val: 300, adRatio: 1.0, apRatio: 0, cd: 140, range: 800, duration: 2.0 }
  },
  h_paladin: { 
    passive: { name: "신성한 오라", mechanic: "HEAL", val: 15, adRatio: 0, apRatio: 0.1, cd: 5, range: 500, duration: 0, isPassive: true },
    q: { name: "성스러운 일격", mechanic: "NONE", val: 110, adRatio: 0.9, apRatio: 0, cd: 7, range: 300, duration: 0 },
    w: { name: "축복", mechanic: "HEAL", val: 150, adRatio: 0, apRatio: 0.5, cd: 12, range: 600, duration: 0 },
    e: { name: "심판", mechanic: "STUN", val: 90, adRatio: 0.6, apRatio: 0, cd: 15, range: 400, duration: 1.5 },
    r: { name: "신의 가호", mechanic: "GLOBAL", val: 400, adRatio: 0, apRatio: 0, cd: 180, range: 20000, duration: 5.0 }
  },
  h_treant: { 
    passive: { name: "광합성", mechanic: "HEAL", val: 30, adRatio: 0, apRatio: 0, cd: 5, range: 0, duration: 0, isPassive: true },
    q: { name: "뿌리 묶기", mechanic: "STUN", val: 80, adRatio: 0, apRatio: 0.4, cd: 10, range: 650, duration: 1.8 },
    w: { name: "나무 껍질", mechanic: "SHIELD", val: 160, adRatio: 0, apRatio: 0.3, cd: 16, range: 0, duration: 4.0 },
    e: { name: "자연의 손길", mechanic: "HEAL", val: 120, adRatio: 0, apRatio: 0.4, cd: 14, range: 600, duration: 0 },
    r: { name: "숲의 분노", mechanic: "NONE", val: 350, adRatio: 0, apRatio: 1.0, cd: 130, range: 800, duration: 0 }
  },
  h_magnus: { 
    passive: { name: "거인의 힘", mechanic: "NONE", val: 50, adRatio: 0.3, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "충격파", mechanic: "NONE", val: 130, adRatio: 0.9, apRatio: 0, cd: 8, range: 400, duration: 0 },
    w: { name: "들이받기", mechanic: "DASH", val: 550, adRatio: 0.8, apRatio: 0, cd: 12, range: 550, duration: 0.2 },
    e: { name: "위압", mechanic: "STUN", val: 70, adRatio: 0.5, apRatio: 0, cd: 15, range: 300, duration: 1.2 },
    r: { name: "뒤집기", mechanic: "HOOK", val: 250, adRatio: 1.2, apRatio: 0, cd: 100, range: 250, duration: 0.5 }
  },
  h_yeti: { 
    passive: { name: "설인", mechanic: "NONE", val: 25, adRatio: 0, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "얼음 뭉치", mechanic: "STUN", val: 90, adRatio: 0.7, apRatio: 0, cd: 9, range: 550, duration: 1.0 },
    w: { name: "포식", mechanic: "HEAL", val: 180, adRatio: 0.5, apRatio: 0, cd: 18, range: 200, duration: 0 },
    e: { name: "눈사태", mechanic: "NONE", val: 120, adRatio: 0.8, apRatio: 0, cd: 10, range: 450, duration: 0 },
    r: { name: "절대 영도", mechanic: "STUN", val: 350, adRatio: 1.0, apRatio: 0, cd: 140, range: 800, duration: 2.5 }
  },
  h_spartacus: { 
    passive: { name: "노예의 해방", mechanic: "NONE", val: 30, adRatio: 0.3, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "검투사의 일격", mechanic: "NONE", val: 130, adRatio: 1.0, apRatio: 0, cd: 7, range: 300, duration: 0 },
    w: { name: "방패 치기", mechanic: "STUN", val: 90, adRatio: 0.5, apRatio: 0, cd: 12, range: 250, duration: 1.2 },
    e: { name: "불굴", mechanic: "HEAL", val: 140, adRatio: 0.4, apRatio: 0, cd: 16, range: 0, duration: 0 },
    r: { name: "반란의 시작", mechanic: "NONE", val: 380, adRatio: 1.5, apRatio: 0, cd: 140, range: 600, duration: 0 }
  },
  h_titan: { 
    passive: { name: "거인의 피부", mechanic: "SHIELD", val: 80, adRatio: 0, apRatio: 0, cd: 20, range: 0, duration: 5.0, isPassive: true },
    q: { name: "내려찍기", mechanic: "STUN", val: 110, adRatio: 0.8, apRatio: 0, cd: 10, range: 350, duration: 1.0 },
    w: { name: "지진", mechanic: "NONE", val: 140, adRatio: 0.7, apRatio: 0, cd: 14, range: 500, duration: 0 },
    e: { name: "철벽", mechanic: "SHIELD", val: 250, adRatio: 0.3, apRatio: 0, cd: 18, range: 0, duration: 5.0 },
    r: { name: "라그나로크", mechanic: "GLOBAL", val: 450, adRatio: 1.2, apRatio: 0, cd: 160, range: 1000, duration: 0 }
  },
  h_behemoth: { 
    passive: { name: "괴수", mechanic: "NONE", val: 50, adRatio: 0, apRatio: 0, cd: 0, range: 0, duration: 0, isPassive: true },
    q: { name: "돌진", mechanic: "DASH", val: 550, adRatio: 0.7, apRatio: 0, cd: 12, range: 550, duration: 0.3 },
    w: { name: "지면 붕괴", mechanic: "STUN", val: 100, adRatio: 0.6, apRatio: 0, cd: 15, range: 400, duration: 1.2 },
    e: { name: "두꺼운 가죽", mechanic: "SHIELD", val: 200, adRatio: 0.2, apRatio: 0, cd: 16, range: 0, duration: 4.0 },
    r: { name: "포식", mechanic: "EXECUTE", val: 350, adRatio: 1.5, apRatio: 0, cd: 130, range: 300, duration: 0 }
  },
  h_tortuga: { 
    passive: { name: "등껍질", mechanic: "SHIELD", val: 100, adRatio: 0, apRatio: 0, cd: 25, range: 0, duration: 5.0, isPassive: true },
    q: { name: "물대포", mechanic: "NONE", val: 110, adRatio: 0.6, apRatio: 0.4, cd: 8, range: 600, duration: 0 },
    w: { name: "껍질 숨기", mechanic: "SHIELD", val: 300, adRatio: 0, apRatio: 0.5, cd: 20, range: 0, duration: 6.0 },
    e: { name: "회전 공격", mechanic: "STUN", val: 90, adRatio: 0.7, apRatio: 0, cd: 14, range: 400, duration: 1.0 },
    r: { name: "해일", mechanic: "GLOBAL", val: 400, adRatio: 0, apRatio: 1.5, cd: 150, range: 1200, duration: 0 }
  },

  // 5. 신살자
  h_hawk: { 
    passive: { name: "매의 눈", mechanic: "NONE", val: 20, adRatio: 0.5, apRatio: 0, cd: 0, range: 700, duration: 0, isPassive: true },
    q: { name: "정밀 사격", mechanic: "NONE", val: 150, adRatio: 1.4, apRatio: 0, cd: 6, range: 1000, duration: 0 },
    w: { name: "속사", mechanic: "NONE", val: 110, adRatio: 1.0, apRatio: 0, cd: 10, range: 600, duration: 0 },
    e: { name: "회피 기동", mechanic: "DASH", val: 450, adRatio: 0.3, apRatio: 0, cd: 14, range: 450, duration: 0.2 },
    r: { name: "관통상", mechanic: "EXECUTE", val: 450, adRatio: 2.0, apRatio: 0, cd: 110, range: 1200, duration: 0 }
  },
  h_trigger: { 
    passive: { name: "더블 탭", mechanic: "NONE", val: 25, adRatio: 0.4, apRatio: 0, cd: 0, range: 550, duration: 0, isPassive: true },
    q: { name: "난사", mechanic: "NONE", val: 140, adRatio: 1.2, apRatio: 0, cd: 5, range: 600, duration: 0 },
    w: { name: "수류탄", mechanic: "NONE", val: 120, adRatio: 0.8, apRatio: 0, cd: 12, range: 700, duration: 0 },
    e: { name: "슬라이딩", mechanic: "DASH", val: 500, adRatio: 0.4, apRatio: 0, cd: 10, range: 500, duration: 0.3 },
    r: { name: "불꽃놀이", mechanic: "GLOBAL", val: 500, adRatio: 1.8, apRatio: 0, cd: 130, range: 2500, duration: 0 }
  },
  h_nova: { 
    passive: { name: "에너지 충전", mechanic: "NONE", val: 20, adRatio: 0.3, apRatio: 0.2, cd: 0, range: 600, duration: 0, isPassive: true },
    q: { name: "플라즈마", mechanic: "NONE", val: 160, adRatio: 1.3, apRatio: 0, cd: 7, range: 900, duration: 0 },
    w: { name: "중력탄", mechanic: "STUN", val: 80, adRatio: 0.5, apRatio: 0, cd: 15, range: 800, duration: 1.2 },
    e: { name: "추진기", mechanic: "DASH", val: 550, adRatio: 0.5, apRatio: 0, cd: 18, range: 5

       r: { name: "궤도 폭격", mechanic: "GLOBAL", val: 550, adRatio: 2.2, apRatio: 0, cd: 150, range: 20000, duration: 0 }
  },
  h_flint: { 
    passive: { name: "화약 냄새", mechanic: "NONE", val: 30, adRatio: 0.3, apRatio: 0, cd: 0, range: 500, duration: 0, isPassive: true },
    q: { name: "산탄 사격", mechanic: "NONE", val: 170, adRatio: 1.5, apRatio: 0, cd: 8, range: 400, duration: 0 },
    w: { name: "연막탄", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 20, range: 0, duration: 3.5 },
    e: { name: "와이어", mechanic: "DASH", val: 650, adRatio: 0.6, apRatio: 0, cd: 16, range: 650, duration: 0.5 },
    r: { name: "데스페라도", mechanic: "NONE", val: 450, adRatio: 2.5, apRatio: 0, cd: 120, range: 800, duration: 0 }
  },
  h_sylvia: { 
    passive: { name: "바람의 속삭임", mechanic: "NONE", val: 20, adRatio: 0.4, apRatio: 0, cd: 0, range: 650, duration: 0, isPassive: true },
    q: { name: "바람 화살", mechanic: "NONE", val: 140, adRatio: 1.3, apRatio: 0, cd: 6, range: 1000, duration: 0 },
    w: { name: "밀쳐내기", mechanic: "NONE", val: 100, adRatio: 0.6, apRatio: 0, cd: 12, range: 500, duration: 0 },
    e: { name: "바람타기", mechanic: "DASH", val: 500, adRatio: 0.4, apRatio: 0, cd: 14, range: 500, duration: 0.3 },
    r: { name: "폭풍우", mechanic: "NONE", val: 400, adRatio: 1.8, apRatio: 0, cd: 110, range: 900, duration: 0 }
  },
  h_gambit: { 
    passive: { name: "도박사의 행운", mechanic: "NONE", val: 20, adRatio: 0.5, apRatio: 0, cd: 0, range: 550, duration: 0, isPassive: true },
    q: { name: "카드 투척", mechanic: "NONE", val: 150, adRatio: 1.2, apRatio: 0, cd: 5, range: 750, duration: 0 },
    w: { name: "속임수", mechanic: "STEALTH", val: 0, adRatio: 0, apRatio: 0, cd: 18, range: 0, duration: 3.0 },
    e: { name: "판돈 올리기", mechanic: "NONE", val: 0, adRatio: 0.4, apRatio: 0, cd: 10, range: 0, duration: 0 },
    r: { name: "로열 스트레이트", mechanic: "EXECUTE", val: 550, adRatio: 2.4, apRatio: 0, cd: 130, range: 1200, duration: 0 }
  },
  h_robin: { 
    passive: { name: "의적", mechanic: "NONE", val: 20, adRatio: 0.2, apRatio: 0, cd: 0, range: 600, duration: 0, isPassive: true },
    q: { name: "정확한 사격", mechanic: "NONE", val: 150, adRatio: 1.3, apRatio: 0, cd: 6, range: 1100, duration: 0 },
    w: { name: "화살비", mechanic: "NONE", val: 120, adRatio: 1.0, apRatio: 0, cd: 10, range: 800, duration: 0 },
    e: { name: "숲으로 도주", mechanic: "DASH", val: 500, adRatio: 0.4, apRatio: 0, cd: 14, range: 500, duration: 0.3 },
    r: { name: "로빈의 화살", mechanic: "EXECUTE", val: 450, adRatio: 2.1, apRatio: 0, cd: 110, range: 1300, duration: 0 }
  },
  h_artemis: { 
    passive: { name: "달의 사냥꾼", mechanic: "NONE", val: 15, adRatio: 0.4, apRatio: 0, cd: 0, range: 650, duration: 0, isPassive: true },
    q: { name: "월광 화살", mechanic: "NONE", val: 140, adRatio: 1.2, apRatio: 0.3, cd: 5, range: 900, duration: 0 },
    w: { name: "덫 설치", mechanic: "STUN", val: 70, adRatio: 0.5, apRatio: 0, cd: 12, range: 700, duration: 1.5 },
    e: { name: "달빛 질주", mechanic: "DASH", val: 550, adRatio: 0.5, apRatio: 0, cd: 15, range: 550, duration: 0.4 },
    r: { name: "사냥 개시", mechanic: "NONE", val: 420, adRatio: 1.9, apRatio: 0, cd: 120, range: 1000, duration: 0 }
  },
  h_apollo: { 
    passive: { name: "태양의 전차", mechanic: "NONE", val: 30, adRatio: 0.3, apRatio: 0.2, cd: 0, range: 550, duration: 0, isPassive: true },
    q: { name: "음파 공격", mechanic: "NONE", val: 130, adRatio: 1.1, apRatio: 0.4, cd: 6, range: 850, duration: 0 },
    w: { name: "눈부신 빛", mechanic: "STUN", val: 60, adRatio: 0, apRatio: 0.6, cd: 14, range: 600, duration: 1.0 },
    e: { name: "전차 돌진", mechanic: "DASH", val: 550, adRatio: 0.6, apRatio: 0, cd: 16, range: 550, duration: 0.3 },
    r: { name: "태양 폭발", mechanic: "GLOBAL", val: 500, adRatio: 2.0, apRatio: 0.5, cd: 140, range: 1500, duration: 0 }
  },
  h_kaiser: { 
    passive: { name: "황제의 위엄", mechanic: "NONE", val: 35, adRatio: 0.5, apRatio: 0, cd: 0, range: 700, duration: 0, isPassive: true },
    q: { name: "관통탄", mechanic: "NONE", val: 160, adRatio: 1.4, apRatio: 0, cd: 8, range: 1000, duration: 0 },
    w: { name: "지휘", mechanic: "NONE", val: 0, adRatio: 0, apRatio: 0, cd: 15, range: 0, duration: 0 },
    e: { name: "전술 이동", mechanic: "DASH", val: 500, adRatio: 0.4, apRatio: 0, cd: 12, range: 500, duration: 0.3 },
    r: { name: "궤멸 사격", mechanic: "EXECUTE", val: 600, adRatio: 2.5, apRatio: 0, cd: 150, range: 3000, duration: 0 } 
  }
};
