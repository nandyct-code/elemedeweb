
import React, { useEffect, useState } from 'react';
import { Banner } from '../types';

interface MarketingOverlayProps {
  banner: Banner;
  onClose: () => void;
  onInterest?: () => void;
}

export const MarketingOverlay: React.FC<MarketingOverlayProps> = ({ banner, onClose, onInterest }) => {
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes in seconds

  useEffect(() => {
    // Auto-close after 2 minutes (120,000 ms)
    const autoCloseTimer = setTimeout(() => {
      onClose();
    }, 120000);

    // Visual countdown
    const countdown = setInterval(() => {
      setTimeLeft((prev) => prev > 0 ? prev - 1 : 0);
    }, 1000);

    return () => {
      clearTimeout(autoCloseTimer);
      clearInterval(countdown);
    };
  }, [onClose]);

  if (!banner) return null;

  const isBusinessAd = !!banner.linkedBusinessId;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row group border-4 border-gray-900">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-white text-gray-900 w-12 h-12 rounded-full flex items-center justify-center shadow-xl hover:bg-red-500 hover:text-white transition-all transform hover:rotate-90 active:scale-90 font-black text-xl border-2 border-gray-100"
        >
          ✕
        </button>

        {/* Timer Indicator */}
        <div className="absolute bottom-4 right-4 z-50 bg-black/50 backdrop-blur text-white px-3 py-1 rounded-full text-[10px] font-mono border border-white/20">
          Cierre auto: {timeLeft}s
        </div>

        {/* Image Section */}
        <div className="w-full md:w-2/3 h-64 md:h-[500px] relative overflow-hidden bg-gray-100">
          <img 
            src={banner.imageUrl} 
            alt={banner.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none md:hidden"></div>
          {banner.position === 'header' && (
             <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg">
                Destacado
             </div>
          )}
        </div>

        {/* Content Section */}
        <div className="w-full md:w-1/3 p-8 md:p-12 flex flex-col justify-between bg-white relative">
          <div className="space-y-6">
            <div>
                <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] mb-2">
                    {isBusinessAd ? 'Negocio Destacado' : 'Promoción Especial'}
                </p>
                <h2 className="text-3xl md:text-4xl font-brand font-black text-gray-900 leading-none italic tracking-tighter">
                {banner.title}
                </h2>
                {banner.subtitle && (
                    <p className="text-xs font-bold text-gray-400 uppercase mt-2">{banner.subtitle}</p>
                )}
            </div>
            
            <div className="space-y-4">
                <div className="h-1 w-20 bg-gray-900 rounded-full"></div>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">
                    {isBusinessAd 
                        ? "Haz clic para visitar el perfil de este negocio, ver sus productos y contactar." 
                        : "Descubre las novedades que tenemos preparadas para ti en esta campaña exclusiva."}
                </p>
            </div>
          </div>

          <button 
            onClick={onInterest || onClose}
            className="mt-8 w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95 group-hover:shadow-orange-200 flex items-center justify-center gap-2"
          >
            {isBusinessAd ? 'Visitar Perfil 🏪' : 'Explorar 💫'}
          </button>
        </div>
      </div>
    </div>
  );
};
