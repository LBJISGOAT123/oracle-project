import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// [최후의 안전장치]
// React가 렌더링에 실패했을 때, 브라우저 DOM을 직접 조작하여 에러 화면을 띄우는 함수
function showPanicScreen(errorMsg: string, errorStack: string = '') {
  console.error("CRITICAL FAILURE:", errorMsg);

  const root = document.getElementById('root');
  if (!root) return;

  // 기존 화면 클리어
  root.innerHTML = '';

  // 비상용 스타일
  document.body.style.backgroundColor = '#0f1115';
  document.body.style.color = '#fff';
  document.body.style.margin = '0';
  document.body.style.overflow = 'hidden';

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:20px; z-index:99999; font-family:sans-serif; text-align:center;';

  const icon = document.createElement('div');
  icon.innerHTML = '⚠️';
  icon.style.fontSize = '48px';
  icon.style.marginBottom = '20px';

  const title = document.createElement('h1');
  title.innerText = '게임 실행 실패 (Panic Mode)';
  title.style.color = '#da3633';
  title.style.margin = '0 0 10px 0';

  const desc = document.createElement('p');
  desc.innerText = '치명적인 오류로 인해 React 앱을 실행할 수 없습니다.';
  desc.style.color = '#8b949e';

  const errorBox = document.createElement('pre');
  errorBox.innerText = errorMsg + '\n\n' + errorStack;
  errorBox.style.cssText = 'background:#161b22; border:1px solid #da3633; padding:15px; border-radius:8px; color:#ff7b72; text-align:left; width:100%; max-width:600px; overflow:auto; max-height:300px; font-size:12px; margin-bottom:20px; white-space:pre-wrap;';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '10px';

  // 새로고침 버튼
  const reloadBtn = document.createElement('button');
  reloadBtn.innerText = '🔄 다시 시도';
  reloadBtn.style.cssText = 'padding:10px 20px; background:#238636; border:none; color:white; border-radius:6px; cursor:pointer; font-weight:bold;';
  reloadBtn.onclick = () => window.location.reload();

  // 초기화 버튼 (핵심)
  const resetBtn = document.createElement('button');
  resetBtn.innerText = '🗑️ 데이터 초기화 (복구)';
  resetBtn.style.cssText = 'padding:10px 20px; background:#3f1515; border:1px solid #da3633; color:#ff7b72; border-radius:6px; cursor:pointer; font-weight:bold;';
  resetBtn.onclick = () => {
    if (confirm('정말 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
        localStorage.clear();
        // IndexedDB 삭제
        const req = indexedDB.deleteDatabase('GodsWar_DB_V1');
        req.onsuccess = () => window.location.reload();
        req.onerror = () => window.location.reload();
        req.onblocked = () => window.location.reload();
        
        // 혹시 모르니 Legacy 키들도 삭제
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('GW_')) {
                localStorage.removeItem(key);
            }
        }
        alert('초기화 완료. 페이지를 새로고침합니다.');
        window.location.reload();
    }
  };

  btnContainer.appendChild(reloadBtn);
  btnContainer.appendChild(resetBtn);

  container.appendChild(icon);
  container.appendChild(title);
  container.appendChild(desc);
  container.appendChild(errorBox);
  container.appendChild(btnContainer);

  root.appendChild(container);
}

// 1. 전역 에러 핸들러 (스크립트 에러)
window.onerror = function(message, source, lineno, colno, error) {
  showPanicScreen(String(message), error?.stack || `${source}:${lineno}:${colno}`);
  return true; // 브라우저 기본 에러 출력 방지
};

// 2. Promise 에러 핸들러 (Async 에러)
window.onunhandledrejection = function(event) {
  showPanicScreen("Unhandled Promise Rejection", String(event.reason));
};

// 3. React 마운트 시도
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  } else {
    throw new Error("Root element not found");
  }
} catch (e: any) {
  showPanicScreen(e.message, e.stack);
}
