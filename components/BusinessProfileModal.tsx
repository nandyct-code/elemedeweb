
import React, { useState, useMemo, useEffect } from 'react';
import { Business, UserAccount, Rating } from '../types';

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  business: Business;
  currentUser: UserAccount | null;
  onAddRating: (businessId: string, rating: Rating) => void;
  onLoginRequest?: () => void;
  onRequestQuote?: () => void; // NEW CALLBACK
}

export const BusinessProfileModal: React.FC<BusinessProfileModalProps> = ({ 
  isOpen, onClose, business, currentUser, onAddRating, onLoginRequest, onRequestQuote 
}) => {
  const [stars, setStars] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // GALLERY STATE
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  
  // TOOLS STATE
  const [activeTool, setActiveTool] = useState<'none' | 'pickup' | 'events'>('none');
  const [pickupTime, setPickupTime] = useState('');
  const [eventGuests, setEventGuests] = useState(20);

  const allImages = useMemo(() => {
    const list: string[] = [];
    if (business.mainImage) list.push(business.mainImage);
    if (business.images && business.images.length > 0) {
      business.images.forEach(img => {
        if (!list.includes(img)) list.push(img);
      });
    }
    return list;
  }, [business]);

  const averageRating = useMemo(() => {
    if (!business.ratings || business.ratings.length === 0) return "0.0";
    const sum = business.ratings.reduce((acc, r) => acc + r.stars, 0);
    return (sum / business.ratings.length).toFixed(1);
  }, [business.ratings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (currentUser.role === 'business_owner') {
        alert("Las cuentas de negocio no pueden realizar valoraciones.");
        return;
    }
    setIsSubmitting(true);
    const newRating: Rating = {
      id: Math.random().toString(36).substr(2, 9),
      stars: stars,
      comment: comment,
      date: new Date().toISOString().split('T')[0]
    };
    setTimeout(() => {
      onAddRating(business.id, newRating);
      setComment('');
      setStars(5);
      setIsSubmitting(false);
    }, 800);
  };

  // Gallery Nav
  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryIndex === null) return;
    setGalleryIndex((prev) => (prev! + 1) % allImages.length);
  };
  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (galleryIndex === null) return;
    setGalleryIndex((prev) => (prev! - 1 + allImages.length) % allImages.length);
  };

  // OPENING STATUS LOGIC
  const isOpenNow = useMemo(() => {
      if (business.liveStatus === 'open' || business.liveStatus === 'fresh_batch' || business.liveStatus === 'last_units' || business.liveStatus === 'busy') return true;
      if (business.liveStatus === 'closed') return false;

      // Check Hours
      if (!business.openingHours) return false;
      const now = new Date();
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const today = days[now.getDay()];
      const hours = business.openingHours[today];
      
      if (!hours || hours.closed) return false;
      
      const current = now.getHours() * 60 + now.getMinutes();
      const [openH, openM] = hours.open.split(':').map(Number);
      const [closeH, closeM] = hours.close.split(':').map(Number);
      
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      
      return current >= openTime && current <= closeTime;
  }, [business]);

  const liveBadge = useMemo(() => {
      switch(business.liveStatus) {
          case 'fresh_batch': return { text: '🔥 HORNEADA AHORA', color: 'bg-orange-600', animate: 'animate-pulse' };
          case 'last_units': return { text: '⚠️ ÚLTIMAS UDS.', color: 'bg-yellow-500', animate: '' };
          case 'busy': return { text: '🛑 SATURADO', color: 'bg-red-600', animate: '' };
          default: return isOpenNow ? { text: '🟢 ABIERTO', color: 'bg-green-600', animate: '' } : { text: '🔒 CERRADO', color: 'bg-gray-600', animate: '' };
      }
  }, [business.liveStatus, isOpenNow]);

  // ACTIONS (Uses Phone/Internal, NO WhatsApp Bridge)
  const handlePickupReserve = () => {
      if (!pickupTime) return alert("Selecciona una hora");
      alert("Para confirmar esta reserva, por favor llama al establecimiento usando el botón de teléfono en el perfil. Menciona tu usuario de ELEMEDE.");
  };

  const handleEventQuote = () => {
      // Trigger App.tsx handler
      if (onRequestQuote) {
          onRequestQuote();
      } else {
          alert("Por favor, utilice el botón 'Organizar Evento' en el menú principal para contactar.");
      }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-950/90 backdrop-blur-md animate-fade-in overflow-hidden">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-5xl h-[92vh] sm:h-[90vh] shadow-2xl flex flex-col relative overflow-hidden">
        
        {/* Hero Section */}
        <div 
            className="h-40 sm:h-64 md:h-80 relative flex-shrink-0 cursor-zoom-in group"
            onClick={() => { const idx = allImages.indexOf(business.mainImage || ''); if (idx >= 0) setGalleryIndex(idx); }}
        >
          <img src={business.mainImage} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={business.name} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent"></div>
          
          {liveBadge && (
              <div className={`absolute top-4 left-4 z-20 text-white text-[10px] font-black px-3 py-1.5 rounded-lg shadow-lg uppercase tracking-widest ${liveBadge.color} ${liveBadge.animate}`}>
                  {liveBadge.text}
              </div>
          )}

          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="absolute top-4 right-4 bg-white/20 backdrop-blur-xl text-white p-2.5 rounded-xl hover:bg-orange-600 transition-all z-10">✕</button>

          <div className="absolute bottom-4 left-6 sm:bottom-8 sm:left-10 space-y-1 sm:space-y-3 pr-10">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-brand font-black text-white tracking-tighter italic drop-shadow-lg leading-none">{business.name}</h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
               <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur px-3 py-1 rounded-full border border-white/20 text-orange-200 font-black text-xs sm:text-sm"><span>⭐</span> {averageRating} / 5</div>
               <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white/60">{business.ratings?.length || 0} OPINIONES</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide p-6 sm:p-10 md:p-14">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-16">
            
            <div className="lg:col-span-2 space-y-10 sm:space-y-14">
              {/* COMPETITIVE TOOLS */}
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {business.allowsFastPickup && (
                      <button onClick={() => setActiveTool(activeTool === 'pickup' ? 'none' : 'pickup')} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all min-w-[200px] ${activeTool === 'pickup' ? 'bg-green-50 border-green-500 shadow-lg' : 'bg-white border-gray-100 hover:border-green-200'}`}>
                          <span className="text-2xl">🛍️</span>
                          <div className="text-left"><p className="text-[10px] font-black uppercase tracking-widest text-green-700">Reserva Express</p><p className="text-xs text-gray-500">Sin colas • Recogida</p></div>
                      </button>
                  )}
                  <button onClick={() => setActiveTool(activeTool === 'events' ? 'none' : 'events')} className={`flex items-center gap-3 px-6 py-4 rounded-2xl border-2 transition-all min-w-[200px] ${activeTool === 'events' ? 'bg-purple-50 border-purple-500 shadow-lg' : 'bg-white border-gray-100 hover:border-purple-200'}`}>
                      <span className="text-2xl">🎉</span>
                      <div className="text-left"><p className="text-[10px] font-black uppercase tracking-widest text-purple-700">Calculadora Eventos</p><p className="text-xs text-gray-500">Bodas & Fiestas</p></div>
                  </button>
              </div>

              {/* TOOL PANELS */}
              {activeTool === 'pickup' && (
                  <div className="bg-green-50/50 p-6 rounded-[2rem] border border-green-200 animate-fade-in">
                      <h4 className="font-black text-green-900 uppercase italic text-lg mb-4">Configura tu Recogida</h4>
                      <div className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="w-full"><label className="text-[10px] font-black text-green-700 uppercase tracking-widest">Hora Estimada</label><input type="time" className="w-full mt-1 p-3 rounded-xl border border-green-200 bg-white font-bold text-sm" value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} /></div>
                          <button onClick={handlePickupReserve} className="w-full bg-green-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-700">Llamar para Reservar</button>
                      </div>
                  </div>
              )}

              {activeTool === 'events' && (
                  <div className="bg-purple-50/50 p-6 rounded-[2rem] border border-purple-200 animate-fade-in">
                      <h4 className="font-black text-purple-900 uppercase italic text-lg mb-4">Presupuesto Rápido</h4>
                      <div className="space-y-4">
                          <div><label className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex justify-between"><span>Invitados</span><span className="text-lg">{eventGuests}</span></label><input type="range" min="10" max="200" step="5" className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer mt-2" value={eventGuests} onChange={(e) => setEventGuests(Number(e.target.value))} /></div>
                          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-purple-100"><span className="text-xs font-bold text-gray-500">Estimación Dulce</span><span className="text-xl font-black text-purple-600">~{(eventGuests * 3.5).toFixed(0)}€</span></div>
                          <button onClick={handleEventQuote} className="w-full bg-purple-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-purple-700">Consultar Disponibilidad</button>
                      </div>
                  </div>
              )}

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Sobre nosotros</h3>
                <p className="text-gray-700 leading-relaxed font-medium text-lg sm:text-2xl italic border-l-8 border-orange-400 pl-8 py-4 bg-orange-50/20 rounded-r-3xl">{business.description || "Este establecimiento es parte de la élite repostera de ELEMEDE."}</p>
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Ubicación y Contacto</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex items-center gap-4 bg-orange-50/30 p-5 rounded-2xl border border-orange-100 group">
                    <span className="text-2xl">📍</span>
                    <div className="min-w-0">
                       <p className="font-bold text-gray-900 text-xs sm:text-sm">{business.address}, {business.cp} {business.city}</p>
                       <p className="text-[10px] font-black text-gray-400 mt-1">📞 {business.phone}</p>
                       
                       {/* SEDES ADICIONALES FIX */}
                       {business.direccionesAdicionales && business.direccionesAdicionales.length > 0 && (
                           <div className="mt-3 space-y-2 border-t border-orange-200 pt-2">
                               <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Otras Sedes</p>
                               {business.direccionesAdicionales.map((sede, idx) => (
                                   <p key={idx} className="text-xs text-gray-600 font-bold">📍 {sede.calle}, {sede.ciudad}</p>
                               ))}
                           </div>
                       )}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] border-b border-gray-100 pb-3">Galería</h3>
                {business.images && business.images.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                    {business.images.map((img, idx) => (
                      <div key={idx} onClick={() => { const realIdx = allImages.indexOf(img); if (realIdx >= 0) setGalleryIndex(realIdx); }} className="aspect-square rounded-[1.5rem] overflow-hidden border-4 border-white shadow-lg cursor-zoom-in">
                        <img src={img} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                ) : <div className="bg-gray-50 py-16 text-center rounded-[3rem]"><p className="text-gray-400 font-black uppercase text-[10px]">Sin imágenes</p></div>}
              </section>
            </div>

            <div className="space-y-10">
              <section className="bg-gray-950 p-8 rounded-[2.5rem] text-white space-y-6 shadow-2xl relative overflow-hidden group">
                <div className="relative z-10"><h4 className="text-sm font-black uppercase tracking-[0.2em]">Tu Valoración</h4><p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Comparte tu experiencia</p></div>
                {currentUser ? (
                  currentUser.role === 'business_owner' ? (
                    <div className="text-center py-8 space-y-3 border border-white/10 rounded-2xl bg-white/5"><p className="text-[10px] font-black text-gray-300 uppercase">Negocios no pueden valorar.</p></div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                      <div className="flex justify-center gap-2 py-2">{[1, 2, 3, 4, 5].map((star) => (<button key={star} type="button" onClick={() => setStars(star)} className={`text-3xl ${star <= stars ? 'grayscale-0' : 'grayscale brightness-50 opacity-30'}`}>⭐</button>))}</div>
                      <textarea required placeholder="Cuéntanos tu experiencia..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none" value={comment} onChange={(e) => setComment(e.target.value)} />
                      <button disabled={isSubmitting} className="w-full bg-orange-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-orange-500 shadow-xl">{isSubmitting ? 'ENVIANDO...' : 'PUBLICAR RESEÑA'}</button>
                    </form>
                  )
                ) : (
                  <div className="text-center py-6 space-y-4 border border-white/10 rounded-2xl bg-white/5"><p className="text-[10px] font-black text-gray-400 uppercase">Inicia sesión para valorar.</p><button onClick={onLoginRequest} className="w-full bg-white/10 text-orange-400 hover:text-white py-3 rounded-xl font-black text-[10px] uppercase">Iniciar Sesión</button></div>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
      {galleryIndex !== null && <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center" onClick={() => setGalleryIndex(null)}><img src={allImages[galleryIndex]} className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg" /><button onClick={handleNextImage} className="absolute right-4 text-white text-4xl">›</button><button onClick={handlePrevImage} className="absolute left-4 text-white text-4xl">‹</button></div>}
    </div>
  );
};
