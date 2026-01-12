import React, { useState, useEffect, useMemo } from 'react';
import { SWEET_KEYWORDS, SECTORS } from '../constants';

interface SearchExperienceProps {
  onSearch: (query: string) => void;
}

export const SearchExperience: React.FC<SearchExperienceProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);

  // Cargar historial al inicio
  useEffect(() => {
    const saved = localStorage.getItem('elemede_search_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  const saveToHistory = (term: string) => {
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return;
    
    const newHistory = [cleanTerm, ...history.filter(t => t !== cleanTerm)].slice(0, 8);
    setHistory(newHistory);
    localStorage.setItem('elemede_search_history', JSON.stringify(newHistory));
  };

  const handleSearch = (term: string) => {
    setQuery(term);
    saveToHistory(term);
    onSearch(term);
    setIsFocused(false);
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('elemede_search_history');
    onSearch('');
  };

  const removeHistoryItem = (term: string) => {
    const newHistory = history.filter(t => t !== term);
    setHistory(newHistory);
    localStorage.setItem('elemede_search_history', JSON.stringify(newHistory));
  };

  // Sugerencias filtradas
  const suggestions = useMemo(() => {
    if (!query) return [];
    return SWEET_KEYWORDS.filter(k => 
      k.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);
  }, [query]);

  // "Funnel" - El sabor favorito basado en frecuencia (simplificado para demo)
  const favoriteFlavor = useMemo(() => {
    if (history.length === 0) return null;
    return history[0]; // El más reciente es el más influyente para el embudo
  }, [history]);

  return (
    <div className="relative w-full max-w-2xl mx-auto z-50">
      <div className={`flex items-center bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 md:border-4 transition-all shadow-xl p-1 md:p-2 ${isFocused ? 'border-orange-500 scale-[1.01]' : 'border-orange-100'}`}>
        <span className="pl-3 md:pl-4 text-xl md:text-2xl hidden sm:inline">🔍</span>
        <input 
          type="text"
          placeholder="Busca dulces..."
          className="flex-1 px-3 md:px-4 py-2 md:py-3 bg-transparent outline-none font-brand font-bold text-sm md:text-lg text-gray-900 placeholder:text-gray-300"
          value={query}
          onFocus={() => setIsFocused(true)}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        {query && (
          <button onClick={() => setQuery('')} className="p-2 text-gray-300 hover:text-gray-900">
            ✕
          </button>
        )}
        <button 
          onClick={() => handleSearch(query)}
          className="bg-gray-900 text-white px-4 md:px-8 py-2 md:py-3 rounded-xl md:rounded-2xl font-brand font-black text-[10px] md:text-sm uppercase tracking-widest hover:bg-orange-600 transition-all flex items-center justify-center min-w-[50px]"
        >
          <span className="hidden xs:inline">BUSCAR</span>
          <span className="xs:hidden">🔍</span>
        </button>
      </div>

      {/* Dropdown de Historial y Sugerencias */}
      {isFocused && (history.length > 0 || suggestions.length > 0) && (
        <div className="absolute top-full left-0 w-full mt-2 md:mt-4 bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl border border-orange-50 overflow-hidden animate-fade-in max-h-[60vh] overflow-y-auto">
          {favoriteFlavor && (
            <div className="bg-orange-50 p-3 md:p-4 border-b border-orange-100 flex items-center justify-between">
              <span className="text-[8px] md:text-[10px] font-black text-orange-600 uppercase tracking-[0.1em] md:tracking-[0.2em]">🎯 Embudo: <span className="text-gray-900">{favoriteFlavor}</span></span>
              <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full animate-ping"></div>
            </div>
          )}

          <div className="p-4 md:p-6 space-y-4 md:space-y-6">
            {suggestions.length > 0 && (
              <div>
                <h4 className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Sugerencias</h4>
                <div className="flex flex-wrap gap-1.5 md:gap-2">
                  {suggestions.map(s => (
                    <button 
                      key={s} 
                      onClick={() => handleSearch(s)}
                      className="px-3 py-1.5 md:px-4 md:py-2 bg-orange-100/50 hover:bg-orange-500 hover:text-white rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all border border-orange-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2 md:mb-3">
                  <h4 className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">Recientes</h4>
                  <button onClick={clearHistory} className="text-[8px] md:text-[10px] font-black text-red-400 hover:text-red-600 uppercase transition-colors">Borrar</button>
                </div>
                <div className="space-y-1">
                  {history.map(term => (
                    <div key={term} className="flex items-center justify-between group">
                      <button 
                        onClick={() => handleSearch(term)}
                        className="flex-1 text-left py-1.5 md:py-2 text-xs md:text-sm font-bold text-gray-600 hover:text-orange-600 flex items-center gap-2 md:gap-3"
                      >
                        <span className="opacity-40 text-xs md:text-sm">🕒</span> {term}
                      </button>
                      <button onClick={() => removeHistoryItem(term)} className="p-1 md:p-2 text-gray-300 hover:text-red-500 transition-all">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overlay para cerrar al hacer clic fuera */}
      {isFocused && <div className="fixed inset-0 -z-10" onClick={() => setIsFocused(false)}></div>}
    </div>
  );
};