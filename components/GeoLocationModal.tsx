import React from 'react';

interface GeoLocationModalProps {
  onEnable: () => void;
  onSkip: () => void;
}

export const GeoLocationModal: React.FC<GeoLocationModalProps> = ({ onEnable, onSkip }) => {
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-md p-10 text-center shadow-2xl border-4 border-white relative overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-orange-50 to-transparent pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 text-9xl opacity-5 pointer-events-none">📍</div>

        <div className="relative z-10 space-y-8">
          <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce">
            <span className="text-5xl">🧭</span>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-brand font-black text-gray-900 leading-none tracking-tighter">
              Encuentra el Dulce <br/> <span className="text-orange-600">Más Cercano</span>
            </h2>
            <p className="text-sm font-medium text-gray-500 leading-relaxed px-4">
              Para mostrarte las mejores pastelerías y confiterías en tu zona, necesitamos acceder a tu ubicación.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <button 
              onClick={onEnable}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95 group"
            >
              <span className="group-hover:mr-2 transition-all">📍</span> Activar Geolocalización
            </button>
            <button 
              onClick={onSkip}
              className="w-full py-3 text-gray-400 font-black uppercase text-[10px] tracking-widest hover:text-gray-600 transition-colors"
            >
              Continuar con ubicación por defecto (Madrid)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};