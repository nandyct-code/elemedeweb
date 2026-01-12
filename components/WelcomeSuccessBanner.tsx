
import React from 'react';
import { SUBSCRIPTION_PACKS } from '../constants';

interface WelcomeSuccessBannerProps {
  businessName: string;
  planId: string;
  onContinue: () => void;
}

export const WelcomeSuccessBanner: React.FC<WelcomeSuccessBannerProps> = ({ businessName, planId, onContinue }) => {
  const plan = SUBSCRIPTION_PACKS.find(p => p.id === planId);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-950/95 backdrop-blur-xl animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-[3rem] p-10 text-center shadow-2xl border-4 border-orange-500 overflow-hidden">
        {/* Background Decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
            <div className="absolute top-10 left-10 text-6xl transform -rotate-12">🎉</div>
            <div className="absolute bottom-10 right-10 text-6xl transform rotate-12">🧁</div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-9xl opacity-20">✨</div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner animate-bounce border-4 border-green-200">
            <span className="text-5xl">✅</span>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-black text-gray-400 uppercase tracking-[0.3em]">Suscripción Completada</p>
            <h2 className="text-4xl font-brand font-black text-gray-900 leading-none tracking-tighter">
              ¡Bienvenido, <br/>
              <span className="text-orange-600 italic">{businessName}!</span>
            </h2>
          </div>

          <div className="bg-gray-50 p-6 rounded-3xl border-2 border-gray-100 transform rotate-1 hover:rotate-0 transition-transform duration-300">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Has contratado</p>
            <div className="flex items-center justify-center gap-3">
                <span className="text-2xl">{plan?.badge === 'FUEGO' ? '🔥' : '👑'}</span>
                <h3 className="text-2xl font-black text-gray-900 uppercase italic">{plan?.label}</h3>
            </div>
            <p className="text-xs font-medium text-gray-500 mt-2">Tu panel de negocio ya está activo y configurado.</p>
          </div>

          <button 
            onClick={onContinue}
            className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95 group"
          >
            Ir a mi Panel de Control <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};
