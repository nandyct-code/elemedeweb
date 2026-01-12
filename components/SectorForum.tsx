
import React, { useState, useMemo } from 'react';
import { ForumQuestion, SectorInfo, UserAccount, Business, ForumAnswer } from '../types';

interface SectorForumProps {
  sector: SectorInfo;
  currentUser: UserAccount | null;
  userProvince: string;
  businesses: Business[];
  questions: ForumQuestion[];
  onAddQuestion: (question: ForumQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onReply: (qId: string, answer: ForumAnswer) => void;
  bannedWords?: string[]; // Added prop
}

export const SectorForum: React.FC<SectorForumProps> = ({ 
  sector, currentUser, userProvince, businesses, questions, onAddQuestion, onDeleteQuestion, onReply, bannedWords = []
}) => {
  const [newQuestionTitle, setNewQuestionTitle] = useState('');
  const [newQuestionContent, setNewQuestionContent] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [replyContents, setReplyContents] = useState<Record<string, string>>({});

  // Filtrar preguntas para este sector y asegurar compatibilidad
  const sectorQuestions = useMemo(() => {
    return questions.filter(q => q.sectorId === sector.id).map(q => ({
      ...q,
      authorId: q.authorId || 'legacy',
      province: q.province || 'Madrid'
    }));
  }, [questions, sector.id]);

  // Obtener negocio del usuario actual si es business_owner
  const myBusiness = useMemo(() => {
    if (currentUser?.role !== 'business_owner' || !currentUser.linkedBusinessId) return null;
    return businesses.find(b => b.id === currentUser.linkedBusinessId);
  }, [currentUser, businesses]);

  // Helper to check for bad words
  const containsBadWords = (text: string) => {
      const lowerText = text.toLowerCase();
      return bannedWords.some(word => lowerText.includes(word.toLowerCase()));
  };

  const handleAskQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return alert("Debes iniciar sesión para preguntar.");
    
    // VALIDACIÓN ESTRICTA: Solo clientes pueden preguntar
    if (currentUser.role === 'business_owner') {
        return alert("Los perfiles de negocio están diseñados para responder como expertos, no para realizar preguntas en el foro.");
    }

    // CENSORSHIP CHECK
    if (containsBadWords(newQuestionTitle) || containsBadWords(newQuestionContent)) {
        return alert("Tu mensaje contiene palabras no permitidas por las normas de la comunidad.");
    }
    
    const newQ: ForumQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      sectorId: sector.id,
      authorName: currentUser.name,
      authorId: currentUser.id,
      province: userProvince,
      title: newQuestionTitle,
      content: newQuestionContent,
      date: new Date().toISOString().split('T')[0],
      answers: []
    };

