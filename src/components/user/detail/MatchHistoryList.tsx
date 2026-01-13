import React from 'react';
import { UserProfile } from '../../../types';
import { GameIcon } from '../../common/GameIcon';
import { Trophy, Skull, Crosshair } from 'lucide-react';

interface Props { user: UserProfile; heroes: any[]; }

export const MatchHistoryList: React.FC<Props> = ({ user, heroes }) => {
  const champStats = Object.entries(user.heroStats || {})
    .map(([id, stat]) => ({ id, hero: heroes.find(h => h.id === id), stat }))
    .sort((a, b) => b.stat.matches - a.stat.matches)
    .slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 모스트 챔피언 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
        {champStats.map((item, idx) => {
          const wr = item.stat.matches > 0 ? (item.stat.wins / item.stat.matches) * 100 : 0;
          return (
            <div key={idx} style={{ background: '#1c1c1f', borderRadius: '12px', padding: '12px', border: '1px solid #30363d', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
              <div style={{ position:'relative' }}>
                <GameIcon id={item.id} size={48} shape="rounded" />
                <div style={{ position:'absolute', bottom:-5, right:-5, background:'#0d1117', border:'1px solid #333', borderRadius:'50%', width:'20px', height:'20px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'10px', fontWeight:'bold', color: idx===0?'#f1c40f':'#ccc' }}>
                  {idx+1}
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'12px', fontWeight:'bold', color:'#fff' }}>{item.hero?.name}</div>
                <div style={{ fontSize:'10px', color:'#888' }}>{item.stat.matches}전</div>
                <div style={{ fontSize:'12px', fontWeight:'900', color: wr >= 60 ? '#da3633' : wr >= 50 ? '#fff' : '#888' }}>{wr.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
        {champStats.length === 0 && <div style={{ gridColumn: '1/-1', textAlign:'center', padding:'20px', color:'#555', fontSize:'13px' }}>플레이 기록이 없습니다.</div>}
      </div>

      {/* 최근 전적 리스트 */}
      <div>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#ccc' }}>최근 전적 (Recent Matches)</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {user.history.map((match, idx) => {
            const isWin = match.result === 'WIN' || match.result === 'PROMO WIN';
            const bgColor = isWin ? 'rgba(46, 204, 113, 0.1)' : 'rgba(231, 76, 60, 0.1)';
            const barColor = isWin ? '#2ecc71' : '#e74c3c';
            
            return (
              <div key={idx} style={{ display: 'flex', background: bgColor, borderRadius: '6px', overflow: 'hidden', height: '56px' }}>
                <div style={{ width: '6px', background: barColor }} />
                <div style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  
                  {/* 왼쪽: 결과 & 영웅 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ display:'flex', flexDirection:'column' }}>
                      <span style={{ fontSize: '13px', fontWeight: '900', color: barColor }}>{isWin ? '승리' : '패배'}</span>
                      <span style={{ fontSize: '10px', color: '#aaa' }}>{match.date.split(' ')[1]}</span>
                    </div>
                    {/* 영웅 이름 (추후 아이콘으로 대체 가능) */}
                    <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#fff' }}>{match.heroName}</div>
                  </div>

                  {/* 오른쪽: KDA & LP */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#fff', fontFamily:'monospace' }}>{match.kda}</div>
                    <div style={{ fontSize: '11px', fontWeight: 'bold', color: match.lpChange > 0 ? '#f1c40f' : '#888' }}>
                      {match.lpChange > 0 ? `+${match.lpChange}` : match.lpChange} LP
                    </div>
                  </div>

                </div>
              </div>
            );
          })}
          {user.history.length === 0 && <div style={{ textAlign:'center', padding:'30px', color:'#555', fontSize:'12px' }}>기록이 없습니다.</div>}
        </div>
      </div>

    </div>
  );
};
