// ==========================================
// FILE PATH: /src/components/hero/CustomizeHeroModal.tsx
// ==========================================

import React, { useState, useRef } from 'react';
import { Hero } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { X, Save, Camera, Image as ImageIcon, Upload, Trash2 } from 'lucide-react';
import { GameIcon } from '../common/GameIcon';

interface Props {
  hero: Hero;
  onClose: () => void;
}

export const CustomizeHeroModal: React.FC<Props> = ({ hero, onClose }) => {
  const { updateHero, setCustomImage, removeCustomImage } = useGameStore();

  // 상태 관리: hero.concept가 있으면 그걸 쓰고, 없으면 기본 문구
  const [name, setName] = useState(hero.name);
  const [concept, setConcept] = useState(hero.concept || "새로운 영웅의 탄생");

  const profileRef = useRef<HTMLInputElement>(null);
  const bgRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    // [핵심 수정] concept 필드에 직접 저장하여 즉시 반영되도록 함
    updateHero(hero.id, { name, concept });
    alert('커스터마이징이 저장되었습니다!');
    onClose();
  };

  const handleUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') setCustomImage(id, reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center', padding:'20px' }}>
      <div style={{ width: '100%', maxWidth: '400px', background: '#161b22', borderRadius: '16px', border: '1px solid #30363d', overflow: 'hidden' }}>

        {/* 헤더 */}
        <div style={{ padding: '15px 20px', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background:'#21262d' }}>
          <h3 style={{ margin: 0, color: '#fff', fontSize:'16px' }}>영웅 커스터마이징</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#ccc', cursor:'pointer' }}><X size={20}/></button>
        </div>

        {/* 바디 */}
        <div style={{ padding: '20px', display:'flex', flexDirection:'column', gap:'20px' }}>

          {/* 1. 사진 변경 영역 */}
          <div style={{ display:'flex', gap:'15px' }}>
            {/* 프로필 사진 */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'5px' }}>
                <div 
                onClick={() => profileRef.current?.click()}
                style={{ aspectRatio:'1/1', background:'#0d1117', border:'1px dashed #555', borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#888' }}
                >
                <GameIcon id={hero.id} size={50} shape="rounded" />
                <div style={{ fontSize:'11px', marginTop:'8px', display:'flex', alignItems:'center', gap:'4px' }}><Camera size={12}/> 프로필</div>
                <input type="file" ref={profileRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUpload(hero.id, e)} />
                </div>
                <button onClick={() => removeCustomImage(hero.id)} style={{ fontSize:'10px', color:'#da3633', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'2px' }}>
                    <Trash2 size={10}/> 초기화
                </button>
            </div>

            {/* 배경 사진 */}
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'5px' }}>
                <div 
                onClick={() => bgRef.current?.click()}
                style={{ aspectRatio:'1/1', background:'#0d1117', border:'1px dashed #555', borderRadius:'12px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'#888' }}
                >
                <ImageIcon size={30} />
                <div style={{ fontSize:'11px', marginTop:'8px', display:'flex', alignItems:'center', gap:'4px' }}><Upload size={12}/> 배경</div>
                <input type="file" ref={bgRef} style={{ display: 'none' }} accept="image/*" onChange={(e) => handleUpload(`${hero.id}_bg`, e)} />
                </div>
                <button onClick={() => removeCustomImage(`${hero.id}_bg`)} style={{ fontSize:'10px', color:'#da3633', background:'none', border:'none', cursor:'pointer', display:'flex', justifyContent:'center', alignItems:'center', gap:'2px' }}>
                    <Trash2 size={10}/> 초기화
                </button>
            </div>
          </div>

          {/* 2. 텍스트 변경 영역 */}
          <div>
            <label style={{ fontSize:'12px', color:'#8b949e', marginBottom:'5px', display:'block' }}>영웅 이름</label>
            <input 
              type="text" value={name} onChange={(e) => setName(e.target.value)}
              style={{ width:'100%', padding:'12px', background:'#0d1117', border:'1px solid #30363d', color:'#fff', borderRadius:'8px', fontSize:'14px', fontWeight:'bold', boxSizing:'border-box' }}
            />
          </div>

          <div>
            <label style={{ fontSize:'12px', color:'#8b949e', marginBottom:'5px', display:'block' }}>컨셉 문구 (대사)</label>
            <input 
              type="text" value={concept} onChange={(e) => setConcept(e.target.value)}
              style={{ width:'100%', padding:'12px', background:'#0d1117', border:'1px solid #30363d', color:'#fff', borderRadius:'8px', fontSize:'13px', fontStyle:'italic', boxSizing:'border-box' }}
            />
          </div>

        </div>

        {/* 푸터 */}
        <div style={{ padding: '15px', borderTop: '1px solid #333', background:'#21262d' }}>
          <button onClick={handleSave} style={{ width:'100%', padding:'12px', background:'#238636', color:'#fff', border:'none', borderRadius:'8px', fontWeight:'bold', cursor:'pointer', display:'flex', justifyContent:'center', gap:'8px' }}>
            <Save size={16}/> 저장하기
          </button>
        </div>

      </div>
    </div>
  );
};