// src/utils/nameGenerator.ts

// 1. [한글] 형용사 (수식어)
const KR_PREFIXES = [
  "맛있는", "즐거운", "우울한", "강력한", "배고픈", "지나가던", "전설의", "수상한", 
  "귀여운", "사악한", "투명한", "도망친", "잠자는", "화난", "행복한", "가난한",
  "부자", "천재", "바보", "미친", "야생의", "집나간", "돌아온", "마지막",
  "탑신병자", "정글차이", "미드오픈", "서폿유저", "원딜왕", "장인", "고수", "초보",
  "핑크", "블랙", "황금", "민트초코", "하와이안", "불타는", "얼어붙은", "신속한",
  "치명적인", "엄마몰래", "학교째고", "밤샘하는", "라면먹는", "치킨먹는", "다이어트",
  "무적의", "패배의", "승리의", "기적의", "침묵의", "영광의", "심연의", "공허의",
  "전광석화", "빛의", "어둠의", "폭풍의", "대지의", "강철의", "신성한", "타락한"
];

// 2. [한글] 명사 (본체)
const KR_SUFFIXES = [
  "다람쥐", "호랑이", "사자", "고양이", "강아지", "펭귄", "슬라임", "드래곤",
  "떡볶이", "치킨", "피자", "햄버거", "국밥", "김치찌개", "라면", "콜라",
  "기사", "마법사", "암살자", "궁수", "전사", "사제", "도적", "성기사",
  "야스오", "티모", "리신", "베인", "제드", "이즈리얼", "럭스", "아리",
  "주먹", "발차기", "검", "방패", "지팡이", "활", "도끼", "망치",
  "컴퓨터", "키보드", "마우스", "모니터", "와이파이", "데이터", "배터리",
  "학생", "아저씨", "형", "누나", "동생", "사장님", "알바생", "백수",
  "유저", "플레이어", "소환사", "챔피언", "미니언", "정글러", "라이너"
];

// 3. [영어] 단어
const EN_WORDS = [
  "Shadow", "Light", "Dark", "Fire", "Ice", "Wind", "Storm", "Thunder",
  "Killer", "Slayer", "Hunter", "Sniper", "Assassin", "Knight", "Warrior",
  "God", "King", "Queen", "Prince", "Princess", "Lord", "Master", "Boss",
  "Faker", "Chovy", "ShowMaker", "Ruler", "Deft", "Viper", "Zeus", "Keria",
  "Alpha", "Beta", "Omega", "Zero", "One", "Infinite", "Eternal", "Final",
  "Crazy", "Mad", "Super", "Ultra", "Hyper", "Mega", "Giga", "Tera",
  "Ghost", "Phantom", "Spirit", "Soul", "Dragon", "Tiger", "Lion", "Wolf"
];

const CLAN_TAGS = ["T1", "GEN", "DK", "KT", "HLE", "DRX", "NS", "BRO", "LSB", "KDF", "SKT", "DWG", "GRF"];
const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];
const chance = (percent: number) => Math.random() < (percent / 100);

export function generateUserName(seedId: number): string {
  const rand = Math.random();

  // [Fix] 모든 패턴에 랜덤 숫자(2~4자리)를 강제로 붙입니다.
  // 1000 ~ 9999 사이의 난수 생성
  const num = Math.floor(100 + Math.random() * 9900); 

  // 패턴 1: [한글] 형용사 + 명사 (50%)
  if (rand < 0.5) {
    const prefix = pick(KR_PREFIXES);
    const suffix = pick(KR_SUFFIXES);
    // 예: 가난한검392, 침묵의떡볶이1024
    return `${prefix}${suffix}${num}`;
  }

  // 패턴 2: [영어] (30%)
  else if (rand < 0.8) {
    // 클랜 태그형: SKT Faker 01
    if (chance(30)) {
      return `${pick(CLAN_TAGS)} ${pick(EN_WORDS)} ${Math.floor(Math.random() * 99)}`;
    }

    // 영단어 조합형: ShadowKiller9999
    if (chance(50)) {
      return `${pick(EN_WORDS)}${pick(EN_WORDS)}${num}`;
    } else {
      // 단일 단어형: Zeus1024
      return `${pick(EN_WORDS)}${num}`;
    }
  }

  // 패턴 3: [컨셉] 리얼한 문장형 (10%)
  else if (rand < 0.9) {
    const sentences = [
      "던지면바로나감", "한타만함", "채팅차단함", "즐겜유저", "빡겜러",
      "엄마가밥먹으래", "내꿈은챌린저", "브론즈탈출기", "버스점요", "서폿차이",
      "미드달려", "정글탓안함", "오빠달려", "누나나죽어", "형믿어",
      "평점1점대", "승률9할", "부캐입니다", "현지인입니다"
    ];
    // 예: 엄마가밥먹으래512
    return `${pick(sentences)}${num}`;
  }

  // 패턴 4: 막친 아이디 (10%)
  else {
    const keys = ["qwer", "asdf", "zxcv", "user", "player", "guest"];
    return `${pick(keys)}${Math.floor(Math.random() * 99999)}`;
  }
}