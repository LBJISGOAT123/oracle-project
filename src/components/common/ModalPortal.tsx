import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface Props {
  children: React.ReactNode;
}

export const ModalPortal: React.FC<Props> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  // document.body에 직접 렌더링하여 부모 컴포넌트의 스타일/렌더링 영향에서 벗어남
  return createPortal(children, document.body);
};
