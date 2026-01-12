
import React, { useState, useEffect } from 'react';

export const CookieConsentBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('elemede_cookie_consent');
    if (!consent) {
      // Small delay for better UX on load
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('elemede_cookie_consent', 'granted');
    setIsVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem('elemede_cookie_consent', 'denied');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[5000] bg-white/95 backdrop-blur-xl border-t border-gray-200 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-6 md:p-8 animate-fade-in-up">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <span className="text-2xl">🍪</span>
            <h4 className="font-brand font-black text-gray-900 uppercase italic tracking-tighter">Tu Privacidad Importa</h4>
          </div>
          <p className="text-xs text-gray-600 font-medium leading-relaxed max-w-2xl">
            Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico, garantizar la seguridad del sistema y mostrarte publicidad personalizada. Al continuar navegando, aceptas su uso conforme a nuestra Política de Cookies.
          </p>
        </div>
        
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={handleReject}
            className="flex-1 md:flex-none px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-500 font-black text-[10px] uppercase tracking-widest hover:border-gray-900 hover:text-gray-900 transition-all"
          >
            Rechazar
          </button>
          <button 
            onClick={handleAccept}
            className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-gray-900 text-white font-black text-[10px] uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg active:scale-95"
          >
            Aceptar Todas
          </button>
        </div>
      </div>
    </div>
  );
};
