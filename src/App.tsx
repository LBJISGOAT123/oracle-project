// ==========================================
// FILE PATH: /src/App.tsx
// ==========================================

import React, { useState } from 'react';
import { useGameEngine } from './hooks/useGameEngine';

// 컴포넌트들
import { Header } from './components/layout/Header';
import { GameStats } from './components/dashboard/GameStats';
import { SystemMenu } from './components/common/SystemMenu';

import { HeroStatsView } from './components/hero/HeroStatsView';
import { HeroManagement } from './components/hero/HeroManagement';
import { PatchModal } from './components/hero/PatchModal';
import { UserDashboard } from './components/user/UserDashboard';
import { UserDetailModal } from './components/user/UserDetailModal';
import { BattleDashboard } from './components/battle/BattleDashboard';
import { BattlefieldTab } from './components/battle/BattlefieldTab';
import { CommunityBoard } from './components/community/CommunityBoard';
import { PostDetailModal } from './components/community/PostDetailModal';
import { LiveGameListModal } from './components/battle/LiveGameListModal';
import { SpectateModal } from './components/battle/SpectateModal';
// [신규] 상점 탭 컴포넌트
import { ShopTab } from './components/shop/ShopTab';

import { Swords, User, MessageSquare, Settings, Map, Crown, ShoppingBag } from 'lucide-react';
import { Hero, UserProfile, LiveMatch } from './types';

const TABS = [
  { id: 'hero-stats', label: '영웅 통계', icon: Swords },
  { id: 'hero-manage', label: '영웅 관리', icon: Settings },
  { id: 'shop', label: '아이템 상점', icon: ShoppingBag }, 
  { id: 'user', label: '유저 현황', icon: User },
  { id: 'gods', label: '신(Gods)', icon: Crown },
  { id: 'battlefield', label: '전장', icon: Map },
  { id: 'community', label: '커뮤니티', icon: MessageSquare },
];

function App() {
  const { isMobile, store } = useGameEngine();
  const { gameState, selectedPost, closePost } = store;

  if (!gameState) return <div style={{ color: '#fff', padding: '20px' }}>초기화 중...</div>;

  const [selectedHero, setSelectedHero] = useState<Hero | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showSystemMenu, setShowSystemMenu] = useState(false);
  const [showGameList, setShowGameList] = useState(false);
  const [spectatingMatch, setSpectatingMatch] = useState<LiveMatch | null>(null);
  const [activeTab, setActiveTab] = useState('hero-stats');

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: isMobile ? '10px' : '20px', paddingBottom: '100px' }}>

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
        {activeTab === 'hero-stats' && <HeroStatsView />}
        {activeTab === 'hero-manage' && <HeroManagement onEditHero={setSelectedHero} />}
        {activeTab === 'shop' && <ShopTab />} 
        {activeTab === 'user' && <UserDashboard onUserClick={setSelectedUser} />}
        {activeTab === 'gods' && <BattleDashboard />}
        {activeTab === 'battlefield' && <BattlefieldTab />}
        {activeTab === 'community' && <CommunityBoard />}
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

      {showGameList && (
        <LiveGameListModal 
          onClose={() => setShowGameList(false)} 
          onSpectate={(m) => { 
            setShowGameList(false); // 관전 시작하면 리스트 닫기
            setSpectatingMatch(m); 
          }} 
        />
      )}

      {spectatingMatch && (
        <SpectateModal 
          match={spectatingMatch} 
          onClose={() => { 
            setSpectatingMatch(null); 
            setShowGameList(true); // [핵심] 관전 종료 시 리스트 다시 열기
          }} 
        />
      )}

      {selectedPost && <PostDetailModal post={selectedPost} onClose={closePost} onUserClick={(user) => setSelectedUser(user)} />}
    </div>
  );
}

export default App;