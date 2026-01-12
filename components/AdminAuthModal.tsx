import React, { useState } from 'react';
import { UserAccount } from '../types';
import { MOCK_USERS } from '../constants';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserAccount) => void;
}

export const AdminAuthModal: React.FC<AdminAuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validación contra el repositorio Maestro de MOCK_USERS
    setTimeout(() => {
      const adminUser = MOCK_USERS.find(u => 
        u.email.toLowerCase() === email.toLowerCase() && 
        u.password_hash === password && 
        (u.role === 'admin_maestro' || u.role === 'marketing_master' || u.role === 'contabilidad_master')
      );

      if (adminUser) {
        onSuccess(adminUser);
        setEmail('');
        setPassword('');
        setError(false);
      } else {
        setError(true);
        console.warn(`[SECURITY BREACH ATTEMPT] Admin login failed for: ${email}`);
        setTimeout(() => setError(false), 3000);
      }
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-950/98 backdrop-blur-2xl animate-fade-in">
      <div className="bg-white rounded-[3.5rem] w-full max-w-md shadow-2xl p-10 md:p-14 space-y-10 border-4 border-gray-900 relative overflow-hidden">
        
        <div className="text-center space-y-3 relative z-10 pt-6">
          <div className="w-20 h-20 bg-gray-900 rounded-3xl mx-auto flex items-center justify-center text-white text-3xl shadow-2xl mb-4 border-4 border-white">
            E
          </div>
          <h2 className="text-4xl font-brand font-black text-gray-900 tracking-tighter uppercase italic leading-none">Admin Core</h2>
          <p className="text-[10px] text-gray-400 font-black tracking-[0.4em] uppercase">Terminal de Control Maestro</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          <div className="space-y-3">
            <input 
              required
              type="email" 
              placeholder="Email Corporativo" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-5 font-bold text-sm focus:border-indigo-600 outline-none transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              required
              type="password" 
              placeholder="Contraseña Maestra" 
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-5 font-bold text-sm focus:border-indigo-600 outline-none transition-all"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase text-center animate-shake border border-red-100">
              ⚠️ Credenciales maestras no válidas para esta terminal
            </div>
          )}

          <button 
            disabled={isLoading}
            className="w-full bg-gray-900 text-white font-brand font-black py-6 rounded-2xl shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 uppercase tracking-[0.3em] text-[11px] disabled:opacity-50"
          >
            {isLoading ? 'SINCRONIZANDO CORE...' : 'INICIAR SESIÓN MAESTRA'}
          </button>
        </form>

        <div className="bg-indigo-50/50 p-6 rounded-3xl text-center border border-indigo-100 relative z-10">
           <p className="text-[9px] font-bold text-indigo-900 uppercase leading-relaxed tracking-wider">
             Este acceso requiere privilegios de operario MASTER. Su IP está siendo monitorizada para cumplir con la ley de protección de datos empresarial.
           </p>
        </div>

        <button onClick={onClose} className="w-full text-gray-300 text-[10px] font-black hover:text-gray-900 uppercase tracking-[0.2em] pt-4 transition-colors">
          Cerrar Terminal
        </button>
      </div>
    </div>
  );
};