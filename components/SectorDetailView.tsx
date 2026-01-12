
import React from 'react';
import { SectorDetails, SectorInfo } from '../types';

interface SectorDetailViewProps {
  sector: SectorInfo;
  details: SectorDetails;
  imageUrl: string | null;
  isLoading: boolean;
}

export const SectorDetailView: React.FC<SectorDetailViewProps> = ({ sector, details, imageUrl, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 md:py-20 space-y-4 md:space-y-6">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 md:h-20 md:w-20 border-t-4 border-b-4 border-orange-500"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl md:text-2xl animate-pulse">
            {sector.icon}
          </div>
        </div>
        <p className="text-orange-600 font-bold animate-pulse text-lg md:text-xl tracking-tight text-center px-4">Preparando especialidades de {sector.label}...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden border border-orange-50 max-w-5xl mx-auto animate-fade-in relative transition-all">
      
      <div className="flex flex-col md:flex-row min-h-[500px]">
        <div className="w-full md:w-1/2 h-64 md:h-auto relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={sector.label} 
              className="w-full h-full object-cover" 
            />
          ) : (
            <div className="w-full h-full bg-orange-50 flex items-center justify-center">
              <span className="text-6xl md:text-7xl">{sector.icon}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 md:from-black/40 to-transparent pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 bg-white/95 backdrop-blur px-4 py-1.5 md:px-6 md:py-2.5 rounded-xl md:rounded-2xl shadow-xl border border-white">
            <span className="font-extrabold text-orange-600 text-sm md:text-lg uppercase tracking-wider">{sector.label}</span>
          </div>
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-14 space-y-6 md:space-y-8 flex flex-col justify-center">
          <section>
            <h2 className="text-2xl md:text-3xl font-brand font-extrabold text-gray-900 mb-4 flex items-center gap-3">
              <span className="text-orange-500 text-3xl md:text-4xl">✨</span> Esencia
            </h2>
            <p className="text-gray-700 leading-relaxed text-sm md:text-lg font-normal">
              {details.history}
            </p>
          </section>

          <section>
            <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-orange-400 mb-3">Especialidades Estrella</h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {details.popularItems.map((item, idx) => (
                <span 
                  key={idx} 
                  className="bg-orange-50 text-orange-700 px-3 py-1.5 md:px-5 md:py-2 rounded-lg md:rounded-xl text-xs md:text-sm font-bold border border-orange-100 shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </section>

          <div className="bg-gray-50 border-l-8 border-orange-400 p-5 md:p-8 rounded-xl md:rounded-2xl shadow-inner relative overflow-hidden">
            <div className="absolute -top-1 -right-2 text-orange-100 text-4xl md:text-6xl font-black italic select-none opacity-50 md:opacity-100">TIP</div>
            <h4 className="font-extrabold text-xs md:text-base text-gray-900 mb-1 flex items-center gap-2 relative z-10">
              💡 Recomendación Experta
            </h4>
            <p className="text-gray-600 text-xs md:text-sm font-medium relative z-10 leading-relaxed">{details.tips}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
