// === FILE: src/data/roles.ts ===

import { Role } from '../types';
import { Shield, Swords, Zap, Crosshair, Skull } from 'lucide-react';

export interface RoleInfo {
  role: Role;
  name: string;      // 영문명 (EXECUTOR 등)
  icon: any;         // 아이콘 컴포넌트
  color: string;     // 대표 색상
  concept: string;   // 한줄 요약 (따옴표 내용)
  desc: string;      // 상세 설명
  traitName: string; // 고유 특성 이름
  traitEffect: string; // 고유 특성 효과 설명
  simEffect: string;   // 시뮬레이션 반영 설명
}

export const ROLE_DATA: Record<Role, RoleInfo> = {
  '집행관': {
    role: '집행관', 
    name: 'EXECUTOR', 
    icon: Shield, // (기존 아이콘 유지)
    color: '#e74c3c',
    concept: '신의 뜻을 지상에 집행하는 무자비한 투사',
    desc: '최전선에서 적의 진형을 붕괴시키고, 1:1 대결에서 물러서지 않는 고독한 전사들입니다.',
    traitName: '[결투의 서약]',
    traitEffect: '주변에 아군이 없을 때(솔로 라인전 시) 피해량 +10%, 방어력 +10%.',
    simEffect: '라인전 단계에서 1:1 킬 확률 보정.'
  },
  '추적자': {
    role: '추적자', 
    name: 'TRACKER', 
    icon: Swords, 
    color: '#2ecc71',
    concept: '보이지 않는 곳에서 이단을 사냥하는 그림자',
    desc: '정해진 라인 없이 전장을 누비며, 변수를 창출하고 주요 목표물(거신병/주시자)을 확보합니다.',
    traitName: '[사냥꾼의 본능]',
    traitEffect: '몬스터/오브젝트 처치 시 골드 획득량 +20%. 다른 라인 개입(갱킹) 시 성공률 증가.',
    simEffect: '정글러의 성장 속도 보정, 오브젝트 막타 확률 보정.'
  },
  '선지자': {
    role: '선지자', 
    name: 'PROPHET', 
    icon: Zap, 
    color: '#3498db',
    concept: '오라클의 계시를 해석하여 마법으로 구현하는 자',
    desc: '전장의 중심에서 강력한 광역 마법으로 적을 쓸어버리고, 전황을 꿰뚫어 봅니다.',
    traitName: '[마력의 흐름]',
    traitEffect: '레벨이 오를수록 스킬 가속(쿨타임 감소) 효과가 추가로 붙음.',
    simEffect: '중후반 교전 시 스킬 점수 계산 가중치 대폭 상승.'
  },
  '신살자': {
    role: '신살자', 
    name: 'GOD SLAYER', 
    icon: Crosshair, 
    color: '#f1c40f',
    concept: '신조차 죽일 수 있는 금단의 무기를 다루는 자',
    desc: '초반엔 약하지만, 성장이 끝나는 순간 신(수호자)과 거신병을 순식간에 파괴하는 핵심 화력입니다.',
    traitName: '[거인 학살자]',
    traitEffect: '구조물(타워, 억제기, 수호자) 및 거신병에게 입히는 피해량 +30%.',
    simEffect: '공성 모드일 때 타워 철거 속도 가속.'
  },
  '수호기사': {
    role: '수호기사', 
    name: 'GUARDIAN', 
    icon: Skull, 
    color: '#9b59b6',
    concept: '동료를 위해 기꺼이 희생하는 신념의 방패',
    desc: '아군(특히 신살자)을 보호하고, 적의 공격을 대신 받아내며 전선을 유지합니다.',
    traitName: '[희생의 성역]',
    traitEffect: '같은 라인에 있는 아군의 생존율을 20% 올려줌. (자신이 대신 죽을 확률 증가)',
    simEffect: '봇 라인전에서 신살자가 죽을 확률을 낮추고, 자신의 데스 확률을 높임.'
  }
};