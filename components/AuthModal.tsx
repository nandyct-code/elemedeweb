
import React, { useState } from 'react';
import { UserAccount } from '../types';
import { MOCK_USERS } from '../constants';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserAccount) => void;
  onOpenSubscription: () => void;
}

type Mode = 'login' | 'signup' | 'recovery';
type Role = 'user' | 'business_owner';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, onOpenSubscription }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('user');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: ''
  });
  
  // Recovery State
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryStatus, setRecoveryStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: 'google' | 'facebook' | 'apple') => {
    setIsSubmitting(provider);
    
    setTimeout(() => {
      const newUser: UserAccount = {
        id: Math.random().toString(36).substr(2, 9),
        name: `Usuario ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        email: `${provider}@social.com`,
        role: role as any, 
        status: 'active',
        password_hash: 'social_login',
        last_login: new Date().toISOString(),
        date_registered: new Date().toISOString(),
        provider: provider,
        avatar: provider === 'google' ? 'https://i.pravatar.cc/150?u=google' : undefined
      };
      
      onLogin(newUser);
      setIsSubmitting(null);
      onClose();
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting('email');
    
    setTimeout(() => {
      // 1. Check for ADMIN CREDENTIALS in MOCK_USERS (Updated for new Roles)
      const existingAdmin = MOCK_USERS.find(u => 
        u.email.toLowerCase() === formData.email.toLowerCase() && 
        u.password_hash === formData.password && 
        (u.role.startsWith('admin_') || u.role.includes('master'))
      );

      if (existingAdmin) {
        console.log("Admin detected:", existingAdmin.role);
        onLogin(existingAdmin);
        setIsSubmitting(null);
        onClose();
        return;
      }

      // 2. Regular User/Business Simulation
      const newUser: UserAccount = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.nombre || formData.email.split('@')[0],
        email: formData.email,
        password_hash: 'hashed_pass',
        role: role as any,
        status: 'active',
        last_login: new Date().toISOString(),
        date_registered: new Date().toISOString(),
        provider: 'email',
        linkedBusinessId: role === 'business_owner' ? '5' : undefined 
      };
      
      onLogin(newUser);
      setIsSubmitting(null);
      onClose();
    }, 1200);
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recoveryEmail.includes('@')) return;
    
    setRecoveryStatus('sending');
    
    setTimeout(() => {
        setRecoveryStatus('sent');
        const tempPass = Math.random().toString(36).slice(-8).toUpperCase();
        console.log(`[SIMULACIÓN EMAIL] Para: ${recoveryEmail} | Nueva Contraseña: ${tempPass}`);
        alert(`(SIMULACIÓN) Hemos enviado un correo a ${recoveryEmail}.\n\nContraseña temporal generada: ${tempPass}\n\nÚsala para acceder y cámbiala en tu perfil.`);
    }, 1500);
  };

  const handleModeSwitch = () => {
    if (mode === 'signup') {
      setMode('login');
    } else {
      if (role === 'business_owner') {
        onOpenSubscription();
      } else {
        setMode('signup');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl border border-orange-50 relative overflow-hidden flex flex-col max-h-[95vh]">
        
        {mode !== 'recovery' && (
            <div className="flex bg-gray-100 p-1.5 m-5 rounded-2xl">
            <button 
                onClick={() => setRole('user')}
                className={`flex-1 py-3 rounded-xl font-brand font-black text-[10px] tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${role === 'user' ? 'bg-white shadow-md text-orange-600' : 'text-gray-400 hover:text-gray-50'}`}
            >
                <span className="text-sm">🍰</span> SOY CLIENTE
            </button>
            <button 
                onClick={() => { setRole('business_owner'); setMode('login'); }}
                className={`flex-1 py-3 rounded-xl font-brand font-black text-[10px] tracking-[0.1em] transition-all flex items-center justify-center gap-2 ${role === 'business_owner' ? 'bg-white shadow-md text-orange-600' : 'text-gray-400 hover:text-gray-50'}`}
            >
                <span className="text-sm">🏪</span> SOY NEGOCIO
            </button>
            </div>
        )}

        <div className="px-10 pb-10 pt-2 space-y-6 overflow-y-auto scrollbar-hide">
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-brand font-black text-gray-900 uppercase italic leading-tight">
              {mode === 'login' ? 'Bienvenido a ELEMEDE' : mode === 'signup' ? 'Únete a la Élite' : 'Recuperar Acceso'}
            </h3>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">
              {mode === 'recovery' ? 'TE ENVIAREMOS UNA NUEVA CLAVE' : role === 'business_owner' ? 'PANEL DE PROPIETARIOS' : 'ACCESO PARA EXPLORADORES'}
            </p>
          </div>

          {mode === 'recovery' ? (
             <form onSubmit={handleRecoverySubmit} className="space-y-6 animate-fade-in">
                <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-center">
                    <div className="text-4xl mb-2">🔐</div>
                    <p className="text-xs text-gray-600 font-medium">Introduce tu correo electrónico. Si existe en nuestra base de datos, recibirás una <strong>contraseña temporal</strong> al instante.</p>
                </div>
                
                <div className="flex items-center gap-3 group">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400 border-2 border-transparent group-focus-within:border-orange-200 group-focus-within:text-orange-500 group-focus-within:bg-white transition-all shadow-sm">✉️</div>
                    <input 
                        required 
                        type="email" 
                        placeholder="Tu Email Registrado" 
                        className="input-field flex-1" 
                        value={recoveryEmail} 
                        onChange={e => setRecoveryEmail(e.target.value)} 
                        disabled={recoveryStatus === 'sent'}
                    />
                </div>

                {recoveryStatus === 'sent' ? (
                    <div className="space-y-4">
                        <div className="bg-green-50 text-green-700 p-4 rounded-xl text-center text-xs font-bold border border-green-200">
                            ✓ Correo enviado con éxito. Revisa tu bandeja de entrada (y spam).
                        </div>
                        <button 
                            type="button"
                            onClick={() => { setMode('login'); setRecoveryStatus('idle'); setRecoveryEmail(''); }}
                            className="w-full bg-gray-900 text-white font-brand font-black py-4.5 rounded-2xl shadow-xl hover:bg-gray-800 transition-all uppercase tracking-[0.2em] text-[10px]"
                        >
                            VOLVER A INICIAR SESIÓN
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <button 
                            disabled={recoveryStatus === 'sending'}
                            className="w-full bg-orange-600 text-white font-brand font-black py-4.5 rounded-2xl shadow-xl hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px]"
                        >
                            {recoveryStatus === 'sending' ? 'ENVIANDO...' : 'ENVIAR NUEVA CONTRASEÑA'}
                        </button>
                        <button 
                            type="button"
                            onClick={() => setMode('login')}
                            className="w-full text-gray-400 font-bold text-[10px] uppercase tracking-widest hover:text-gray-900 py-2"
                        >
                            Cancelar
                        </button>
                    </div>
                )}
             </form>
          ) : (
            <>
                {role === 'user' && (
                    <div className="space-y-3">
                    <button 
                        type="button"
                        onClick={() => handleSocialLogin('google')}
                        disabled={!!isSubmitting}
                        className="w-full flex items-center justify-center gap-4 bg-white border border-gray-200 py-3.5 rounded-2xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-widest">{isSubmitting === 'google' ? 'Cargando...' : 'Entrar con Google'}</span>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                        type="button"
                        onClick={() => handleSocialLogin('facebook')}
                        disabled={!!isSubmitting}
                        className="flex items-center justify-center gap-2 bg-[#1877F2] text-white py-3.5 rounded-2xl hover:bg-[#1565C0] transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Facebook</span>
                        </button>
                        <button 
                        type="button"
                        onClick={() => handleSocialLogin('apple')}
                        disabled={!!isSubmitting}
                        className="flex items-center justify-center gap-2 bg-gray-900 text-white py-3.5 rounded-2xl hover:bg-black transition-all shadow-md active:scale-95 disabled:opacity-50"
                        >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.066 10.281c-.027-2.341 1.916-3.465 2.001-3.515-1.082-1.583-2.766-1.799-3.366-1.821-1.432-.146-2.792.842-3.518.842-.725 0-1.861-.822-3.068-.801-1.583.022-3.047.923-3.861 2.339-1.643 2.853-.421 7.075 1.173 9.382.782 1.129 1.71 2.396 2.928 2.352 1.173-.046 1.616-.757 3.033-.757 1.417 0 1.815.757 3.056.732 1.265-.022 2.064-1.15 2.841-2.285.898-1.313 1.268-2.585 1.286-2.651-.027-.012-2.467-.946-2.492-3.76zM14.562 3.862c.642-.777 1.074-1.857.956-2.937-.928.037-2.05.617-2.716 1.393-.598.689-1.121 1.794-1.121 1.794s1.149.123 2.881-.25z"/></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Apple</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-4 py-2">
                        <div className="h-px flex-1 bg-gray-100"></div>
                        <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">O con email</span>
                        <div className="h-px flex-1 bg-gray-100"></div>
                    </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'signup' && (
                    <div className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400 border-2 border-transparent group-focus-within:border-orange-200 group-focus-within:text-orange-500 group-focus-within:bg-white transition-all shadow-sm">👤</div>
                        <input required placeholder="Nombre Completo" className="input-field flex-1" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    )}
                    <div className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400 border-2 border-transparent group-focus-within:border-orange-200 group-focus-within:text-orange-500 group-focus-within:bg-white transition-all shadow-sm">✉️</div>
                        <input required type="email" placeholder="Email" className="input-field flex-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    <div className="flex items-center gap-3 group">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-xl text-gray-400 border-2 border-transparent group-focus-within:border-orange-200 group-focus-within:text-orange-500 group-focus-within:bg-white transition-all shadow-sm">🔒</div>
                        <input required type="password" placeholder="Contraseña" className="input-field flex-1" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                    </div>

                    <button 
                        disabled={!!isSubmitting}
                        className="w-full bg-orange-600 text-white font-brand font-black py-4.5 rounded-2xl shadow-xl hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-[0.2em] text-[10px] mt-4"
                    >
                        {isSubmitting === 'email' ? 'PROCESANDO...' : mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
                    </button>
                </form>

                {mode === 'login' && (
                    <div className="text-center mt-4">
                        <button onClick={() => setMode('recovery')} className="text-[10px] font-bold text-gray-400 hover:text-orange-600 transition-colors uppercase tracking-wider">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                )}

                <div className="text-center pt-2">
                    <button onClick={handleModeSwitch} className="text-[10px] font-black text-gray-500 hover:text-gray-900 uppercase tracking-widest transition-colors">
                        {mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Entra'}
                    </button>
                </div>
            </>
          )}
        </div>
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
      <style>{`
        .input-field {
            width: 100%;
            background: #f9fafb;
            border: 2px solid #f3f4f6;
            border-radius: 1rem;
            padding: 1rem;
            font-weight: 700;
            font-size: 0.875rem;
            outline: none;
            transition: all 0.2s;
        }
        .input-field:focus {
            background: white;
            border-color: #fb923c;
            box-shadow: 0 0 0 4px rgba(251, 146, 60, 0.1);
        }
      `}</style>
    </div>
  );
};
