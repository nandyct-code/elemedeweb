import React, { useState } from 'react';
import { Sparkles, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { generateSweetContent } from '../services/geminiService';

interface SweetGeneratorProps {
  activeSector: string;
}

export const SweetGenerator: React.FC<SweetGeneratorProps> = ({ activeSector }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ description: string; imageUrl?: string } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    setResult(null);

    try {
      const data = await generateSweetContent(prompt, activeSector);
      setResult(data);
    } catch (error) {
      alert("Hubo un error generando tu dulce. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-orange-100">
      <div className="p-8 md:p-10">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-pink-500" />
          <h2 className="text-2xl font-bold text-gray-800">Laboratorio de {activeSector}</h2>
        </div>
        
        <p className="text-gray-600 mb-8">
          Describe tu idea más dulce y deja que nuestra IA genere una imagen hiperrealista y una descripción tentadora.
        </p>

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Ej: Un pastel de tres leches con frutos rojos exóticos y chocolate blanco...`}
              className="w-full p-4 pr-12 rounded-xl border-2 border-orange-100 focus:border-pink-400 focus:ring focus:ring-pink-200 transition-all outline-none resize-none h-32 text-gray-700 bg-orange-50/30"
            />
            <div className="absolute bottom-4 right-4 text-xs text-gray-400">
              {prompt.length} car.
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-400 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> Creando Dulzura...
              </>
            ) : (
              <>
                <Sparkles size={20} /> Generar Experiencia
              </>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-orange-50/50 border-t border-orange-100 animate-fade-in">
          <div className="grid md:grid-cols-2 gap-0">
            <div className="p-8 flex flex-col justify-center">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full uppercase tracking-wider">Descripción</span>
                </h3>
              <p className="text-gray-700 leading-relaxed italic text-lg">
                "{result.description}"
              </p>
            </div>
            
            <div className="relative bg-gray-100 min-h-[300px] flex items-center justify-center overflow-hidden">
              {result.imageUrl ? (
                <img 
                  src={result.imageUrl} 
                  alt="Sweet generation" 
                  className="w-full h-full object-cover absolute inset-0 transition-opacity duration-700 ease-in-out"
                />
              ) : (
                <div className="text-gray-400 flex flex-col items-center">
                    <ImageIcon size={48} className="mb-2 opacity-50" />
                    <span>No image generated</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};