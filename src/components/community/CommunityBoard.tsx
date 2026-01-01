// ==========================================
// FILE PATH: /src/components/community/CommunityBoard.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { Star, ThumbsUp } from 'lucide-react';

export const CommunityBoard: React.FC = () => {
  const { communityPosts, openPost } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const [tab, setTab] = useState<'all' | 'best'>('all');
  const [page, setPage] = useState(1);

  const POSTS_PER_PAGE = isMobile ? 15 : 20;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleTabChange = (newTab: 'all' | 'best') => {
    setTab(newTab);
    setPage(1);
  };

  const filteredPosts = tab === 'best' 
    ? communityPosts.filter(p => p.isBest || p.upvotes >= 10) 
    : communityPosts;

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const startIndex = (page - 1) * POSTS_PER_PAGE;
  const currentPosts = filteredPosts.slice(startIndex, startIndex + POSTS_PER_PAGE);

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case '공략': return '#58a6ff'; 
      case '분석': return '#58a6ff';
      case '징징': return '#e84057'; 
      case '유머': return '#f1c40f'; 
      case '자랑': return '#2ecc71';
      default: return '#8b949e';     
    }
  };

  const MobilePostItem = ({ post }: { post: any }) => (
    <div 
      onClick={() => openPost(post)}
      style={{ 
        padding: '12px 15px', 
        borderBottom: '1px solid #2c2c2f', 
        background: post.isBest ? 'rgba(232, 64, 87, 0.05)' : '#1c1c1f',
        cursor: 'pointer'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '6px', lineHeight: '1.4' }}>
        {post.isBest && (
          <span style={{ fontSize:'10px', background:'#e84057', color:'#fff', padding:'1px 4px', borderRadius:'3px', marginRight:'6px', flexShrink:0 }}>
            BEST
          </span>
        )}
        <span style={{ 
          color: '#e6edf3', 
          fontSize: '15px', 
          fontWeight: post.isBest ? 'bold' : 'normal',
          overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical'
        }}>
          {post.title}
        </span>
        {post.comments > 0 && (
          <span style={{ color:'#58a6ff', fontSize:'13px', marginLeft:'6px', fontWeight:'bold', flexShrink:0 }}>
            [{post.comments}]
          </span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: '#8b949e' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: getCategoryColor(post.category), fontWeight:'bold' }}>{post.category}</span>
          <span style={{ width:'1px', height:'10px', background:'#444' }}></span>
          <span>{post.author}</span>
          <span style={{ width:'1px', height:'10px', background:'#444' }}></span>
          <span>{post.displayTime}</span>
        </div>

        {post.upvotes > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: post.upvotes >= 10 ? '#e84057' : '#8b949e' }}>
            <ThumbsUp size={12} />
            <span>{post.upvotes}</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="panel" style={{ 
      height: isMobile ? '80vh' : '700px', 
      position: 'relative', zIndex: 10,
      background: '#1c1c1f', border: '1px solid #30363d', 
      display:'flex', flexDirection:'column', padding: 0, overflow:'hidden'
    }}>
      <div style={{ padding: '12px 15px', borderBottom: '1px solid #333', background: '#252528', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink: 0 }}>
        <h3 style={{ margin: 0, color:'#fff', fontSize: '16px', fontWeight: '800' }}>오라클 자유게시판</h3>
        <div style={{ display:'flex', background:'#161b22', borderRadius:'6px', padding:'3px' }}>
          <button onClick={() => handleTabChange('all')} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize:'12px', background: tab === 'all' ? '#30363d' : 'transparent', color: tab === 'all' ? '#fff' : '#666' }}>전체</button>
          <button onClick={() => handleTabChange('best')} style={{ padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize:'12px', background: tab === 'best' ? '#e84057' : 'transparent', color: tab === 'best' ? '#fff' : '#666', display:'flex', alignItems:'center', gap:'4px' }}><Star size={12}/> 념글</button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', background: '#161b22' }}>
        {isMobile ? (
          <div>{currentPosts.map((post) => <MobilePostItem key={post.id} post={post} />)}</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize:'13px', tableLayout:'fixed' }}>
            <thead>
              <tr style={{ background:'#161b22', color:'#8b949e', height:'35px', borderBottom:'1px solid #333' }}>
                <th style={{ width:'50px', textAlign:'center' }}>번호</th>
                <th style={{ width:'60px', textAlign:'center' }}>탭</th>
                <th style={{ textAlign:'left', paddingLeft:'10px' }}>제목</th>
                <th style={{ width:'100px', textAlign:'center' }}>글쓴이</th>
                <th style={{ width:'70px', textAlign:'center' }}>시간</th>
                <th style={{ width:'50px', textAlign:'center' }}>조회</th>
                <th style={{ width:'50px', textAlign:'center' }}>추천</th>
              </tr>
            </thead>
            <tbody>
              {currentPosts.map((post, idx) => (
                <tr key={post.id} onClick={() => openPost(post)} style={{ borderBottom:'1px solid #252528', cursor:'pointer', height:'36px', background: post.isBest ? 'rgba(232, 64, 87, 0.05)' : 'transparent' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = '#222'} onMouseLeave={e => e.currentTarget.style.backgroundColor = post.isBest ? 'rgba(232, 64, 87, 0.05)' : 'transparent'}>
                  <td style={{ textAlign:'center', color:'#555' }}>{filteredPosts.length - (startIndex + idx)}</td>
                  <td style={{ textAlign:'center', color: getCategoryColor(post.category) }}>{post.category}</td>
                  <td style={{ padding:'0 10px', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>
                    <span style={{ color: post.isBest ? '#fff' : '#ddd', fontWeight: post.isBest ? 'bold' : 'normal' }}>{post.title}</span>
                    {post.comments > 0 && <span style={{ color:'#58a6ff', fontSize:'11px', marginLeft:'6px', fontWeight:'bold' }}>[{post.comments}]</span>}
                  </td>
                  <td style={{ textAlign:'center', color:'#888', overflow:'hidden', whiteSpace:'nowrap', textOverflow:'ellipsis' }}>{post.author}</td>
                  <td style={{ textAlign:'center', color:'#666' }}>{post.displayTime}</td>
                  <td style={{ textAlign:'center', color:'#666' }}>{post.views}</td>
                  <td style={{ textAlign:'center', color: post.upvotes > 0 ? '#e84057' : '#666' }}>{post.upvotes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {currentPosts.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'#555', fontSize:'13px' }}>게시글이 없습니다.</div>}
      </div>

      <div style={{ padding: '12px', borderTop: '1px solid #333', display: 'flex', justifyContent: 'center', gap: '10px', background: '#161b22', flexShrink: 0 }}>
        <button disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="btn" style={{ background:'#333', color:'#fff', padding:'6px 12px', opacity: page===1?0.5:1, fontSize:'12px' }}>이전</button>
        <span style={{ display:'flex', alignItems:'center', color:'#fff', padding:'0 10px', fontSize:'13px', fontFamily:'monospace' }}>{page} / {totalPages || 1}</span>
        <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="btn" style={{ background:'#333', color:'#fff', padding:'6px 12px', opacity: page>=totalPages?0.5:1, fontSize:'12px' }}>다음</button>
      </div>
    </div>
  );
};