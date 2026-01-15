import React from 'react';
import { VisualEffect } from '../../../../../types';

interface Props {
  effects: VisualEffect[];
}

export const EffectLayer: React.FC<Props> = () => {
  // [최적화] 시각 이펙트 렌더링 완전 제거
  return null;
};
