import React, { useState, useEffect } from 'react';
import { useGameEngine } from './hooks/useGameEngine';
import { preloadGameImages } from './utils/ImageLoader';
import { GlobalErrorBoundary } from './utils/GlobalErrorBoundary';

import { Header } from './components/layout/Header';
import { GameStats } from './components/dashboard/GameStats';
import { SystemMenu } from './components/common/SystemMenu'; 
import { HeroStatsView } from './components/hero/HeroStatsView';
import { PatchModal } from './components/hero/PatchModal';
import { UserDashboard } from './components/user/UserDashboard';
import { UserDetailModal } from './components/user/UserDetailModal';
import { BattleDashboard } from './components/battle/BattleDashboard';
import { BattlefieldTab } from './components/battle/BattlefieldTab';
import { CommunityBoard } from './components/community/CommunityBoard';
import { PostDetailModal } from './components/community/PostDetailModal';
import { LiveGameListModal } from './components/battle/LiveGameListModal';
import { SpectateModal } from './components/battle/SpectateModal';
import { ShopTab } from './components/shop/ShopTab';

import { Swords, User, MessageSquare, Map, Crown, ShoppingBag, Loader2 } from 'lucide-react';
import { Hero, UserProfile, LiveMatch } from './types';

const TABS = [
  { id: 'hero-stats', label: '영웅 통계', icon: Swords },
  { id: 'shop', label: '아이템 상점', icon: ShoppingBag }, 
  { id: 'user', label: '유저 현황', icon: User },
  { id: 'gods', label: '신(Gods)', icon: Crown },
  { id: 'battlefield', label: '전장', icon: Map },
  { id: 'community', label: '커뮤니티', icon: MessageSquare },
];

function GameContent() {
  const { isMobile, store, isGameReady } = useGameEngine();
  const { gameState, selectedPost, closePost } = store;

  const [isImageLoading, setIsImageLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);

  useEffect(() => {
    preloadGameImages((percent) => {
      setLoadProgress(percent);
      if (percent >= 100) {
        setTimeout(() => setIsImageLoading(false), 100);
      }
    });
  }, []);

  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const [spectatingMatch, setSpectatingMatch] = useState<LiveMatch | null>(null);
  const [activeTab, setActiveTab] = useState('hero-stats');

  if (isImageLoading || !isGameReady) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0f1115', color: '#fff' }}>
        <div style={{ position: 'relative' }}>
          <Loader2 size={60} color="#58a6ff" style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
        <h2 style={{ marginTop: '20px', fontSize: '18px', fontWeight: 'bold' }}>
          {!isGameReady ? "세이브 데이터 복구 중..." : "리소스 로딩 중..."}
        </h2>
        {isImageLoading && (
          <div style={{ width: '300px', height: '6px', background: '#333', borderRadius: '3px', marginTop: '15px', overflow: 'hidden' }}>
            <div style={{ width: `${loadProgress}%`, height: '100%', background: '#58a6ff', transition: 'width 0.1s' }}></div>
          </div>
        )}
      </div>
    );
  }

  if (!gameState) return <div style={{ color: '#fff', padding: '20px' }}>데이터 초기화 실패. 새로고침 해주세요.</div>;

  return (
    // [핵심] translate="no" 추가로 브라우저 자동 번역 및 DOM 침범 차단
    <div className="notranslate" translate="no" style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '20px', paddingBottom: '100px' }}>
      <Header isMobile={isMobile} onOpenSystemMenu={() => setShowSystemMenu(true)} />
      <GameStats isMobile={isMobile} onOpenGameList={() => setShowGameList(true)} />

      {!isMobile && (
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap:'wrap' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: activeTab === tab.id ? '#58a6ff' : '#161b22', color: activeTab === tab.id ? '#000' : '#8b949e', fontWeight: 'bold', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      )}

      <div style={{ minHeight: '600px' }}>
        <div style={{ display: activeTab === 'hero-stats' ? 'block' : 'none' }}>
          <HeroStatsView />
        </div>
        <div style={{ display: activeTab === 'shop' ? 'block' : 'none' }}>
          <ShopTab />
        </div>
        <div style={{ display: activeTab === 'user' ? 'block' : 'none' }}>
          <UserDashboard onUserClick={setSelectedUser} />
        </div>
        <div style={{ display: activeTab === 'gods' ? 'block' : 'none' }}>
          <BattleDashboard />
        </div>
        <div style={{ display: activeTab === 'battlefield' ? 'block' : 'none' }}>
          <BattlefieldTab />
        </div>
        <div style={{ display: activeTab === 'community' ? 'block' : 'none' }}>
          <CommunityBoard />
        </div>
      </div>

      {isMobile && (
        <nav style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', background: '#161b22', borderTop: '1px solid #333', display: 'flex', justifyContent: 'space-around', padding: '10px 0', zIndex: 9000, paddingBottom: '20px', overflowX:'auto' }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: 'none', border: 'none', color: activeTab === tab.id ? '#58a6ff' : '#8b949e', display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '11px', gap: '4px', minWidth:'60px' }}>
              <tab.icon size={20} />
              {tab.label.split(' ')[0]}
            </button>
          ))}
        </nav>
      )}

      {showSystemMenu && <SystemMenu onClose={() => setShowSystemMenu(false)} />}
      {selectedHero && <PatchModal hero={selectedHero} onClose={() => setSelectedHero(null)} />}
      {selectedUser && <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />}
      {showGameList && <LiveGameListModal onClose={() => setShowGameList(false)} onSpectate={(m) => { setShowGameList(false); setSpectatingMatch(m); }} />}
      {spectatingMatch && <SpectateModal match={spectatingMatch} onClose={() => { setSpectatingMatch(null); setShowGameList(true); }} />}
      {selectedPost && <PostDetailModal post={selectedPost} onClose={closePost} onUserClick={(user) => setSelectedUser(user)} />}
    </div>
  );
}

function App() {
  return (
    <GlobalErrorBoundary>
      <GameContent />
    </GlobalErrorBoundary>
  );
}

export default App;
