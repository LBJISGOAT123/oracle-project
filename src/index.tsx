import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// [비상용] React 실행 불가 시 띄울 화면
function showPanicScreen(errorMsg: string, errorStack: string = '') {
  // DOM 관련 에러는 여기서 띄우지 않고 React Error Boundary에 맡김
  if (
    errorMsg.includes("removeChild") || 
    errorMsg.includes("node to be removed") ||
    errorMsg.includes("Script error") // 크로스 오리진 에러 무시
  ) {
    return;
  }

  console.error("CRITICAL FAILURE:", errorMsg);

  const root = document.getElementById('root');
  if (!root) return;

  root.innerHTML = '';
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
  title.innerText = '시스템 오류 (Panic Mode)';
  title.style.color = '#da3633';
  title.style.margin = '0 0 10px 0';

  const desc = document.createElement('p');
  desc.innerText = '치명적인 오류가 발생했습니다.';
  desc.style.color = '#8b949e';

  const errorBox = document.createElement('pre');
  errorBox.innerText = errorMsg;
  errorBox.style.cssText = 'background:#161b22; border:1px solid #da3633; padding:15px; border-radius:8px; color:#ff7b72; text-align:left; width:100%; max-width:600px; overflow:auto; max-height:200px; font-size:12px; margin-bottom:20px; white-space:pre-wrap;';

  const btnContainer = document.createElement('div');
  btnContainer.style.display = 'flex';
  btnContainer.style.gap = '10px';

  const reloadBtn = document.createElement('button');
  reloadBtn.innerText = '🔄 새로고침';
  reloadBtn.style.cssText = 'padding:10px 20px; background:#238636; border:none; color:white; border-radius:6px; cursor:pointer; font-weight:bold;';
  reloadBtn.onclick = () => window.location.reload();

  const resetBtn = document.createElement('button');
  resetBtn.innerText = '🗑️ 데이터 초기화';
  resetBtn.style.cssText = 'padding:10px 20px; background:#3f1515; border:1px solid #da3633; color:#ff7b72; border-radius:6px; cursor:pointer; font-weight:bold;';
  resetBtn.onclick = () => {
    if (confirm('정말 초기화하시겠습니까?')) {
        localStorage.clear();
        indexedDB.deleteDatabase('GodsWar_DB_V1');
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

// 1. 전역 에러 핸들러
window.onerror = function(message, source, lineno, colno, error) {
  // DOM 에러는 무시 (React가 처리하거나 자동 복구)
  const msg = String(message);
  if (msg.includes("removeChild") || msg.includes("node to be removed")) {
    return true; // 에러 전파 막음
  }
  showPanicScreen(msg, error?.stack);
  return true;
};

// 2. Promise 에러 핸들러
window.onunhandledrejection = function(event) {
  showPanicScreen("Unhandled Promise Rejection", String(event.reason));
};

// 3. 앱 실행
try {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
  }
} catch (e: any) {
  showPanicScreen(e.message, e.stack);
}
