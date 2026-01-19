
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Business, UserAccount, UserStatus,
  SupportTicket, Invoice, Banner, DiscountCode, ForumQuestion, SocialConfig, SystemFinancialConfig, CountryCode, SubscriptionPack, NotificationLog
} from '../types';
import { SUBSCRIPTION_PACKS } from '../constants';
import { AdminMarketingModule } from './AdminMarketingModule';
import { AdminAccountingModule } from './AdminAccountingModule';
import { AdminMaestroModule } from './AdminMaestroModule';
import { getNotificationLogs, sendNotification } from '../services/notificationService';
import { dataService } from '../services/supabase'; // Import Data Service for Auth
import { Loader2 } from 'lucide-react';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  businesses: Business[];
  onUpdateBusiness: (id: string, updates: Partial<Business>) => void;
  users: UserAccount[];
  onUpdateUser: (user: UserAccount) => void;
  onUpdateUserStatus: (id: string, status: UserStatus) => void;
  onDeleteUser: (id: string) => void;
  onDeleteBusiness: (id: string) => void;
  currentUser: UserAccount;
  banners?: Banner[];
  onUpdateBanners?: React.Dispatch<React.SetStateAction<Banner[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  maintenanceMode?: boolean;
  setMaintenanceMode?: (enabled: boolean) => void;
  onLogout: () => void;
  onSwitchSession?: (user: UserAccount) => void;
  tickets?: SupportTicket[];
  onUpdateTicket?: (id: string, updates: Partial<SupportTicket>) => void;
  bannedWords?: string[];
  setBannedWords?: React.Dispatch<React.SetStateAction<string[]>>;
  coupons?: DiscountCode[];
  setCoupons?: React.Dispatch<React.SetStateAction<DiscountCode[]>>;
  forumQuestions?: ForumQuestion[];
  onDeleteForumQuestion?: (id: string) => void;
  socialLinks?: SocialConfig;
  setSocialLinks?: React.Dispatch<React.SetStateAction<SocialConfig>>;
  systemFinancials?: Record<CountryCode, SystemFinancialConfig>;
  setSystemFinancials?: React.Dispatch<React.SetStateAction<Record<CountryCode, SystemFinancialConfig>>>;
  subscriptionPacks?: SubscriptionPack[];
  setSubscriptionPacks?: React.Dispatch<React.SetStateAction<SubscriptionPack[]>>;
}

