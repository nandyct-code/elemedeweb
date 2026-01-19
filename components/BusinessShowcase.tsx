
import React from 'react';
import { Business, SubscriptionPackType, UserAccount } from '../types';
import { SUBSCRIPTION_PACKS } from '../constants';

interface BusinessShowcaseProps {
  businesses: Business[];
  userLocation: { lat: number; lng: number } | null;
  currentRadius: number;
  onViewBusiness?: (id: string) => void;
  currentUser?: UserAccount | null;
  onToggleFavorite?: (id: string) => void;
}

export const BusinessShowcase: React.FC<BusinessShowcaseProps> = ({ 
  businesses, userLocation, currentRadius, onViewBusiness, currentUser, onToggleFavorite 
}) => {
  const getPackDetails = (packId: SubscriptionPackType) => {
    return SUBSCRIPTION_PACKS.find(p => p.id === packId) || SUBSCRIPTION_PACKS[4];
  };

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  const getTierColor = (packId: SubscriptionPackType) => {
    switch (packId) {
      case 'super_top': return 'bg-gradient-to-br from-orange-600 via-red-500 to-yellow-500 text-white border-orange-500 shadow-orange-200';
      case 'premium': return 'bg-gradient-to-br from-yellow-400 via-yellow-200 to-yellow-600 text-yellow-950 border-yellow-300 shadow-yellow-100';
      case 'medium': return 'bg-gradient-to-br from-slate-300 via-white to-slate-400 text-slate-800 border-slate-200 shadow-slate-100';
      case 'basic': return 'bg-gradient-to-br from-orange-800 via-orange-400 to-orange-900 text-white border-orange-700 shadow-orange-100';
      default: return 'bg-white text-gray-500 border-gray-100';
    }
  };

  const handleShare = async (e: React.MouseEvent, biz: Business) => {
    e.stopPropagation();
    const shareUrl = window.location.href;
    const shareData = {
      title: biz.name,
      text: `¡Mira esta delicia en ELEMEDE! ${biz.name}`,
      url: shareUrl
    };

    if (navigator.share && (shareUrl.startsWith('http') || shareUrl.startsWith('https'))) {
      try { await navigator.share(shareData); } catch (err) { console.error('Error sharing:', err); }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
        alert("Enlace copiado al portapapeles");
      } catch (err) { console.error('Clipboard failed', err); }
    }
  };

  if (businesses.length === 0) {
    return (
      <div className="text-center py-20 px-4 bg-white rounded-[3rem] border-4 border-dashed border-orange-100 animate-fade-in">
        <div className="text-6xl mb-6">🏜️</div>
        <p className="text-xl font-brand font-extrabold text-gray-400">sin profesionales en tu radio de visibilidad ({currentRadius/1000}km)</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between px-2">
        <h3 className="text-3xl font-brand font-extrabold text-gray-900 flex items-center gap-3">
          🧁 Selección Cercana
        </h3>
        <div className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest">Radio Dinámico: {currentRadius/1000}km</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {businesses.map((biz) => {
          const pack = getPackDetails(biz.packId);
          
          // FIND NEAREST LOCATION DISTANCE (HQ or Sede)
          let distance: number | null = null;
          if (userLocation) {
              const hqDist = calculateDistance(userLocation.lat, userLocation.lng, biz.lat, biz.lng);
              let minDist = hqDist;
              
              if (biz.direccionesAdicionales) {
                  biz.direccionesAdicionales.forEach(sede => {
                      if (sede.lat && sede.lng) {
                          const sedeDist = calculateDistance(userLocation.lat, userLocation.lng, sede.lat, sede.lng);
                          if (sedeDist < minDist) minDist = sedeDist;
                      }
                  });
              }
              distance = minDist;
          }

          const isSuperTop = biz.packId === 'super_top';
          const isUser = currentUser?.role === 'user';
          const isFavorite = currentUser?.favorites?.includes(biz.id);
          
          const now = new Date();
          const createdDate = new Date(biz.createdAt);
          const diffDays = Math.floor(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          const isNew = diffDays <= 7;

          return (
            <div 
              key={biz.id} 
              className={`group relative overflow-hidden rounded-[2.5rem] border-4 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl ${getTierColor(biz.packId)} p-1`}
            >
              <div className="bg-white rounded-[2.2rem] p-8 h-full flex flex-col justify-between relative overflow-hidden">
                {isSuperTop && (
                  <div className="absolute -top-4 -right-4 w-24 h-24 bg-orange-500 opacity-5 blur-2xl group-hover:opacity-20 transition-opacity"></div>
                )}
                
                {isUser && (
                  <div className="absolute top-6 right-6 flex gap-2 z-20">
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
                  <div className="flex justify-between items-start mb-4 pr-16">
                    <h4 className="text-2xl font-brand font-black text-gray-900 leading-tight group-hover:text-orange-600 transition-colors">
                      {biz.name}
                    </h4>
                    <div className="absolute top-6 left-6 md:relative md:top-auto md:left-auto flex gap-2">
                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border-2 shadow-sm ${getTierColor(biz.packId)}`}>
                        {isSuperTop ? '🔥 FUEGO' : pack.label.replace('Pack ', '')}
                        </div>
                        {isNew && (
                            <div className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500 text-white shadow-lg animate-pulse border-2 border-white">
                                NUEVO
                            </div>
                        )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-sm shadow-inner">
                      📍
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-bold leading-none">{biz.address}</p>
                      {distance !== null && (
                        <p className="text-[11px] text-orange-600 font-black mt-1 uppercase tracking-tighter">
                          A {distance >= 1000 ? (distance/1000).toFixed(1) + 'km' : distance + 'm'} de ti
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-gray-50 flex items-center justify-between">
                  <button 
                    onClick={() => onViewBusiness?.(biz.id)}
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all active:scale-95 shadow-lg group-hover:shadow-orange-200"
                  >
                    Saber Más
                  </button>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-transform duration-500 group-hover:rotate-12 ${getTierColor(biz.packId)} shadow-md`}>
                    <span className="text-xl">{isSuperTop ? '🔥' : '✨'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
