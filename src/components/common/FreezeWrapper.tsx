import React from 'react';

interface Props {
  isHidden: boolean;
  children: React.ReactNode;
}

// React.memo를 사용하여 isHidden이 true일 때는 
// 내부 children이 바뀌어도 리렌더링을 수행하지 않음 (이전 스냅샷 유지)
export const FreezeWrapper = React.memo(({ isHidden, children }: Props) => {
  return (
    <div style={{ flex: 1, display: isHidden ? 'none' : 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {children}
    </div>
  );
}, (prev, next) => {
  // 만약 다음 상태가 '숨김(hidden)'이라면, 
  // 내부 데이터가 아무리 바뀌어도(props가 변해도) 리렌더링 하지 않음 (true 반환)
  if (next.isHidden) return true;
  
  // 보여지는 상태라면 정상적으로 비교하여 업데이트
  return prev.isHidden === next.isHidden && prev.children === next.children;
});
