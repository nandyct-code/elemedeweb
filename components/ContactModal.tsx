import React, { useState } from 'react';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    // Simulate API Call
    setTimeout(() => {
        alert(`Mensaje enviado correctamente a info@elemede.com\n\nGracias ${formData.name}, te responderemos a ${formData.email} en breve.`);
        setIsSending(false);
        setFormData({ name: '', email: '', subject: '', message: '' });
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl animate-fade-in">
      <div className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-8 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-20 transform rotate-12 text-6xl">✉️</div>
            <h3 className="text-3xl font-brand font-black uppercase italic tracking-tighter relative z-10">Contáctanos</h3>
            <p className="text-xs font-bold uppercase tracking-widest opacity-90 relative z-10 mt-1">Estamos aquí para ayudarte</p>
            <button onClick={onClose} className="absolute top-6 right-6 text-white/80 hover:text-white z-20">✕</button>
        </div>

        <div className="p-8 overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tu Nombre</label>
                    <input 
                        required 
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-400 outline-none transition-colors"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ej: Juan Pérez"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email de Respuesta</label>
                    <input 
                        required 
                        type="email"
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-400 outline-none transition-colors"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="tucorreo@ejemplo.com"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Asunto</label>
                    <select 
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-bold focus:border-orange-400 outline-none transition-colors"
                        value={formData.subject}
                        onChange={e => setFormData({...formData, subject: e.target.value})}
                    >
                        <option value="">Selecciona un motivo...</option>
                        <option value="duda">Duda General</option>
                        <option value="soporte">Soporte Técnico</option>
                        <option value="negocio">Información para Negocios</option>
                        <option value="otro">Otro</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mensaje</label>
                    <textarea 
                        required 
                        className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-sm font-medium focus:border-orange-400 outline-none transition-colors min-h-[120px]"
                        value={formData.message}
                        onChange={e => setFormData({...formData, message: e.target.value})}
                        placeholder="Escribe tu consulta aquí..."
                    />
                </div>

                <button 
                    disabled={isSending}
                    className="w-full bg-gray-900 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-70 mt-4"
                >
                    {isSending ? 'ENVIANDO...' : 'ENVIAR MENSAJE'}
                </button>
            </form>
            
            <div className="mt-6 text-center">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">También puedes escribirnos a</p>
                <a href="mailto:info@elemede.com" className="text-xs font-black text-orange-600 hover:underline">info@elemede.com</a>
            </div>
        </div>
      </div>
    </div>
  );
};