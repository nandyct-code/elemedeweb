
import React, { useState, useEffect, useMemo } from 'react';
import { Business } from '../types';
import { Swords, Trophy, Sparkles } from 'lucide-react';

interface SweetBattleProps {
  businesses: Business[];
  onVote?: (winnerId: string) => void;
}

export const SweetBattle: React.FC<SweetBattleProps> = ({ businesses, onVote }) => {
  const [contenders, setContenders] = useState<Business[]>([]);
  const [hasVoted, setHasVoted] = useState(false);
  const [winnerId, setWinnerId] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({});

  // Seeded Random Generator for Daily Stability
  const getDailySeed = () => {
    const today = new Date();
    // Unique seed per day: YYYYMMDD
    return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  };

  const seededRandom = (seed: number) => {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
  };

  // Initialize Battle
  useEffect(() => {
    // Need at least 2 businesses
    if (businesses.length < 2) return;

    const seed = getDailySeed();
    const shuffled = [...businesses].sort((a, b) => {
        // Deterministic sort based on ID and seed
        return (a.id.charCodeAt(0) + seed) - (b.id.charCodeAt(0) + seed);
    });
    
    // Pick 2 pseudo-random contenders using the seed
    const idx1 = Math.floor(seededRandom(seed) * shuffled.length);
    let idx2 = Math.floor(seededRandom(seed + 1) * shuffled.length);
    if (idx1 === idx2) idx2 = (idx2 + 1) % shuffled.length;

    const c1 = shuffled[idx1];
    const c2 = shuffled[idx2];

    setContenders([c1, c2]);
    
    // Check local storage for vote status today
    const votedToday = localStorage.getItem(`elemede_voted_battle_${seed}`);
    if (votedToday) {
        setHasVoted(true);
        setWinnerId(votedToday);
    } else {
        setHasVoted(false);
        setWinnerId(null);
    }

    // Deterministic initial votes based on ID length + seed (mocking reality)
    setVotes({
        [c1.id]: Math.floor(seededRandom(seed + 2) * 50) + 20,
        [c2.id]: Math.floor(seededRandom(seed + 3) * 50) + 20
    });
  }, [businesses.length]); 

  const handleVote = (selectedId: string) => {
    if (hasVoted) return;
    
    setVotes(prev => ({
        ...prev,
        [selectedId]: (prev[selectedId] as number) + 1
    }));
    
    setWinnerId(selectedId);
    setHasVoted(true);
    
    // Persist vote for today
    const seed = getDailySeed();
    localStorage.setItem(`elemede_voted_battle_${seed}`, selectedId);
    
    if (onVote) onVote(selectedId);
  };

  if (contenders.length !== 2) return null;

  const totalVotes = (Object.values(votes) as number[]).reduce((a: number, b: number) => a + b, 0);

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 animate-fade-in">
        <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-indigo-950 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border-4 border-indigo-500/30">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent animate-spin-slow"></div>
            </div>

            <div className="relative z-10 text-center mb-10">
                <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 mb-4">
                    <Swords className="text-yellow-400 animate-pulse" size={20} />
                    <span className="text-white font-black uppercase tracking-[0.2em] text-xs">Batalla Dulce del Día</span>
                </div>
                <h3 className="text-3xl md:text-5xl font-brand font-black text-white italic tracking-tighter">
                    ¿Cuál te apetece más?
                </h3>
                <p className="text-indigo-200 text-sm font-medium mt-2">Vota y ayuda a tu favorito a ganar visibilidad gratuita.</p>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 relative">
                
                {/* VS Badge */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                    <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center font-black text-2xl text-indigo-900 shadow-[0_0_30px_rgba(250,204,21,0.6)] border-4 border-indigo-900 rotate-12">
                        VS
                    </div>
                </div>

                {contenders.map((biz, idx) => {
                    const isWinner = winnerId === biz.id;
                    const currentVotes = votes[biz.id] || 0;
                    const percent = totalVotes > 0 ? Math.round((currentVotes / totalVotes) * 100) : 50;
                    const isLeft = idx === 0;

                    return (
                        <div 
                            key={biz.id} 
                            onClick={() => handleVote(biz.id)}
                            className={`relative w-full md:w-1/2 h-80 md:h-96 rounded-[2.5rem] overflow-hidden cursor-pointer group transition-all duration-500 ${hasVoted && !isWinner ? 'grayscale opacity-50 scale-95' : 'hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(255,255,255,0.2)]'} ${isWinner ? 'ring-4 ring-yellow-400 scale-105 shadow-[0_0_50px_rgba(234,179,8,0.5)]' : ''}`}
                        >
                            <img 
                                src={biz.mainImage} 
                                alt={biz.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            
                            <div className="absolute bottom-0 left-0 w-full p-8 text-center md:text-left">
                                <h4 className="text-white font-black text-2xl md:text-3xl uppercase tracking-tighter leading-none mb-2">{biz.name}</h4>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest">{biz.sectorId.replace('_', ' ')}</p>
                                
                                {hasVoted && (
                                    <div className="mt-4 animate-fade-in-up">
                                        <div className="flex justify-between text-white text-xs font-black uppercase mb-1">
                                            <span>{votes[biz.id]} Votos</span>
                                            <span>{percent}%</span>
                                        </div>
                                        <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full transition-all duration-1000 ${isWinner ? 'bg-yellow-400' : 'bg-white/50'}`} 
                                                style={{ width: `${percent}%` }}
                                            ></div>
                                        </div>
                                        {isWinner && (
                                            <div className="mt-2 inline-flex items-center gap-2 text-yellow-400 font-black text-xs uppercase animate-bounce">
                                                <Trophy size={14} /> ¡Has votado ganador!
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {!hasVoted && (
                                <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <button className="bg-white text-indigo-900 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
                                        Votar
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};
