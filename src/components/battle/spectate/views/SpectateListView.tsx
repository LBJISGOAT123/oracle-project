import React from 'react';
import { BanCard, PlayerCard, ObjectStatBox, NeutralObjPanel } from '../SpectateUI';
import { ChevronLeft, Terminal } from 'lucide-react';
import { GlobalLogPanel } from '../GlobalLogPanel';
import { UserDetailView } from '../UserDetailView';
import { PersonalLogView } from '../PersonalLogView';
import { LiveMatch, Hero } from '../../../../../types';

interface Props {
  match: LiveMatch;
  heroes: Hero[];
  isMobile: boolean;
  mobileTab: 'LIST' | 'MAP';
  selectedHeroId: string | null;
  onSelectHero: (id: string | null) => void;
  gameSpeed: number;
  formatTime: (s: number) => string;
  getHeroName: (id: string) => string;
}

export const SpectateListView: React.FC<Props> = ({
  match, heroes, isMobile, mobileTab, selectedHeroId, onSelectHero, gameSpeed, formatTime, getHeroName
}) => {
  const [viewingItem, setViewingItem] = React.useState<any>(null);
  const selectedPlayer = selectedHeroId ? [...match.blueTeam, ...match.redTeam].find(p => p.heroId === selectedHeroId) : null;

  return (
    <div style={{ 
      background: '#121212', 
      display: (isMobile && mobileTab !== 'LIST') ? 'none' : 'block',
      paddingBottom: '50px',
      width: '100%',
      overflowX: 'hidden'
    }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', borderBottom: '1px solid #222', background:'#1a1a1a' }}>
           <div style={{ display: 'flex', gap: '4px' }}>{(match.bans.blue || []).map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} />)}</div>
           <div style={{ display: 'flex', gap: '4px' }}>{(match.bans.red || []).map((id:string, i:number) => <BanCard key={i} heroId={id} heroes={heroes} />)}</div>
        </div>

        <div style={{ padding: '8px', display:'flex', gap:'6px', alignItems:'flex-start' }}>
           <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px', minWidth:0 }}>
             <div style={{ fontSize:'11px', fontWeight:'bold', color:'#58a6ff', textAlign:'center', marginBottom:'2px' }}>BLUE TEAM</div>
             {match.blueTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => onSelectHero(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#58a6ff" />)}
           </div>

           <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'4px', minWidth:0 }}>
             <div style={{ fontSize:'11px', fontWeight:'bold', color:'#e84057', textAlign:'center', marginBottom:'2px' }}>RED TEAM</div>
             {match.redTeam.map((p:any, i:number) => <PlayerCard key={i} p={p} isSelected={selectedHeroId === p.heroId} onClick={() => onSelectHero(p.heroId)} heroName={getHeroName(p.heroId)} teamColor="#e84057" />)}
           </div>
        </div>

        <div style={{ padding:'0 8px 20px 8px' }}>
            <div style={{ padding:'8px 0', display:'flex', gap:'6px' }}>
               <ObjectStatBox stats={match.stats.blue} color="#58a6ff" side="BLUE" godName="단테" />
               <ObjectStatBox stats={match.stats.red} color="#e84057" side="RED" godName="이즈마한" />
            </div>
            <NeutralObjPanel colossus={match.objectives?.colossus} watcher={match.objectives?.watcher} />
            
            <div style={{ height:'300px', border:'1px solid #333', marginTop:'10px', borderRadius:'8px', overflow:'hidden', display:'flex', flexDirection:'column' }}>
                {selectedPlayer ? (
                    <div style={{ height:'100%', overflowY:'auto' }}>
                        <div onClick={() => { onSelectHero(null); setViewingItem(null); }} style={{ padding:'8px', background:'#222', textAlign:'center', cursor:'pointer', fontSize:'12px', color:'#ccc', borderBottom:'1px solid #333' }}><ChevronLeft size={12}/> 목록으로 돌아가기</div>
                        <UserDetailView player={selectedPlayer} heroName={getHeroName(selectedPlayer.heroId)} viewingItem={viewingItem} setViewingItem={setViewingItem} />
                        <PersonalLogView logs={match.logs} heroName={getHeroName(selectedPlayer.heroId)} summonerName={selectedPlayer.name} formatTime={formatTime} />
                    </div>
                ) : (
                    <>
                       <div style={{ padding:'8px', background:'#161b22', fontSize:'11px', color:'#888', display:'flex', gap:'6px', borderBottom:'1px solid #222' }}><Terminal size={12}/> 실시간 로그</div>
                       <GlobalLogPanel logs={match.logs} gameSpeed={gameSpeed} formatTime={formatTime} />
                    </>
                )}
            </div>
        </div>
    </div>
  );
};