    onAddQuestion(newQ);
    setNewQuestionTitle('');
    setNewQuestionContent('');
    setIsAsking(false);
  };

  const handleDeleteQuestion = (questionId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta pregunta? Esta acción no se puede deshacer.")) {
      onDeleteQuestion(questionId);
    }
  };

  const handleReply = (questionId: string) => {
    if (!myBusiness) return;
    const content = replyContents[questionId];
    if (!content) return;

    // CENSORSHIP CHECK
    if (containsBadWords(content)) {
        return alert("Tu respuesta contiene palabras no permitidas.");
    }

    const newAnswer: ForumAnswer = {
      id: Math.random().toString(36).substr(2, 9),
      authorName: myBusiness.name,
      isSubscriber: true,
      businessId: myBusiness.id,
      content: content,
      date: new Date().toISOString().split('T')[0]
    };

    onReply(questionId, newAnswer);
    setReplyContents({ ...replyContents, [questionId]: '' });
  };

  return (
    <div className="space-y-10 animate-fade-in mt-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h3 className="text-4xl font-brand font-black text-gray-900 tracking-tighter italic">Comunidad {sector.label}</h3>
          <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">Foro de preguntas y respuestas en tiempo real</p>
        </div>
        
        {/* LOGICA VISUAL BOTÓN PREGUNTAR: Solo si no está preguntando Y es usuario (cliente) */}
        {!isAsking && currentUser?.role === 'user' && (
          <button 
            onClick={() => setIsAsking(true)}
            className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs tracking-widest uppercase hover:bg-orange-600 transition-all shadow-xl active:scale-95"
          >
            Hacer una Pregunta
          </button>
        )}

        {/* Mensaje para Negocios */}
        {currentUser?.role === 'business_owner' && (
            <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-gray-200 cursor-default shadow-sm">
                Modo Experto: Solo Respuestas
            </div>
        )}
      </div>

      {isAsking && currentUser?.role === 'user' && (
        <form onSubmit={handleAskQuestion} className="bg-white p-8 rounded-[2.5rem] shadow-2xl border-4 border-orange-200 animate-fade-in space-y-4">
          <div className="flex justify-between items-center">
             <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Nueva consulta en {userProvince}</h4>
             <button type="button" onClick={() => setIsAsking(false)} className="text-gray-400 hover:text-red-500">✕</button>
          </div>
          <input 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 font-bold text-sm focus:ring-4 focus:ring-orange-100 outline-none"
            placeholder="Título de tu duda..."
            value={newQuestionTitle}
            onChange={e => setNewQuestionTitle(e.target.value)}
          />
          <textarea 
            required
            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 font-medium text-sm focus:ring-4 focus:ring-orange-100 outline-none min-h-[120px]"
            placeholder="Explica qué estás buscando o qué necesitas saber sobre este sector..."
            value={newQuestionContent}
            onChange={e => setNewQuestionContent(e.target.value)}
          />
          <button className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-orange-700 transition-all">
            PUBLICAR EN MI ZONA
          </button>
        </form>
      )}

      <div className="space-y-6">
        {sectorQuestions.length === 0 ? (
          <div className="bg-white p-20 rounded-[3rem] border-4 border-dashed border-orange-100 text-center">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-gray-400 font-bold">
                {currentUser?.role === 'business_owner' 
                    ? `No hay preguntas pendientes sobre ${sector.label} en tu zona.` 
                    : `Sé el primero en preguntar sobre ${sector.label} en ${userProvince}.`}
            </p>
          </div>
        ) : (
          sectorQuestions.map(q => {
            // Lógica de validación para responder (NEGOCIOS DEL SECTOR Y ZONA)
            const isMySector = myBusiness?.sectorId === sector.id;
            const isMyProvince = myBusiness?.province.toLowerCase() === q.province.toLowerCase();
            const canReply = isMySector && isMyProvince;
            const isUserOwner = currentUser?.role === 'business_owner';
            
            // Lógica de validación para eliminar (Autor O Admin Maestro)
            const isAuthor = currentUser?.id === q.authorId;
            const isAdminMaestro = currentUser?.role === 'admin_maestro';
            const canDelete = isAuthor || isAdminMaestro;

            return (
              <div key={q.id} className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-orange-50 hover:shadow-2xl transition-all border-l-[12px] border-l-orange-400 group">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                       <h4 className="text-2xl font-brand font-black text-gray-900">{q.title}</h4>
                       <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                          📍 {q.province}
                       </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-xs">👤</div>
                      <span className="text-sm font-black text-gray-900">{q.authorName}</span>
                      <span className="text-xs text-gray-400 font-bold">• {q.date}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className="bg-gray-100 text-gray-500 px-4 py-1 rounded-full text-[10px] font-black uppercase">{q.answers.length} Respuestas</span>
                    
                    {canDelete && (
                      <button 
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="bg-white text-gray-300 hover:text-red-500 hover:bg-red-50 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm border border-gray-100"
                        title={isAdminMaestro ? "Borrar como Admin" : "Eliminar mi pregunta"}
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                
                <p className="text-gray-600 leading-relaxed mb-8">{q.content}</p>

                <div className="space-y-4 pl-6 border-l-2 border-orange-100 mb-8">
                  {q.answers.map(a => (
                    <div key={a.id} className={`p-6 rounded-2xl relative ${a.isSubscriber ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                      {a.isSubscriber && (
                        <div className="absolute -top-3 left-4 flex gap-2">
                           <span className="bg-orange-600 text-white text-[9px] font-black px-3 py-1 rounded-full shadow-lg uppercase tracking-widest">
                              🔥 NEGOCIO LOCAL VERIFICADO
                           </span>
                           <span className="bg-white text-orange-600 text-[9px] font-black px-3 py-1 rounded-full shadow-md border border-orange-100 uppercase tracking-widest">
                              {sector.label.toUpperCase()}
                           </span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2 mt-2">
                        <span className="text-xs font-black text-gray-900">{a.authorName}</span>
                        <span className="text-[10px] text-gray-400 font-bold">{a.date}</span>
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{a.content}</p>
                    </div>
                  ))}
                </div>
                
                {/* Panel de Respuesta (SOLO NEGOCIOS) */}
                {isUserOwner ? (
                  canReply ? (
                    <div className="mt-8 flex gap-3 animate-fade-in">
                      <input 
                        type="text" 
                        placeholder={`Responde como experto en ${sector.label} de ${q.province}...`} 
                        className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-6 py-3 text-sm font-medium focus:ring-4 focus:ring-orange-100 outline-none transition-all"
                        value={replyContents[q.id] || ''}
                        onChange={e => setReplyContents({...replyContents, [q.id]: e.target.value})}
                      />
                      <button 
                        onClick={() => handleReply(q.id)}
                        className="bg-orange-600 text-white px-6 py-3 rounded-xl hover:bg-gray-900 transition-all shadow-lg active:scale-95"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                      </button>
                    </div>
                  ) : (
                    <div className="mt-8 bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center gap-3">
                       <span className="text-xl">⚠️</span>
                       <div>
                          <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">Restricción de Perímetro</p>
                          <p className="text-[9px] font-bold text-red-400">
                             {!isMySector 
                               ? `Tu negocio pertenece a otro sector. Solo expertos en ${sector.label} pueden responder.` 
                               : `Tu zona de acción es ${myBusiness?.province}. Solo negocios de ${q.province} pueden intervenir.`}
                          </p>
                       </div>
                    </div>
                  )
                ) : (
                  <div className="mt-8 bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                     <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Solo los negocios oficiales verificados del sector {sector.label} pueden responder.</p>
                     {!currentUser && <span className="text-[9px] font-black text-orange-600 underline cursor-pointer">Inicia sesión</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
