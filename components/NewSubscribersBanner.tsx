import React from 'react';
import { Business } from '../types';

interface NewSubscribersBannerProps {
  businesses: Business[];
  sectorLabel: string;
  onViewBusiness?: (id: string) => void;
}

export const NewSubscribersBanner: React.FC<NewSubscribersBannerProps> = ({ businesses, sectorLabel, onViewBusiness }) => {
  // Lógica de visibilidad por Pack (Días de visibilidad como "Nuevo")
  const getVisibilityDays = (packId: string): number => {
    switch (packId) {
      case 'super_top': return 20; // FUEGO
      case 'premium': return 15;   // GOLD
      case 'medium': return 3;     // PLATA
      case 'basic': return 1;      // BRONCE
      default: return 0;
    }
  };

  const now = new Date();
  
  // Filtrar y catalogar
  const newSubscribers = businesses.filter(biz => {
    const createdDate = new Date(biz.createdAt);
    const diffTime = Math.abs(now.getTime() - createdDate.getTime());
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays <= getVisibilityDays(biz.packId);
  })
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 20);

  if (newSubscribers.length === 0) return null;

  return (
    <div className="w-full space-y-6 animate-fade-in py-6">
      <div className="flex items-center gap-4 px-2">
        <div className="bg-gray-950 text-white px-6 py-3 rounded-full font-brand font-black text-xs md:text-sm tracking-[0.2em] flex items-center gap-3 shadow-2xl border-l-8 border-orange-500">
          <span className="text-orange-500 text-xl">✨</span> 20 NOVEDADES EN {sectorLabel.toUpperCase()}
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent"></div>
      </div>

      <div className="flex overflow-x-auto gap-5 pb-6 scrollbar-hide px-2">
        {newSubscribers.map((biz) => {
          const createdDate = new Date(biz.createdAt);
          const diffHours = Math.floor(Math.abs(now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
          const timeText = diffHours < 24 ? `hace ${diffHours}h` : `hace ${Math.floor(diffHours/24)}d`;
          
          const getPlanInfo = (packId: string) => {
            switch(packId) {
              case 'super_top': return { label: 'FUEGO', color: 'bg-orange-600 text-white shadow-orange-200', icon: '🔥' };
              case 'premium': return { label: 'GOLD', color: 'bg-yellow-400 text-yellow-900 shadow-yellow-100', icon: '🟡' };
              case 'medium': return { label: 'PLATA', color: 'bg-slate-300 text-slate-800 shadow-slate-100', icon: '⚪' };
              case 'basic': return { label: 'BRONCE', color: 'bg-orange-800 text-white shadow-orange-200', icon: '🟤' };
              default: return { label: 'FREE', color: 'bg-gray-100 text-gray-400', icon: '🍬' };
            }
          };

          const plan = getPlanInfo(biz.packId);

          return (
            <div 
              key={biz.id} 
              className="flex-shrink-0 w-64 group relative overflow-hidden rounded-[2.2rem] bg-white border border-gray-100 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-2"
            >
              <div className={`h-1.5 w-full ${plan.color}`}></div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] shadow-sm ${plan.color} border border-white/20`}>
                    {plan.label}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{timeText}</span>
                    <span className="text-xs animate-pulse mt-0.5">{plan.icon}</span>
                  </div>
                </div>
                
                <h4 className="font-brand font-black text-lg text-gray-900 group-hover:text-orange-600 transition-colors truncate mb-1 leading-none">
                  {biz.name}
                </h4>
                
                <p className="text-[10px] text-gray-400 font-bold truncate uppercase tracking-tighter mb-4">{biz.address}</p>

                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Localizado</span>
                  </div>
                  <button 
                    onClick={() => onViewBusiness?.(biz.id)}
                    className="text-[10px] font-black text-orange-600 hover:text-orange-800 uppercase tracking-widest bg-orange-50 px-3 py-1.5 rounded-xl transition-all"
                  >
                    Ver más
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};