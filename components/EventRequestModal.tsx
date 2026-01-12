
import React, { useState } from 'react';
import { Lead, UserAccount } from '../types';

interface EventRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  onSubmit: (lead: Lead) => void;
  onRequestLogin: () => void;
}

export const EventRequestModal: React.FC<EventRequestModalProps> = ({ isOpen, onClose, currentUser, onSubmit, onRequestLogin }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
      eventType: 'boda',
      date: '',
      guests: 50,
      budget: '',
      location: 'Madrid',
      description: '',
      contactPhone: ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser) {
          onRequestLogin();
          return;
      }

      const newLead: Lead = {
          id: Math.random().toString(36).substr(2, 9),
          eventType: formData.eventType as any,
          date: formData.date,
          guests: formData.guests,
          budget: formData.budget,
          description: formData.description,
          location: formData.location,
          clientName: currentUser.name,
          clientContact: formData.contactPhone || currentUser.email,
          createdAt: new Date().toISOString()
      };

      onSubmit(newLead);
      onClose();
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-950/95 backdrop-blur-xl animate-fade-in">
        <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-pink-500 to-orange-500 p-8 text-white relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white text-xl font-black">✕</button>
                <h3 className="text-3xl font-brand font-black uppercase italic tracking-tighter">Organiza tu Evento</h3>
                <p className="text-xs font-bold uppercase tracking-widest opacity-90 mt-2">Conecta con los mejores obradores</p>
            </div>

            <div className="p-8 overflow-y-auto">
                {!currentUser ? (
                    <div className="text-center py-10 space-y-6">
                        <div className="text-6xl">🔒</div>
                        <h4 className="text-xl font-black text-gray-900 uppercase">Acceso Restringido</h4>
                        <p className="text-sm text-gray-500 font-medium">Necesitas una cuenta de cliente para solicitar presupuestos a nuestros profesionales.</p>
                        <button onClick={onRequestLogin} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all shadow-xl">
                            Iniciar Sesión / Registrarse
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {step === 1 && (
                            <div className="space-y-4 animate-fade-in">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tipo de Evento</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['boda', 'comunion', 'cumpleanos', 'corporativo'].map(type => (
                                        <button 
                                            key={type}
                                            type="button"
                                            onClick={() => setFormData({...formData, eventType: type})}
                                            className={`py-3 rounded-xl font-black text-xs uppercase border-2 transition-all ${formData.eventType === type ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                        >
                                            {type}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Fecha</label>
                                        <input required type="date" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Invitados</label>
                                        <input required type="number" min="10" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={formData.guests} onChange={e => setFormData({...formData, guests: Number(e.target.value)})} />
                                    </div>
                                </div>

                                <button type="button" onClick={() => setStep(2)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 transition-all mt-4">Siguiente</button>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Presupuesto Aprox.</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={formData.budget} onChange={e => setFormData({...formData, budget: e.target.value})}>
                                        <option value="">Selecciona rango...</option>
                                        <option value="< 200€">Menos de 200€</option>
                                        <option value="200€ - 500€">200€ - 500€</option>
                                        <option value="500€ - 1000€">500€ - 1000€</option>
                                        <option value="> 1000€">Más de 1000€</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detalles</label>
                                    <textarea required className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-medium text-sm mt-1 h-32" placeholder="Describe qué necesitas (tarta, mesa dulce, alérgenos...)" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Teléfono de Contacto</label>
                                    <input required type="tel" className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" placeholder="Para que los negocios te llamen" value={formData.contactPhone} onChange={e => setFormData({...formData, contactPhone: e.target.value})} />
                                </div>

                                <div className="flex gap-3 mt-4">
                                    <button type="button" onClick={() => setStep(1)} className="flex-1 bg-gray-100 text-gray-500 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-200">Atrás</button>
                                    <button className="flex-[2] bg-green-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-green-700 shadow-xl">Enviar Solicitud</button>
                                </div>
                            </div>
                        )}
                    </form>
                )}
            </div>
        </div>
    </div>
  );
};
