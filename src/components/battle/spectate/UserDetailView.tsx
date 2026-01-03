// ==========================================
// FILE PATH: /src/components/battle/spectate/UserDetailView.tsx
// ==========================================
import React from 'react';
import { X } from 'lucide-react';
import { GameIcon } from '../../common/GameIcon';

export const UserDetailView = ({ player, heroName, viewingItem, setViewingItem }: any) => {
  const hpPercent = (player.currentHp / player.maxHp) * 100;
  const mpPercent = (player.currentMp / player.maxMp) * 100 || 0;

  const items = Array.isArray(player.items) ? player.items : [];

  const StatBadge = ({ color, label, val }: any) => (
    <span style={{fontSize:'10px', color: color, background: `${color}11`, padding:'2px 4px', borderRadius:'3px', border:`1px solid ${color}33`}}>
      {label} +{val}
    </span>
  );

  return (
    <div style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'15px', width:'100%', maxWidth:'450px', marginBottom:'20px' }}>
        <GameIcon id={player.heroId} size={54} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:'bold', fontSize:'18px', color:'#fff' }}>{heroName}</div>
          <div style={{ color:'#8b949e', fontSize:'12px' }}>{player.name} (Lv.{player.level})</div>
        </div>
        <div style={{ textAlign:'right', minWidth:'120px' }}>

          <div style={{ fontSize:'10px', color:'#2ecc71', fontWeight:'900', marginBottom:'4px' }}>
            HP {Math.ceil(player.currentHp)}/{player.maxHp}
          </div>
          <div style={{ width:'100%', height:'6px', background:'#1a1a1c', borderRadius:'3px', overflow:'hidden', border:'1px solid #333' }}>
            <div style={{ width:`${hpPercent}%`, height:'100%', background: hpPercent < 30 ? '#da3633' : '#2ecc71' }} />
          </div>

          <div style={{ fontSize:'10px', color:'#3498db', fontWeight:'900', marginBottom:'4px', marginTop:'6px' }}>
            MP {Math.ceil(player.currentMp)}/{player.maxMp}
          </div>
          <div style={{ width:'100%', height:'6px', background:'#1a1a1c', borderRadius:'3px', overflow:'hidden', border:'1px solid #333' }}>
            <div style={{ width:`${mpPercent}%`, height:'100%', background: '#3498db' }} />
          </div>

          <div style={{ color:'#f1c40f', fontWeight:'bold', fontSize:'12px', marginTop:'6px' }}>💰 {Math.floor(player.gold).toLocaleString()} G</div>
        </div>
      </div>

      {viewingItem && (
        <div style={{ width:'100%', maxWidth:'450px', background:'#161b22', border:'1px solid #30363d', borderRadius:'8px', padding:'12px', marginBottom:'15px', position:'relative' }}>
          <button onClick={() => setViewingItem(null)} style={{ position:'absolute', right:'8px', top:'8px', background:'none', border:'none', color:'#666', cursor:'pointer' }}><X size={14}/></button>
          <div style={{ display:'flex', gap:'12px', alignItems:'center', marginBottom:'10px' }}>
            <GameIcon id={viewingItem.id} size={36} shape="square" />
            <div>
              <div style={{ fontWeight:'bold', color:'#fff', fontSize:'14px' }}>{viewingItem.name}</div>
              <div style={{ color:'#f1c40f', fontSize:'11px', fontWeight:'bold' }}>{viewingItem.cost} Gold</div>
            </div>
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'10px' }}>
             {viewingItem.ad > 0 && <StatBadge color="#ff6b6b" label="AD" val={viewingItem.ad} />}
             {viewingItem.ap > 0 && <StatBadge color="#a371f7" label="AP" val={viewingItem.ap} />}
             {viewingItem.hp > 0 && <StatBadge color="#7ee787" label="HP" val={viewingItem.hp} />}
             {viewingItem.armor > 0 && <StatBadge color="#58a6ff" label="DEF" val={viewingItem.armor} />}
             {viewingItem.crit > 0 && <StatBadge color="#e89d40" label="CRI" val={viewingItem.crit + '%'} />}
             {viewingItem.speed > 0 && <StatBadge color="#fff" label="SPD" val={viewingItem.speed} />}
          </div>
          <div style={{ fontSize:'11px', color:'#ccc' }}>{viewingItem.description || "설명이 없습니다."}</div>
        </div>
      )}

      <div style={{ display:'flex', gap:'6px', justifyContent:'center', marginBottom:'20px' }}>
        {([0,1,2,3,4,5]).map(i => (
          <div key={i} onClick={() => items[i] && setViewingItem(items[i])} style={{ width:'42px', height:'42px', background:'#0d1117', border:'1px solid #333', borderRadius:'4px', cursor:'pointer', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {items[i] ? <GameIcon id={items[i].id} size={40} shape="square" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
};