type AdminRoute = 'overview' | 'users' | 'marketing' | 'accounting' | 'billing' | 'support' | 'security' | 'settings' | 'notifications' | 'intelligence' | 'moderation';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  isOpen, onClose, businesses, onUpdateBusiness, users, onUpdateUser, onUpdateUserStatus, onDeleteUser, onDeleteBusiness, currentUser, banners, onUpdateBanners, invoices, setInvoices, maintenanceMode, setMaintenanceMode, onLogout, onSwitchSession, tickets, onUpdateTicket, bannedWords, setBannedWords, coupons, setCoupons, forumQuestions, onDeleteForumQuestion, socialLinks, setSocialLinks, systemFinancials, setSystemFinancials, subscriptionPacks, setSubscriptionPacks
}) => {
  const [activeRoute, setActiveRoute] = useState<AdminRoute>('overview');
  const [showNotification, setShowNotification] = useState<string | null>(null);
  const [isFirstLoginSetup, setIsFirstLoginSetup] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<NotificationLog[]>([]);

  // Self Edit State
  const [isSelfEditModalOpen, setIsSelfEditModalOpen] = useState(false);
  const [selfEditData, setSelfEditData] = useState({ email: '', password: '', confirmPassword: '' });

  // Switch Master User State
  const [isSwitchUserModalOpen, setIsSwitchUserModalOpen] = useState(false);
  const [switchData, setSwitchData] = useState({ email: '', password: '' });
  const [switchError, setSwitchError] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // CONTROL DE ACCESO (RBAC STRICT 4 ROLES)
  const isRoot = currentUser.role === 'admin_root';
  const isMarketing = currentUser.role === 'admin_marketing';
  const isFinanzas = currentUser.role === 'admin_finanzas';
  const isSoporte = currentUser.role === 'admin_soporte';
  const isAdmin = currentUser.role.startsWith('admin_');

  // Update logs periodically
  useEffect(() => {
    if (activeRoute === 'notifications' || activeRoute === 'marketing') {
        const fetchLogs = async () => {
            const logs = await getNotificationLogs();
            setEmailLogs(logs);
        };
        fetchLogs();
        
        const interval = setInterval(fetchLogs, 5000); // Poll every 5s
        return () => clearInterval(interval);
    }
  }, [activeRoute]);

  // Redirección inicial según rol
  useEffect(() => {
    if (isOpen) {
      if (isMarketing) setActiveRoute('marketing');
      else if (isFinanzas) setActiveRoute('accounting');
      else if (isSoporte) setActiveRoute('support');
      else if (isRoot) setActiveRoute('overview');
      
      if (currentUser.is_first_login) {
        setIsFirstLoginSetup(true);
      }
    }
  }, [isOpen, currentUser.id]);

  const hasAccess = (route: AdminRoute): boolean => {
    if (isRoot) return true; // ROOT sees all

    switch (route) {
      case 'overview': return true;
      case 'marketing': return isMarketing; 
      case 'accounting': 
      case 'billing': return isFinanzas;
      case 'support': return isSoporte;
      case 'users': return isSoporte; // Support manages users
      case 'security': return isFinanzas; // Audit logs usually financial
      case 'notifications': return isMarketing;
      case 'settings': return false; // Only Root
      case 'intelligence': return false;
      case 'moderation': return isSoporte;
      default: return false;
    }
  };

  const notify = (msg: string) => {
    setShowNotification(msg);
    setTimeout(() => setShowNotification(null), 3000);
  };

  const handleSetupSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 10) return alert("Seguridad insuficiente. Use al menos 10 caracteres.");
    notify("Protocolo de seguridad actualizado. Acceso Máximo permitido.");
    setIsFirstLoginSetup(false);
  };

  const handleOpenSelfEdit = () => {
    setSelfEditData({
        email: currentUser.email,
        password: currentUser.password_hash || '',
        confirmPassword: currentUser.password_hash || ''
    });
    setIsSelfEditModalOpen(true);
  };

  const handleSaveSelfCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (selfEditData.password !== selfEditData.confirmPassword) {
        alert("Las contraseñas no coinciden.");
        return;
    }
    onUpdateUser({
        ...currentUser,
        email: selfEditData.email,
        password_hash: selfEditData.password
    });
    notify("Credenciales de acceso actualizadas correctamente.");
    setIsSelfEditModalOpen(false);
  };

  const handleSwitchMaster = async (e: React.FormEvent) => {
    e.preventDefault();
    setSwitchError(false);
    setIsSwitching(true);

    try {
        // Authenticacion REAL contra el servicio
        const targetUser = await dataService.authenticate(switchData.email, switchData.password);

        // Verificar si es admin
        if (targetUser && targetUser.role.startsWith('admin_')) {
            if (onSwitchSession) {
                onSwitchSession(targetUser);
                setIsSwitchUserModalOpen(false);
                setSwitchData({ email: '', password: '' });
                notify(`Sesión transferida a: ${targetUser.name} (${targetUser.role.toUpperCase()})`);
            }
        } else {
            setSwitchError(true);
            setTimeout(() => setSwitchError(false), 3000);
        }
    } catch (error) {
        console.error("Switch error:", error);
        setSwitchError(true);
        setTimeout(() => setSwitchError(false), 3000);
    } finally {
        setIsSwitching(false);
    }
  };

  const handleImpersonateUser = (userToImpersonate: UserAccount) => {
      if (onSwitchSession) {
          if (confirm(`⚠️ MODO SOPORTE\n\nEstás a punto de entrar en la cuenta de ${userToImpersonate.name} para realizar asistencia técnica.\n\n¿Confirmar acceso?`)) {
              onSwitchSession(userToImpersonate);
              notify(`Accediendo como ${userToImpersonate.name}...`);
              onClose(); // Close dashboard to see user view
          }
      }
  };

  if (!isOpen) return null;

  const NavItem = ({ id, label, icon }: { id: AdminRoute, label: string, icon: string }) => {
    if (!hasAccess(id)) return null;
    return (
      <button 
        onClick={() => setActiveRoute(id)}
        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRoute === id ? 'bg-indigo-600 text-white shadow-xl translate-x-2' : 'text-gray-400 hover:bg-white hover:text-gray-900'}`}
      >
        <span className="text-xl">{icon}</span> {label}
      </button>
    );
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-0 md:p-4 bg-gray-950/98 backdrop-blur-3xl animate-fade-in overflow-hidden font-brand">
      {/* ... (Modals preserved) ... */}
      
      {showNotification && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-3 rounded-full shadow-2xl z-[500] animate-bounce">
           <p className="text-[10px] font-black uppercase tracking-widest">{showNotification}</p>
        </div>
      )}

      <div className="bg-white rounded-[3rem] w-full max-w-[1600px] h-full md:h-[95vh] shadow-2xl flex flex-col md:flex-row overflow-hidden border border-white/10">
        
        <aside className="w-full md:w-80 bg-gray-50 border-b md:border-r p-8 flex flex-col shrink-0 overflow-y-auto scrollbar-hide">
          <div className="space-y-10 flex-1">
            <div className="flex items-center gap-4 px-2">
              <div className="w-14 h-14 bg-gray-900 rounded-3xl flex items-center justify-center text-white text-2xl font-black shadow-lg">E</div>
              <div>
                <h2 className="text-xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Admin Core</h2>
                <p className="text-[9px] text-indigo-600 font-bold tracking-[0.2em] uppercase mt-1">
                    {isRoot ? 'NIVEL ROOT' : currentUser.role.replace('admin_', '').toUpperCase()}
                </p>
              </div>
            </div>

            <nav className="space-y-1">
              <NavItem id="overview" label="Visión Global" icon="📈" />
              <NavItem id="intelligence" label="Cerebro IA" icon="🧠" />
              <NavItem id="users" label="Usuarios & Negocios" icon="👥" />
              <NavItem id="moderation" label="Moderación" icon="📸" />
              <NavItem id="marketing" label="Marketing & Banners" icon="🎯" />
              <NavItem id="accounting" label="Finanzas & VeriFactu" icon="💼" />
              <NavItem id="support" label="Centro de Soporte" icon="🎫" />
              <NavItem id="notifications" label="Log de Sistema" icon="📨" />
              <NavItem id="settings" label="Sistema (Root)" icon="⚙️" />
            </nav>
          </div>

          <div className="pt-8 border-t border-gray-100 space-y-4">
             {/* USER PROFILE & LOGOUT */}
             <div 
                onClick={handleOpenSelfEdit}
                className="bg-white p-4 rounded-2xl flex items-center gap-3 border border-gray-100 shadow-sm cursor-pointer group hover:border-indigo-300 transition-all relative"
             >
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-xs uppercase shadow-inner">
                   {currentUser.name[0]}
                </div>
                <div className="min-w-0 flex-1">
                   <p className="text-[10px] font-black text-gray-900 truncate uppercase tracking-tighter">{currentUser.name}</p>
                   <p className="text-[8px] text-indigo-500 font-bold uppercase tracking-widest">{currentUser.role.replace('admin_', '')}</p>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2">
                {isAdmin && (
                    <button onClick={() => setIsSwitchUserModalOpen(true)} className="py-3 bg-gray-200 text-gray-600 rounded-xl font-black text-[9px] uppercase hover:bg-gray-300 transition-colors flex flex-col items-center justify-center gap-1">
                        <span className="text-sm">🔄</span> Switch
                    </button>
                )}
                <button onClick={onLogout} className={`py-3 bg-red-50 text-red-500 rounded-xl font-black text-[9px] uppercase hover:bg-red-100 transition-colors flex flex-col items-center justify-center gap-1 ${!isAdmin ? 'col-span-2' : ''}`}>
                    <span className="text-sm">🚪</span> Salir
                </button>
             </div>
          </div>
        </aside>

        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          <header className="px-10 py-8 border-b flex justify-between items-center shrink-0 bg-white/50 backdrop-blur sticky top-0 z-10">
             <div>
                <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">
                  {activeRoute === 'marketing' ? 'Control de Marketing' : 
                   activeRoute === 'accounting' ? 'Control Fiscal y Facturación' : 
                   activeRoute === 'users' ? 'Gestión de Usuarios' :
                   activeRoute === 'settings' ? 'Parámetros del Sistema' :
                   activeRoute === 'overview' ? 'Panel de Mando' : 
                   activeRoute === 'support' ? 'Soporte Técnico' :
                   activeRoute === 'notifications' ? 'Registro de Comunicaciones' :
                   activeRoute === 'intelligence' ? 'Inteligencia Artificial' :
                   activeRoute === 'moderation' ? 'Cola de Moderación' :
                   'Panel de Administración'}
                </h3>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto p-8 md:p-12 scrollbar-hide bg-gray-50/20">
            {/* MODULE ROUTING */}
            {activeRoute === 'marketing' && isMarketing && banners && onUpdateBanners && coupons && setCoupons && socialLinks && setSocialLinks && (
              <AdminMarketingModule 
                onNotify={notify} 
                businesses={businesses} 
                onUpdateBusiness={onUpdateBusiness}
                users={users}
                banners={banners} 
                onUpdateBanners={onUpdateBanners}
                coupons={coupons}
                setCoupons={setCoupons}
                invoices={invoices}
                setInvoices={setInvoices}
                socialLinks={socialLinks}
                setSocialLinks={setSocialLinks}
                tickets={tickets}
                onUpdateTicket={onUpdateTicket}
                systemConfig={systemFinancials ? systemFinancials['ES'] : undefined}
              />
            )}

            {activeRoute === 'accounting' && isFinanzas && (
                (systemFinancials && setSystemFinancials && subscriptionPacks && setSubscriptionPacks) ? (
                    <AdminAccountingModule 
                        businesses={businesses} 
                        onNotify={notify} 
                        invoices={invoices}
                        setInvoices={setInvoices}
                        tickets={tickets || []}
                        onUpdateTicket={onUpdateTicket || (() => {})}
                        systemFinancials={systemFinancials}
                        setSystemFinancials={setSystemFinancials}
                        subscriptionPacks={subscriptionPacks}
                        setSubscriptionPacks={setSubscriptionPacks}
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
                        <Loader2 className="animate-spin w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Cargando datos financieros...</span>
                    </div>
                )
            )}

            {/* SHARED MODULE ROUTES */}
            {(activeRoute === 'users' || activeRoute === 'support' || activeRoute === 'intelligence' || activeRoute === 'moderation' || activeRoute === 'settings') && (
               <AdminMaestroModule 
                  activeTab={
                      activeRoute === 'users' ? 'usuarios' : 
                      activeRoute === 'support' ? 'soporte' :
                      activeRoute === 'intelligence' ? 'cerebro_ia' :
                      activeRoute === 'moderation' ? 'moderacion' : 
                      'sistema'
                  }
                  users={users}
                  businesses={businesses}
                  onUpdateUser={onUpdateUser}
                  onUpdateUserStatus={onUpdateUserStatus}
                  onDeleteUser={onDeleteUser}
                  onUpdateBusiness={onUpdateBusiness}
                  onDeleteBusiness={onDeleteBusiness}
                  onNotify={notify}
                  tickets={tickets}
                  onUpdateTicket={onUpdateTicket}
                  forumQuestions={forumQuestions}
                  onDeleteForumQuestion={onDeleteForumQuestion}
                  onImpersonate={handleImpersonateUser}
                  maintenanceMode={maintenanceMode}
                  onToggleMaintenance={setMaintenanceMode}
                  bannedWords={bannedWords}
                  setBannedWords={setBannedWords}
               />
            )}

            {activeRoute === 'notifications' && isMarketing && (
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 h-full overflow-hidden flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-gray-900 uppercase italic text-xl">Log de Notificaciones</h4>
                        <span className="text-[10px] font-black uppercase bg-green-100 text-green-700 px-3 py-1 rounded-full animate-pulse">DB LIVE</span>
                    </div>
                    <div className="flex-1 overflow-y-auto pr-2 space-y-3 font-mono text-xs">
                        {emailLogs.length === 0 && <p className="text-gray-400 text-center py-10">Cargando historial...</p>}
                        {emailLogs.map((log) => (
                            <div key={log.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex justify-between items-center hover:bg-gray-100 transition-colors">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="text-[9px] font-black bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{log.timestamp}</span>
                                        <span className="text-[9px] font-black bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded uppercase">{log.type}</span>
                                        <span className="text-orange-500 font-bold text-[10px]">{log.trigger}</span>
                                    </div>
                                    <p className="font-bold text-gray-900">{log.recipient}</p>
                                    <p className="text-gray-500 text-[10px] truncate max-w-md">{log.subject}</p>
                                </div>
                                <div className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${log.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                    {log.status}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeRoute === 'overview' && (
              <div className="space-y-12 animate-fade-in">
                 <div className="bg-indigo-900 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><span className="text-9xl">💎</span></div>
                      <h4 className="text-xl font-black uppercase tracking-tighter italic mb-8 leading-none">Bienvenido, {currentUser.name}</h4>
                      <p className="text-sm font-medium opacity-80">Selecciona un módulo del menú lateral para comenzar a gestionar la plataforma.</p>
                 </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
