
import React from 'react';
import { Banner } from '../types';

interface SmartBannerProps {
  banner: Banner;
  onInteract?: () => void;
  onClose?: () => void;
}

export const SmartBanner: React.FC<SmartBannerProps> = ({ banner, onInteract, onClose }) => {
  // Styles logic based on Subtype Strategy
  const getStrategyStyles = () => {
    switch (banner.subtype) {
      case 'seasonality': return 'bg-gradient-to-r from-pink-500 to-orange-400 text-white';
      case 'trend': return 'bg-white border-2 border-orange-100 text-gray-900';
      case 'zone_active': return 'bg-blue-600 text-white';
      case 'educational': return 'bg-indigo-50 border border-indigo-100 text-indigo-900';
      case 'featured': return 'bg-gray-900 text-white border-4 border-gray-900'; // High impact
      case 'offer': return 'bg-red-500 text-white animate-pulse-slow';
      case 'availability': return 'bg-green-500 text-white';
      case 'exclusive': return 'bg-gradient-to-tr from-yellow-400 to-orange-500 text-white shadow-xl';
      case 'reputation': return 'bg-white border border-blue-200 shadow-sm text-gray-800';
      default: return 'bg-white border border-gray-100';
    }
  };

  const handleClick = () => {
    // Analytics hook could go here
    if (onInteract) onInteract();
    if (banner.ctaLink) window.open(banner.ctaLink, '_blank');
  };

  // --- RENDERERS BY FORMAT ---

  if (banner.format === 'horizontal') {
    return (
      <div 
        onClick={handleClick}
        className={`w-full rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg relative cursor-pointer group transition-all hover:scale-[1.01] ${getStrategyStyles()} flex flex-col md:flex-row`}
      >
        {/* Responsive Image Container: Full width on mobile, 40% on desktop */}
        <div className="w-full h-40 md:w-2/5 md:h-auto relative overflow-hidden shrink-0">
          <img 
            src={banner.imageUrl} 
            alt={banner.title} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
          />
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur text-white px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black uppercase tracking-widest">
            {banner.subtype === 'seasonality' ? 'Temporada' : banner.type === 'business_campaign' ? 'Promocionado' : 'Destacado'}
          </div>
        </div>
        
        {/* Content Container */}
        <div className="flex-1 p-5 md:p-8 flex flex-col justify-center relative">
          {banner.subtitle && <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1 md:mb-2">{banner.subtitle}</p>}
          <h3 className="text-xl md:text-3xl font-brand font-black italic tracking-tighter leading-tight mb-4 md:mb-6">{banner.title}</h3>
          {banner.ctaText && (
            <button className="bg-white/20 backdrop-blur-md border border-white/40 text-inherit px-4 py-2 md:px-6 md:py-3 rounded-xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-white hover:text-gray-900 transition-all w-fit">
              {banner.ctaText}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (banner.format === 'card_vertical') {
    return (
      <div 
        onClick={handleClick}
        className={`w-full sm:w-64 flex-shrink-0 rounded-[2rem] overflow-hidden shadow-md relative cursor-pointer group transition-all hover:-translate-y-2 ${getStrategyStyles()}`}
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
        </div>
        <div className="p-5">
          <h4 className="font-black text-lg leading-tight mb-2">{banner.title}</h4>
          {banner.ctaText && <p className="text-[10px] font-bold underline opacity-80">{banner.ctaText} →</p>}
        </div>
      </div>
    );
  }

  if (banner.format === 'sticky_bottom') {
    return (
      <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:w-96 z-[100] animate-fade-in-up">
        <div className={`p-4 md:p-5 rounded-2xl shadow-2xl flex items-center gap-4 relative ${getStrategyStyles()}`}>
          <button onClick={(e) => { e.stopPropagation(); onClose?.(); }} className="absolute -top-2 -right-2 bg-white text-gray-900 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-md z-10">✕</button>
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/20 shrink-0 overflow-hidden">
             {banner.imageUrl ? <img src={banner.imageUrl} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center h-full text-xl">📢</div>}
          </div>
          <div className="flex-1 cursor-pointer min-w-0" onClick={handleClick}>
             <p className="font-black text-xs md:text-sm leading-tight truncate">{banner.title}</p>
             {banner.ctaText && <p className="text-[9px] md:text-[10px] font-bold mt-1 opacity-90 truncate">{banner.ctaText} ›</p>}
          </div>
        </div>
      </div>
    );
  }

  if (banner.format === 'inline') {
    return (
      <div onClick={handleClick} className="my-4 md:my-6 mx-0 md:mx-2 p-4 md:p-6 rounded-[2rem] border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col sm:flex-row items-center gap-4 md:gap-6 cursor-pointer hover:border-orange-200 transition-colors group text-center sm:text-left">
         <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 transition-transform shrink-0">
            {banner.subtype === 'educational' ? '💡' : '✨'}
         </div>
         <div className="flex-1">
            <h4 className="font-bold text-gray-800 text-base md:text-lg">{banner.title}</h4>
            <p className="text-xs text-gray-500 font-medium mt-1">{banner.ctaText || 'Saber más'}</p>
         </div>
         <div className="hidden sm:flex w-10 h-10 rounded-full bg-white items-center justify-center text-gray-400 group-hover:bg-orange-500 group-hover:text-white transition-all">→</div>
      </div>
    );
  }

  if (banner.format === 'mini_badge') {
    return (
        <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full border border-green-200 shadow-sm animate-pulse">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span className="text-[8px] font-black uppercase tracking-widest truncate max-w-[100px]">{banner.title}</span>
        </div>
    );
  }

  return null;
};
