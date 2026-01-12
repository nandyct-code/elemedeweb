import React from 'react';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, title, content }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-950/90 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border-4 border-white">
        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-2xl font-brand font-black text-gray-900 uppercase italic tracking-tighter">{title}</h3>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all font-black"
          >
            ✕
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 sm:p-12">
          <div className="prose prose-orange max-w-none text-sm sm:text-base text-gray-600 font-medium whitespace-pre-wrap leading-relaxed">
            {content}
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 bg-white text-center">
            <button 
                onClick={onClose}
                className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-lg active:scale-95"
            >
                Cerrar Documento
            </button>
        </div>
      </div>
    </div>
  );
};