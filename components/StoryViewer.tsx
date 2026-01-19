
import React, { useState, useEffect } from 'react';
import { Business, BusinessStory } from '../types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface StoryViewerProps {
  business: Business;
  onClose: () => void;
  onViewProfile: () => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ business, onClose, onViewProfile }) => {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const stories = business.stories || [];
  
  const currentStory = stories[currentStoryIndex];
  const DURATION = 5000; // 5 seconds per story

  useEffect(() => {
    if (!currentStory) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / (DURATION / 100)); // Update every 100ms
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentStoryIndex]);

  const handleNext = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  if (stories.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black flex items-center justify-center animate-fade-in">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-6 right-6 text-white z-50 p-2 bg-black/20 backdrop-blur rounded-full hover:bg-white/20 transition-colors">
            <X size={24} />
        </button>

        <div className="relative w-full max-w-md h-full md:h-[90vh] bg-gray-900 md:rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
            
            {/* Progress Bars */}
            <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
                {stories.map((_, idx) => (
                    <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{ 
                                width: idx < currentStoryIndex ? '100%' : idx === currentStoryIndex ? `${progress}%` : '0%' 
                            }}
                        ></div>
                    </div>
                ))}
            </div>

            {/* Header Info */}
            <div className="absolute top-4 left-0 right-0 z-20 p-4 flex items-center gap-3 pt-6">
                <img src={business.mainImage} className="w-10 h-10 rounded-full border-2 border-orange-500 object-cover" />
                <div className="flex-1">
                    <h4 className="text-white font-black text-sm drop-shadow-md">{business.name}</h4>
                    <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{currentStory.type === 'fresh_batch' ? '🔥 Recién Horneado' : '📢 Promo'}</p>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 relative bg-gray-800 flex items-center justify-center">
                {currentStory.mediaType === 'video' ? (
                    <video 
                        src={currentStory.imageUrl} 
                        className="w-full h-full object-cover"
                        autoPlay
                        playsInline
                        loop={false}
                        onEnded={handleNext}
                    />
                ) : (
                    <img 
                        src={currentStory.imageUrl || business.mainImage} 
                        className="w-full h-full object-cover animate-pulse-slow" 
                        style={{ animationDuration: '10s' }} // Slight zoom effect
                    />
                )}
                
                {/* Text Overlay */}
                {currentStory.text && (
                    <div className="absolute bottom-24 left-0 right-0 p-6 text-center">
                        <p className="text-white font-brand font-black text-2xl md:text-3xl italic drop-shadow-lg leading-tight bg-black/30 backdrop-blur-sm p-4 rounded-3xl inline-block border border-white/10">
                            {currentStory.text}
                        </p>
                    </div>
                )}
            </div>

            {/* Navigation Tap Areas */}
            <div className="absolute inset-0 z-10 flex">
                <div className="w-1/3 h-full" onClick={handlePrev}></div>
                <div className="w-2/3 h-full" onClick={handleNext}></div>
            </div>

            {/* Footer CTA */}
            <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/80 to-transparent pt-20">
                <button 
                    onClick={onViewProfile}
                    className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-orange-500 hover:text-white transition-all shadow-xl active:scale-95"
                >
                    Ver Perfil Completo
                </button>
            </div>
        </div>
    </div>
  );
};
