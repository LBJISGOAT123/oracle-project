// ==========================================
// FILE PATH: /src/components/community/PostDetailModal.tsx
// ==========================================

import React, { useState, useEffect } from 'react';
import { Post, UserProfile } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { findUserProfileByName } from '../../engine/UserManager';
import { X, MessageSquare, ThumbsUp, ThumbsDown, User, Clock, Eye } from 'lucide-react';

interface Props {
  post: Post;
  onClose: () => void;
  onUserClick: (user: UserProfile) => void;
}

// [신규] 티어별 색상 반환 함수
const getTierColor = (tier: string) => {
  if (tier.includes('천상계') || tier.includes('챌린저')) return '#00bfff'; // 하늘색
  if (tier.includes('마스터')) return '#9b59b6'; // 보라색
  if (tier.includes('에이스')) return '#e74c3c'; // 빨간색
  if (tier.includes('조커')) return '#2ecc71';   // 초록색
  if (tier.includes('골드')) return '#f1c40f';   // 금색
  if (tier.includes('실버')) return '#95a5a6';   // 은색
  if (tier.includes('브론즈')) return '#d35400'; // 동색
  return '#7f8c8d'; // 아이언/기타 (회색)
};

export const PostDetailModal: React.FC<Props> = ({ post, onClose, onUserClick }) => {
  const { gameState } = useGameStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleAuthorClick = () => {
    const userProfile = findUserProfileByName(post.author, gameState.tierConfig);
    if (userProfile) {
      onUserClick(userProfile);
    } else {
      alert("해당 유저 정보를 찾을 수 없습니다.");
    }
  };

  const overlayStyle: React.CSSProperties = isMobile ? {
    position: 'fixed', inset: 0, zIndex: 20000, 
    backgroundColor: '#0f1115',
    overflowY: 'auto', WebkitOverflowScrolling: 'touch',
    display: 'block'
  } : {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', 
    zIndex: 20000, backdropFilter: 'blur(3px)'
  };

  const panelStyle: React.CSSProperties = isMobile ? {
    width: '100%', minHeight: '100%', 
    background: '#1c1c1f', display: 'flex', flexDirection: 'column',
    boxSizing: 'border-box'
  } : {
    width: '100%', maxWidth: '700px', height:'85vh', 
    background: '#1c1c1f', border: '1px solid #30363d', 
    display:'flex', flexDirection:'column', borderRadius: '12px', overflow: 'hidden',
    boxShadow: '0 50px 100px -20px rgba(0,0,0,0.7)'
  };

  return (
    <div style={overlayStyle}>
      <div style={panelStyle}>

        {/* 헤더 */}
        <div style={{ 
          padding: '15px 20px', borderBottom: '1px solid #30363d', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
          background: '#252528',
          position: isMobile ? 'sticky' : 'relative', top: 0, zIndex: 50
        }}>
          <div style={{ flex: 1, paddingRight: '10px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#58a6ff', border:'1px solid #58a6ff', padding:'1px 4px', borderRadius:'3px' }}>
                {post.category}
              </span>
              {post.isBest && <span style={{ fontSize: '11px', background: '#e84057', color: '#fff', padding:'1px 4px', borderRadius:'3px' }}>념글</span>}
            </div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff', lineHeight:'1.4', wordBreak:'keep-all' }}>{post.title}</h2>

            <div style={{ marginTop: '10px', fontSize: '12px', color: '#8b949e', display:'flex', flexWrap:'wrap', alignItems:'center', gap:'10px' }}>
              <div 
                onClick={handleAuthorClick}
                style={{ 
                  display:'flex', alignItems:'center', gap:'4px', cursor:'pointer', 
                  color: '#ccc', fontWeight:'bold', 
                  background: '#30363d', padding: '4px 8px', borderRadius: '4px',
                  border: '1px solid #444'
                }}
              >
                <User size={12} />
                {post.author} 
                {/* 작성자 티어 색상 적용 */}
                <span style={{color: getTierColor(post.authorTier), fontWeight:'bold', fontSize:'11px'}}>
                  ({post.authorTier})
                </span>
              </div>

              <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Clock size={12}/> {post.displayTime}</span>
              <span style={{ display:'flex', alignItems:'center', gap:'4px' }}><Eye size={12}/> {post.views}</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding:'5px' }}>
            <X size={24} />
          </button>
        </div>

        {/* 본문 */}
        <div style={{ 
          padding: '25px 20px', 
          color: '#e6edf3', fontSize: '15px', lineHeight: '1.7', 
          flex: 1, 
          overflowY: isMobile ? 'visible' : 'auto', 
          whiteSpace: 'pre-wrap',
          minHeight: '200px'
        }}>
          {post.content}

          <div style={{ marginTop:'50px', display:'flex', justifyContent:'center', gap:'15px' }}>
            <button style={{ 
              background:'#21262d', border:'1px solid #30363d', color:'#fff', 
              padding:'10px 20px', borderRadius:'30px', 
              display:'flex', alignItems:'center', gap:'8px', cursor:'pointer',
              fontSize:'14px', fontWeight:'bold'
            }}>
              <ThumbsUp size={18} color="#e89d40" /> 
              <span>{post.upvotes}</span>
            </button>

            <button style={{ 
              background:'#21262d', border:'1px solid #30363d', color:'#8b949e', 
              padding:'10px 20px', borderRadius:'30px', 
              display:'flex', alignItems:'center', gap:'8px', cursor:'pointer',
              fontSize:'14px', fontWeight:'bold'
            }}>
              <ThumbsDown size={18} /> 
              <span>{post.downvotes || 0}</span>
            </button>
          </div>
        </div>

        {/* 댓글창 */}
        <div style={{ background: '#161b22', borderTop: '1px solid #30363d', flexShrink: 0 }}>
          <div style={{ padding: '15px 20px', display:'flex', alignItems:'center', gap:'6px', color:'#fff', borderBottom:'1px solid #30363d', background:'#252528' }}>
            <MessageSquare size={16} /> 댓글 <span style={{color:'#58a6ff', fontWeight:'bold'}}>{post.commentList?.length || 0}</span>
          </div>

          <div style={{ 
            maxHeight: isMobile ? 'none' : '300px', 
            overflowY: isMobile ? 'visible' : 'auto',
            paddingBottom: isMobile ? '50px' : '0' 
          }}>
            <div style={{ display:'flex', flexDirection:'column' }}>
              {post.commentList && post.commentList.map((comment) => (
                <div key={comment.id} style={{ padding: '15px 20px', borderBottom: '1px solid #2c2c2f' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                    <span style={{ fontWeight:'bold', fontSize:'13px', color:'#ccc', display:'flex', alignItems:'center', gap:'6px' }}>
                      {comment.author} 
                      {/* 댓글 작성자 티어 색상 적용 */}
                      <span style={{
                        fontSize:'10px', 
                        color: getTierColor(comment.authorTier), 
                        background:'#0d1117', 
                        padding:'1px 4px', 
                        borderRadius:'3px', 
                        border:'1px solid #333',
                        fontWeight:'bold'
                      }}>
                        {comment.authorTier}
                      </span>
                    </span>
                    <span style={{ fontSize:'11px', color:'#555' }}>{comment.timestamp}</span>
                  </div>
                  <div style={{ fontSize:'13px', color:'#aaa', lineHeight:'1.4' }}>{comment.content}</div>
                </div>
              ))}

              {(!post.commentList || post.commentList.length === 0) && (
                <div style={{ color:'#555', fontSize:'13px', textAlign:'center', padding:'40px 20px' }}>
                  아직 작성된 댓글이 없습니다.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};