import React, { useState, useEffect } from 'react';
import { SECTORS } from '../constants';

interface MaintenanceScreenProps {
  onUnlockAttempt: () => void;
}

export const MaintenanceScreen: React.FC<MaintenanceScreenProps> = ({ onUnlockAttempt }) => {
  // SECURE ACCESS PATTERN: PING-PONG
  // Sequence: First Sector -> Last Sector -> First -> Last -> First
  // Indices: 0, 5, 0, 5, 0
  const SECRET_SEQUENCE = [0, 5, 0, 5, 0];
  
  const [progress, setProgress] = useState(0);
  const [shakeIndex, setShakeIndex] = useState<number | null>(null);
  const [flashIndex, setFlashIndex] = useState<number | null>(null);
  
  // Phase 2: Manual Override (Title Clicks)
  const [isSequenceComplete, setIsSequenceComplete] = useState(false);
  const [titleClicks, setTitleClicks] = useState(0);

  // Reset title clicks if too much time passes between clicks
  useEffect(() => {
    if (titleClicks > 0 && titleClicks < 3) {
      const timer = setTimeout(() => setTitleClicks(0), 2000);
      return () => clearTimeout(timer);
    }
  }, [titleClicks]);

  const handleSecretClick = (index: number) => {
    // If already unlocked phase 1, ignore icon clicks
    if (isSequenceComplete) return;

    // Check if the clicked icon index matches the expected next step in the sequence
    if (index === SECRET_SEQUENCE[progress]) {
      const nextProgress = progress + 1;
      
      // Visual feedback for correct click
      setFlashIndex(index);
      setTimeout(() => setFlashIndex(null), 200);
      
      if (nextProgress === SECRET_SEQUENCE.length) {
        // Phase 1 Success! Unlock the title interaction
        setIsSequenceComplete(true);
        setProgress(0);
      } else {
        // Advance sequence
        setProgress(nextProgress);
      }
    } else {
      // Wrong icon clicked - Access Denied Logic
      setShakeIndex(index);
      setTimeout(() => setShakeIndex(null), 400);
      setProgress(0); // Reset sequence to start
    }
  };

  const handleTitleClick = () => {
    if (!isSequenceComplete) return;

    const newCount = titleClicks + 1;
    setTitleClicks(newCount);

    if (newCount >= 3) {
      // Phase 2 Success! Open Admin Auth
      onUnlockAttempt();
      // Reset states nicely
      setTimeout(() => {
        setTitleClicks(0);
        setIsSequenceComplete(false);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-gray-950 flex flex-col items-center justify-center overflow-hidden select-none p-4">
      {/* Static Background Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-950 to-black pointer-events-none"></div>

      <div className="relative z-10 text-center max-w-4xl w-full space-y-16">
        
        <div className="space-y-6">
          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center border-4 shadow-2xl relative transition-all duration-500 ${isSequenceComplete ? 'bg-orange-600 border-orange-400 animate-pulse' : 'bg-gray-900 border-gray-800'}`}>
             <span className="text-3xl">
                {isSequenceComplete ? '🔓' : '🛡️'}
             </span>
             {progress > 0 && !isSequenceComplete && (
                 <div className="absolute -top-2 -right-2 bg-orange-600 w-6 h-6 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-gray-900">
                     {progress}
                 </div>
             )}
          </div>
          <div>
            <h1 
                onClick={handleTitleClick}
                className={`text-5xl md:text-7xl font-brand font-black tracking-tighter uppercase italic transition-all duration-300 ${
                    isSequenceComplete 
                        ? 'text-orange-500 cursor-pointer hover:scale-105 hover:text-orange-400 select-none' 
                        : 'text-white cursor-default'
                }`}
            >
                Mantenimiento
            </h1>
            <p className={`font-bold text-xs md:text-sm uppercase tracking-[0.4em] leading-relaxed mt-4 transition-colors duration-300 ${isSequenceComplete ? 'text-orange-400 animate-pulse' : 'text-gray-500'}`}>
                {isSequenceComplete 
                    ? `PROTOCOLO DE ACCESO ACTIVO (${titleClicks}/3)` 
                    : 'Acceso Restringido • Solo Personal Autorizado'}
            </p>
          </div>
        </div>

        {/* SECURITY GRID PAD */}
        <div className={`flex flex-wrap justify-center gap-4 md:gap-8 max-w-3xl mx-auto perspective-1000 transition-opacity duration-500 ${isSequenceComplete ? 'opacity-30 blur-sm pointer-events-none' : 'opacity-100'}`}>
          {SECTORS.map((sector, idx) => {
            const isShaking = shakeIndex === idx;
            const isFlashing = flashIndex === idx;
            
            return (
                <button
                key={sector.id}
                onClick={() => handleSecretClick(idx)}
                className={`w-20 h-20 md:w-24 md:h-24 bg-gray-900/50 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center shadow-lg border-2 transition-all duration-200 group
                    ${isShaking ? 'border-red-500 bg-red-900/20 translate-x-[-5px] animate-shake' : 'border-white/5 hover:border-white/20'}
                    ${isFlashing ? 'border-green-500 bg-green-900/20 scale-110' : ''}
                    hover:scale-105 active:scale-95
                `}
                title={sector.label}
                >
                <span className={`text-3xl md:text-4xl filter drop-shadow-md transition-transform duration-300 ${isShaking ? 'grayscale' : 'group-hover:scale-110'}`}>
                    {sector.icon}
                </span>
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {idx + 1}
                </span>
                </button>
            );
          })}
        </div>

        <div>
           {!isSequenceComplete ? (
               progress > 0 ? (
                   <div className="flex justify-center gap-2">
                       {SECRET_SEQUENCE.map((_, i) => (
                           <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < progress ? 'bg-orange-500' : 'bg-gray-800'}`}></div>
                       ))}
                   </div>
               ) : <div className="h-2"></div>
           ) : (
               <div className="h-2 text-[9px] font-mono text-orange-500 uppercase tracking-widest animate-bounce">
                   Haga clic en el título para confirmar acceso manual
               </div>
           )}
           
           <div className="mt-8 flex justify-center">
               <button 
                   onClick={onUnlockAttempt}
                   className="text-[9px] font-black text-gray-700 bg-gray-900 border border-gray-800 px-4 py-2 rounded-full uppercase tracking-widest hover:text-white hover:border-gray-600 transition-all flex items-center gap-2"
               >
                   <span className="w-1.5 h-1.5 bg-gray-600 rounded-full"></span> Acceso Staff
               </button>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.3s ease-in-out; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
};