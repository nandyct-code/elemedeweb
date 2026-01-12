import React, { useMemo } from 'react';
import { Business, SectorKey, SubscriptionPackType, UserAccount } from '../types';

interface TopBusinessesProps {
  businesses: Business[];
  title?: string;
  sectorId?: SectorKey;
  isNational?: boolean;
  userProvince?: string;
  onViewBusiness?: (id: string) => void;
  currentUser?: UserAccount | null;
  onToggleFavorite?: (id: string) => void;
}

// Semilla de rotación de 5 días
const get5DaySeed = () => {
  return Math.floor(Date.now() / (1000 * 60 * 60 * 24 * 5));
};

const seededShuffle = (array: any[], seed: number) => {
  let m = array.length, t, i;
  while (m) {
    i = Math.floor(Math.abs(Math.sin(seed++) * m--));
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
};

export const TopBusinesses: React.FC<TopBusinessesProps> = ({ 
  businesses, title, sectorId, isNational, userProvince, onViewBusiness, currentUser, onToggleFavorite 
}) => {
  const rotationSeed = get5DaySeed();

  const rankedBusinesses = useMemo(() => {
    const elitePacks: SubscriptionPackType[] = ['medium', 'premium', 'super_top'];
    let pool = businesses.filter(biz => elitePacks.includes(biz.packId));

    if (userProvince && userProvince !== 'NACIONAL' && !isNational) {
      const localPool = pool.filter(biz => biz.province.toLowerCase() === userProvince.toLowerCase());
      if (localPool.length >= 3) {
        pool = localPool;
      }
    }

    if (sectorId) {
      pool = pool.filter(biz => biz.sectorId === sectorId);
    }

    const superTop = pool.filter(b => b.packId === 'super_top');
    const premium = pool.filter(b => b.packId === 'premium');
    const medium = pool.filter(b => b.packId === 'medium');

    const sortedSuper = seededShuffle([...superTop], rotationSeed);
    const sortedPremium = seededShuffle([...premium], rotationSeed + 1);
    const sortedMedium = seededShuffle([...medium], rotationSeed + 2);

    return [...sortedSuper, ...sortedPremium, ...sortedMedium].slice(0, 30);
  }, [businesses, rotationSeed, sectorId, isNational, userProvince]);

  const handleShare = async (e: React.MouseEvent, biz: Business) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    const shareData = {
      title: biz.name,
      text: `¡Mira esta delicia en ELEMEDE! ${biz.name}`,
      url: shareUrl
    };

    // Verify valid protocol for share API
    if (navigator.share && (shareUrl.startsWith('http') || shareUrl.startsWith('https'))) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Enlace copiado al portapapeles");
      } catch (err) {
        console.error('Clipboard failed', err);
        alert("No se pudo compartir automáticamente.");
      }
    }
  };

  if (rankedBusinesses.length === 0) return null;

  const provinceLabel = userProvince && userProvince !== 'NACIONAL' ? userProvince.toUpperCase() : "NACIONAL";
  const defaultTitle = isNational 
    ? `HALL OF FAME: ${provinceLabel}` 
    : `TOP 30 ${provinceLabel}: ${title?.toUpperCase()}`;

  // Ahora el modo scroll se aplica siempre para garantizar la experiencia lateral independiente solicitada.
  const isScrollMode = true;

  return (
    <div className="w-full space-y-8 animate-fade-in py-12 overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div className="flex items-center gap-6">
          <div className={`${isNational ? 'bg-gray-950 shadow-gray-200' : 'bg-orange-600 shadow-orange-100'} text-white px-10 py-4 rounded-full font-brand font-black text-sm md:text-lg tracking-[0.25em] flex items-center gap-4 shadow-2xl border-b-4 border-black/20 transform hover:-rotate-1 transition-transform`}>
            {isNational ? <span className="text-2xl">🏆</span> : <span className="animate-pulse">✨</span>} 
            {defaultTitle}
          </div>
        </div>
      </div>

      <div className={`flex overflow-x-auto gap-8 pb-12 scrollbar-hide px-4 snap-x snap-mandatory cursor-grab active:cursor-grabbing`}>
        {rankedBusinesses.map((biz, idx) => {
          const isUser = currentUser?.role === 'user';
          const isFavorite = currentUser?.favorites?.includes(biz.id);
          
          return (
            <div 
              key={biz.id} 
              onClick={() => onViewBusiness?.(biz.id)}
              className={`flex-shrink-0 w-80 p-1.5 rounded-[3.5rem] shadow-2xl transition-all duration-500 hover:scale-105 cursor-pointer snap-center ${
                biz.packId === 'super_top' 
                  ? 'bg-gradient-to-tr from-orange-600 via-red-500 to-yellow-500 animate-pulse-slow' 
                  : biz.packId === 'premium'
                  ? 'bg-gradient-to-tr from-yellow-600 via-yellow-200 to-yellow-600'
                  : 'bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-500'
              }`}
            >
              <div className="bg-white rounded-[3.2rem] p-10 h-full flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-gray-100/50 rounded-full blur-3xl group-hover:scale-150 transition-transform"></div>
                
                 {/* Botones Flotantes para Usuario */}
                {isUser && (
                  <div className="absolute top-8 right-8 flex gap-2 z-20">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(biz.id); }}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm border border-gray-100 hover:scale-110 transition-transform"
                    >
                      {isFavorite ? '❤️' : '🤍'}
                    </button>
                    <button 
                      onClick={(e) => handleShare(e, biz)}
                      className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center text-sm border border-gray-100 hover:scale-110 transition-transform"
                    >
                      🔗
                    </button>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex flex-col">
                      <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border uppercase tracking-widest inline-block w-fit ${
                        biz.packId === 'super_top' ? 'text-orange-600 bg-orange-50 border-orange-100' : 
                        biz.packId === 'premium' ? 'text-yellow-700 bg-yellow-50 border-yellow-100' : 
                        'text-slate-600 bg-slate-50 border-slate-100'
                      }`}>
                        RANKING #{idx + 1}
                      </span>
                    </div>
                    <span className="text-2xl drop-shadow-md">
                      {biz.packId === 'super_top' ? '🔥' : biz.packId === 'premium' ? '👑' : '⭐'}
                    </span>
                  </div>
                  
                  <h4 className="font-brand font-black text-gray-900 leading-tight text-2xl mb-3 group-hover:text-orange-600 transition-colors pr-8">
                    {biz.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 opacity-80">
                    <span className="text-lg">📍</span>
                    <p className="text-xs text-gray-500 font-bold truncate uppercase tracking-tight">{biz.address}, {biz.city}</p>
                  </div>
                </div>
                
                <div className="mt-10 flex items-center justify-between">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full border-4 border-white bg-gray-900 flex items-center justify-center text-[11px] text-white font-black shadow-sm">E</div>
                    <div className="w-10 h-10 rounded-full border-4 border-white bg-orange-600 flex items-center justify-center text-[11px] text-white font-black shadow-sm">L</div>
                  </div>
                  <div className="w-14 h-14 rounded-[1.5rem] bg-gray-950 text-white flex items-center justify-center hover:bg-orange-600 transition-all shadow-xl active:scale-90 group-hover:rotate-12 border-4 border-white">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="flex justify-center mt-4">
         <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest animate-pulse">Desliza lateralmente para explorar el {isNational ? 'Hall of Fame' : 'Ranking'}</p>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; scrollbar-height: none; }
        @keyframes pulse-slow {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .animate-pulse-slow { animation: pulse-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};