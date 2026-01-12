import React from 'react';
import { SectorInfo } from '../types';

interface SectorCardProps {
  sector: SectorInfo;
  isActive: boolean;
  onClick: () => void;
}

export const SectorCard: React.FC<SectorCardProps> = ({ sector, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative group flex flex-col items-center p-6 rounded-3xl transition-all duration-300 transform cursor-pointer h-full ${
        isActive 
          ? 'scale-105 ring-4 ring-orange-200 bg-white shadow-2xl z-10' 
          : 'bg-white hover:bg-orange-50 hover:-translate-y-1 shadow-md border border-pink-50'
      }`}
    >
      <div className={`w-16 h-16 ${sector.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm group-hover:rotate-6 transition-all duration-300`}>
        {sector.icon}
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight text-center">{sector.label}</h3>
      <p className="text-[11px] font-medium text-gray-500 text-center leading-relaxed mb-4 flex-1 line-clamp-3">
        {sector.description}
      </p>
      
      <button 
        className={`w-full px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
          isActive 
            ? 'bg-orange-500 text-white shadow-orange-200 ring-2 ring-orange-200 ring-offset-2' 
            : 'bg-gray-100 text-gray-500 group-hover:bg-gray-900 group-hover:text-white group-hover:shadow-lg'
        }`}
      >
        {isActive ? 'Activo' : 'Entrar'}
      </button>

      {isActive && (
        <div className="absolute -top-3 -right-3 bg-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg animate-bounce z-10">
          ACTIVO
        </div>
      )}
    </div>
  );
};