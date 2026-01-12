
import React, { useState, useMemo, useEffect } from 'react';
import { UserAccount, Business, UserStatus, UserRole, SubscriptionPackType, SupportTicket, CountryCode, ForumQuestion, SystemFinancialConfig, GovernanceRule, AutoPilotConfig, SecurityLog } from '../types';
import { SECTORS, SUBSCRIPTION_PACKS, COUNTRIES_DB, INITIAL_SYSTEM_FINANCIALS } from '../constants';
import { Activity, Shield, Zap, TrendingUp, AlertTriangle, Users, Settings, Database, MessageCircle, BarChart3, Lock, Wifi, Server, Mail, Brain, HardDrive, RefreshCw, Eye, Camera, Check, X, Edit, Globe, Link, RefreshCcw } from 'lucide-react';

interface AdminMaestroModuleProps {
  activeTab: 'usuarios' | 'negocios' | 'sistema' | 'soporte' | 'base_datos' | 'cerebro_ia' | 'moderacion';
  users: UserAccount[];
  businesses: Business[];
  onUpdateUser: (user: UserAccount) => void;
  onUpdateUserStatus: (id: string, status: UserStatus) => void;
  onDeleteUser: (id: string) => void;
  onUpdateBusiness: (id: string, updates: Partial<Business>) => void;
  onDeleteBusiness: (id: string) => void;
  onNotify: (msg: string) => void;
  bannedWords?: string[];
  setBannedWords?: React.Dispatch<React.SetStateAction<string[]>>;
  maintenanceMode?: boolean;
  onToggleMaintenance?: (enabled: boolean) => void;
  tickets?: SupportTicket[];
  onUpdateTicket?: (id: string, updates: Partial<SupportTicket>) => void;
  forumQuestions?: ForumQuestion[];
  onDeleteForumQuestion?: (id: string) => void;
  onImpersonate?: (user: UserAccount) => void; 
}

// ... (MOCK_SYSTEM_LOGS remains same)
const MOCK_SYSTEM_LOGS = [
    { time: '10:42:01', type: 'info', msg: '[AUTO-SCALE] Tráfico estable en Madrid. Nodos: 3.' },
    { time: '10:42:15', type: 'success', msg: '[GOVERNANCE] Regla #3 activada: Boost aplicado a 12 negocios.' },
    { time: '10:43:05', type: 'warning', msg: '[DENSITY] Zona Barcelona Centro saturada (85%). Pausando nuevos registros basic.' },
    { time: '10:44:20', type: 'info', msg: '[SEO-BOT] 45 landings generadas automáticamente para "Tartas Veganas".' },
    { time: '10:45:00', type: 'success', msg: '[BILLING] Ciclo de facturación automático completado sin errores.' }
];

export const AdminMaestroModule: React.FC<AdminMaestroModuleProps> = ({
  activeTab: initialTab,
  users,
  businesses,
  onUpdateUser,
  onUpdateUserStatus,
  onDeleteUser,
  onUpdateBusiness,
  onDeleteBusiness,
  onNotify,
  bannedWords = [],
  setBannedWords,
  maintenanceMode = false,
  onToggleMaintenance,
  tickets = [],
  onUpdateTicket,
  forumQuestions = [],
  onDeleteForumQuestion,
  onImpersonate
}) => {
  const [internalTab, setInternalTab] = useState(initialTab as any);
  
  useEffect(() => { setInternalTab(initialTab as any); }, [initialTab]);

  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [newBannedWord, setNewBannedWord] = useState('');
  const [selectedCountryConfig, setSelectedCountryConfig] = useState<CountryCode>('ES');
  const [serverConfig, setServerConfig] = useState({ domain: 'elemede.com', serverIp: '192.168.1.100', status: 'online' });
  
  // AI BRAIN STATE
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiAnalysisLogs, setAiAnalysisLogs] = useState<{timestamp: string, category: string, detail: string, status: 'success' | 'warning' | 'alert'}[]>([]);

  // MOCK MODERATION QUEUE (Simulating pending images)
  const moderationQueue = useMemo(() => {
      return businesses.slice(0, 3).map((b, idx) => ({
          id: `mod_${b.id}`,
          businessId: b.id,
          businessName: b.name,
          imageUrl: b.mainImage,
          uploadedAt: new Date().toISOString(),
          riskScore: idx * 25 // 0, 25, 50
      }));
  }, [businesses]);

  const [localModerationQueue, setLocalModerationQueue] = useState(moderationQueue);

  // --- LOGIC HELPERS ---
  const handleAddBannedWord = () => {
      if (newBannedWord && !bannedWords.includes(newBannedWord) && setBannedWords) {
          setBannedWords(prev => [...prev, newBannedWord]);
          setNewBannedWord('');
          onNotify(`Palabra "${newBannedWord}" añadida a la lista negra.`);
      }
  };

  const handleRemoveBannedWord = (word: string) => {
      if (setBannedWords) {
          setBannedWords(prev => prev.filter(w => w !== word));
          onNotify(`Palabra "${word}" eliminada de la lista negra.`);
      }
  };

  const runMaestroCycle = () => {
      setIsProcessingAI(true);
      setAiAnalysisLogs([]); 
      setTimeout(() => {
          setIsProcessingAI(false);
          onNotify("Ciclo Maestro Completado.");
      }, 1500);
  };

  // --- FILTERS & MEMOS ---
  const filteredUsers = useMemo(() => {
    return users.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [users, searchTerm]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter(b => {
        const matchesSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) || b.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesSector = selectedSectorFilter === 'all' || b.sectorId === selectedSectorFilter;
        return matchesSearch && matchesSector;
    });
  }, [businesses, searchTerm, selectedSectorFilter]);

  // --- HANDLERS ---
  const handleSaveUser = () => {
    if (editingUser) {
        onUpdateUser(editingUser);
        setEditingUser(null);
        onNotify(`Usuario ${editingUser.name} actualizado.`);
    }
  };

  const handleStrikeUser = (user: UserAccount) => {
      const newStrikes = (user.strikes || 0) + 1;
      const updates: Partial<UserAccount> = { strikes: newStrikes };
      
      if (newStrikes >= 3) {
          updates.status = 'banned';
          onNotify(`Usuario ${user.name} baneado automáticamente por acumulación de strikes.`);
      } else {
          onNotify(`Strike aplicado a ${user.name}. Total: ${newStrikes}/3`);
      }
      
      onUpdateUser({ ...user, ...updates });
  };

  const handleSaveBusiness = () => {
      if (editingBusiness) {
          onUpdateBusiness(editingBusiness.id, editingBusiness);
          setEditingBusiness(null);
          onNotify(`Negocio ${editingBusiness.name} actualizado correctamente.`);
      }
  };

  const handleRestartServers = () => {
      if (confirm("¿Reiniciar instancias de servidores?")) {
          onNotify("Iniciando secuencia...");
          setTimeout(() => onNotify("Servidores reiniciados."), 3000);
      }
  };

  // MODERATION HANDLERS
  const handleApproveImage = (id: string) => {
      setLocalModerationQueue(prev => prev.filter(item => item.id !== id));
      onNotify("Imagen aprobada y publicada.");
  };

  const handleRejectImage = (item: any) => {
      setLocalModerationQueue(prev => prev.filter(i => i.id !== item.id));
      // Apply Strike to Business User logic would go here
      onNotify("Imagen rechazada y eliminada de la cola.");
  };

  const handleResolveTicket = (id: string) => {
      if (onUpdateTicket) {
          onUpdateTicket(id, { status: 'resolved' });
          onNotify("Ticket resuelto y archivado. Usuario notificado.");
      }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* TABS HEADER */}
      <div className="flex bg-white p-2 rounded-3xl shadow-sm w-fit border-2 border-gray-50 mb-6 flex-wrap gap-2">
        {[
            { id: 'cerebro_ia', label: 'Cerebro IA', icon: <Brain size={16} /> },
            { id: 'moderacion', label: 'Moderación', icon: <Camera size={16} /> },
            { id: 'usuarios', label: 'Usuarios', icon: <Users size={16} /> },
            { id: 'negocios', label: 'Negocios', icon: <Activity size={16} /> },
            { id: 'soporte', label: 'Soporte Activo', icon: <MessageCircle size={16} /> },
            { id: 'sistema', label: 'Config Sistema', icon: <Settings size={16} /> }
        ].map(tab => (
          <button 
            key={tab.id} 
            onClick={() => setInternalTab(tab.id as any)} 
            className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${internalTab === tab.id ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- CEREBRO IA (MAESTRO CORE) --- */}
      {internalTab === 'cerebro_ia' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* SYSTEM HEALTH & LOGS */}
              <div className="lg:col-span-2 space-y-8">
                  <div className="bg-gray-950 text-white p-8 rounded-[3rem] shadow-2xl border-4 border-gray-800 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={120} /></div>
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                              <h3 className="text-2xl font-brand font-black uppercase italic tracking-tighter flex items-center gap-3">
                                  <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
                                  Núcleo Maestro
                              </h3>
                              <button 
                                onClick={runMaestroCycle}
                                disabled={isProcessingAI}
                                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-white/20 flex items-center gap-2 disabled:opacity-50"
                              >
                                {isProcessingAI ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '▶ Ejecutar Ciclo'}
                              </button>
                          </div>
                          
                          {/* AI OUTPUT TERMINAL */}
                          <div className="bg-black/50 rounded-2xl p-6 font-mono text-[10px] h-64 overflow-y-auto border border-white/10 space-y-3 scrollbar-hide">
                              {aiAnalysisLogs.length === 0 && !isProcessingAI && (
                                  <div className="text-gray-600 text-center py-10">Esperando ejecución manual...</div>
                              )}
                              {isProcessingAI && (
                                  <div className="text-indigo-400 animate-pulse">Analizando vectores de datos...</div>
                              )}
                              {aiAnalysisLogs.map((log, i) => (
                                  <div key={i} className="flex gap-4 border-b border-white/5 pb-2">
                                      <span className="text-gray-500 w-16 shrink-0">{log.timestamp}</span>
                                      <span className={`w-24 shrink-0 font-bold ${log.status === 'alert' ? 'text-red-500' : log.status === 'warning' ? 'text-yellow-500' : 'text-blue-400'}`}>
                                          [{log.category}]
                                      </span>
                                      <span className="text-gray-300">{log.detail}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  {/* ZONE CONTROL */}
                  <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-lg">
                      <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Gestión de Zonas (Saturación)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {['Madrid Centro', 'Barcelona Norte', 'Valencia Costa'].map(zone => (
                              <div key={zone} className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="font-bold text-xs">{zone}</span>
                                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                  </div>
                                  <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
                                      <div className="bg-indigo-500 h-full w-[45%]"></div>
                                  </div>
                                  <p className="text-[9px] text-gray-400 mt-2 font-bold uppercase">Densidad: Baja</p>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- MODERATION QUEUE (TEXT & IMAGES) --- */}
      {internalTab === 'moderacion' && (
          <div className="space-y-8">
              {/* BANNED WORDS */}
              <div className="bg-white p-8 rounded-[3rem] border border-red-50 shadow-sm">
                  <h4 className="font-black text-gray-900 uppercase italic mb-6 flex items-center gap-2">
                      <Shield className="text-red-500" /> Control de Lenguaje
                  </h4>
                  <div className="flex gap-4 mb-6">
                      <input 
                          value={newBannedWord}
                          onChange={(e) => setNewBannedWord(e.target.value)}
                          className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                          placeholder="Añadir palabra prohibida..."
                          onKeyDown={(e) => e.key === 'Enter' && handleAddBannedWord()}
                      />
                      <button onClick={handleAddBannedWord} className="bg-red-500 text-white px-6 rounded-xl font-black text-xs uppercase hover:bg-red-600 transition-colors">Bloquear</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                      {bannedWords.map((word, i) => (
                          <span key={i} className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 border border-red-100">
                              {word}
                              <button onClick={() => handleRemoveBannedWord(word)} className="hover:text-red-800">×</button>
                          </span>
                      ))}
                      {bannedWords.length === 0 && <span className="text-gray-400 text-xs italic">No hay palabras bloqueadas.</span>}
                  </div>
              </div>

              {/* IMAGE QUEUE */}
              <div className="space-y-6">
                  <div className="flex justify-between items-center px-2">
                      <h3 className="text-xl font-black text-gray-900 uppercase italic">Cola de Imágenes</h3>
                      <span className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase">{localModerationQueue.length} Pendientes</span>
                  </div>

                  {localModerationQueue.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200 text-gray-400 font-bold uppercase text-xs">
                          <span className="text-4xl block mb-4">✨</span>
                          Todo limpio. No hay contenido visual pendiente.
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {localModerationQueue.map(item => (
                              <div key={item.id} className="bg-white p-4 rounded-[2rem] shadow-lg border border-gray-100 group relative">
                                  <div className="relative aspect-video rounded-2xl overflow-hidden mb-4 bg-gray-100">
                                      <img src={item.imageUrl} className="w-full h-full object-cover" />
                                      <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase">
                                          Risk: {item.riskScore}%
                                      </div>
                                  </div>
                                  <div className="flex justify-between items-end">
                                      <div>
                                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Negocio</p>
                                          <p className="font-bold text-sm text-gray-900">{item.businessName}</p>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => handleRejectImage(item)} className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors shadow-sm" title="Eliminar y Strike">
                                              <X size={18} />
                                          </button>
                                          <button onClick={() => handleApproveImage(item.id)} className="w-10 h-10 rounded-full bg-green-50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-colors shadow-sm">
                                              <Check size={18} />
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- SISTEMA TAB (SERVER & CONFIG) --- */}
      {internalTab === 'sistema' && (
          <div className="space-y-8">
              {/* Infrastructure Control */}
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6 flex items-center gap-2"><Server size={20} /> Infraestructura & Dominios</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dominio Principal</label>
                          <div className="flex items-center gap-2 mt-1">
                              <Globe className="text-gray-400" size={16} />
                              <input 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-xs" 
                                  value={serverConfig.domain}
                                  onChange={e => setServerConfig({...serverConfig, domain: e.target.value})}
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">IP Servidor Maestro</label>
                          <div className="flex items-center gap-2 mt-1">
                              <HardDrive className="text-gray-400" size={16} />
                              <input 
                                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-xs" 
                                  value={serverConfig.serverIp}
                                  onChange={e => setServerConfig({...serverConfig, serverIp: e.target.value})}
                              />
                          </div>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-700 transition-colors shadow-lg">Guardar Configuración de Red</button>
                  </div>
              </div>

              {/* Maintenance Control */}
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex justify-between items-center">
                  <div>
                      <h4 className="text-lg font-black text-gray-900 uppercase italic">Modo Mantenimiento</h4>
                      <p className="text-xs text-gray-500 font-bold mt-1">Bloquea el acceso a usuarios no administradores.</p>
                  </div>
                  <div className="flex items-center gap-4">
                      {maintenanceMode && <span className="text-red-500 font-black text-xs uppercase animate-pulse">ACTIVO</span>}
                      <button 
                          onClick={() => onToggleMaintenance && onToggleMaintenance(!maintenanceMode)} 
                          className={`w-14 h-8 rounded-full relative transition-colors ${maintenanceMode ? 'bg-red-500' : 'bg-gray-200'}`}
                      >
                          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-md ${maintenanceMode ? 'left-7' : 'left-1'}`}></div>
                      </button>
                  </div>
              </div>
              
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Reiniciar Servicios</h4>
                  <button onClick={handleRestartServers} className="w-full bg-gray-900 text-white px-6 py-4 rounded-2xl text-[10px] font-black uppercase hover:bg-red-600 transition-all flex justify-center items-center gap-2">
                      <RefreshCw size={16} className="animate-spin-slow" /> Reiniciar Instancias de Servidor
                  </button>
              </div>
          </div>
      )}

      {/* --- SOPORTE ACTIVO TAB --- */}
      {internalTab === 'soporte' && (
          <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tickets?.map(ticket => (
                      <div key={ticket.id} className="bg-white p-6 rounded-[2rem] border-2 border-gray-50 shadow-sm relative overflow-hidden group hover:border-indigo-100 transition-all">
                          <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl group-hover:scale-110 transition-transform">🎫</div>
                          <h5 className="font-bold text-gray-900 mb-2 leading-tight pr-8">{ticket.subject}</h5>
                          <p className="text-xs text-gray-500 mb-4 line-clamp-3 bg-gray-50 p-3 rounded-xl">{ticket.description}</p>
                          <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest">{ticket.user_name}</span>
                              {ticket.status !== 'resolved' ? (
                                  <button onClick={() => handleResolveTicket(ticket.id)} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-[9px] font-black uppercase hover:bg-green-600 hover:text-white transition-colors">
                                      Resolver
                                  </button>
                              ) : (
                                  <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase bg-gray-100 text-gray-500">Resuelto</span>
                              )}
                          </div>
                      </div>
                  ))}
                  {tickets?.length === 0 && (
                      <div className="col-span-full text-center py-20 text-gray-400 font-bold uppercase text-xs">No hay tickets de soporte activos.</div>
                  )}
              </div>
          </div>
      )}

      {/* --- NEGOCIOS TAB (AI ENHANCED + TOTAL EDIT) --- */}
      {internalTab === 'negocios' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBusinesses.map(biz => (
                  <div key={biz.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative group hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-4">
                          <h5 className="font-brand font-black text-gray-900 truncate pr-4 text-lg">{biz.name}</h5>
                          <button onClick={() => setEditingBusiness(biz)} className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors">
                              <Edit size={14} />
                          </button>
                      </div>
                      <div className="space-y-3">
                          <div className="flex justify-between text-[9px] font-black uppercase text-gray-400 mb-1">
                              <span>Reliability Score</span>
                              <span>{biz.reliabilityScore || 50}/100</span>
                          </div>
                          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${biz.reliabilityScore && biz.reliabilityScore > 80 ? 'bg-green-500' : 'bg-orange-500'}`} style={{ width: `${biz.reliabilityScore || 50}%` }}></div>
                          </div>
                          <div className="pt-2 flex flex-wrap gap-2">
                              <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-[8px] font-black uppercase">{biz.province}</span>
                              <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded text-[8px] font-black uppercase">{biz.sectorId}</span>
                          </div>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* --- USUARIOS TAB (ENHANCED WITH IMPERSONATION) --- */}
      {internalTab === 'usuarios' && (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <input 
                    placeholder="Buscar usuario..." 
                    className="bg-gray-100 px-6 py-3 rounded-2xl text-xs font-bold w-64 border border-gray-200 focus:bg-white focus:border-indigo-500 outline-none transition-all"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-[9px] font-black uppercase text-gray-400 border-b border-gray-100">
                        <tr><th className="px-6 py-4">Usuario</th><th className="px-6 py-4">Rol</th><th className="px-6 py-4">Estado</th><th className="px-6 py-4 text-right">Acciones</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredUsers.map(u => (
                            <tr key={u.id} className="hover:bg-indigo-50/10 transition-colors">
                                <td className="px-6 py-4"><p className="text-xs font-black">{u.name}</p><p className="text-[9px] text-gray-400">{u.email}</p></td>
                                <td className="px-6 py-4"><span className="bg-gray-100 px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider">{u.role}</span></td>
                                <td className="px-6 py-4"><span className={`text-[8px] font-black uppercase ${u.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>{u.status}</span></td>
                                <td className="px-6 py-4 text-right flex justify-end gap-2">
                                    {onImpersonate && !u.role.startsWith('admin') && (
                                        <button 
                                            onClick={() => onImpersonate(u)} 
                                            className="p-2 text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors shadow-sm"
                                            title="Acceder como este usuario"
                                        >
                                            <RefreshCcw size={16} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleStrikeUser(u)} 
                                        className="p-2 text-white bg-red-500 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                        title="Aplicar Strike / Banear"
                                    >
                                        ⚠️
                                    </button>
                                    <button onClick={() => setEditingUser(u)} className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">✏️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* ... (Modals remain unchanged) ... */}
      {editingUser && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-black mb-4 uppercase italic">Editar Usuario</h3>
                <div className="space-y-4">
                    <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm" value={editingUser.name} onChange={e => setEditingUser({...editingUser, name: e.target.value})} placeholder="Nombre" />
                    <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm" value={editingUser.email} onChange={e => setEditingUser({...editingUser, email: e.target.value})} placeholder="Email" />
                    <select 
                        className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm uppercase"
                        value={editingUser.status}
                        onChange={e => setEditingUser({...editingUser, status: e.target.value as any})}
                    >
                        <option value="active">Activo</option>
                        <option value="suspended">Suspendido</option>
                        <option value="banned">Baneado</option>
                    </select>
                    <button onClick={handleSaveUser} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-colors shadow-lg">Guardar Cambios</button>
                    <button onClick={() => setEditingUser(null)} className="w-full text-gray-400 py-2 text-xs uppercase hover:text-gray-600">Cancelar</button>
                </div>
            </div>
        </div>
      )}

      {editingBusiness && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto scrollbar-hide">
                  <h3 className="text-xl font-black mb-6 uppercase italic">Editar Negocio: {editingBusiness.name}</h3>
                  <div className="space-y-4">
                      <div><label className="text-[9px] font-black uppercase text-gray-400">Nombre</label><input className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBusiness.name} onChange={e => setEditingBusiness({...editingBusiness, name: e.target.value})} /></div>
                      <div><label className="text-[9px] font-black uppercase text-gray-400">NIF</label><input className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBusiness.nif} onChange={e => setEditingBusiness({...editingBusiness, nif: e.target.value})} /></div>
                      <div><label className="text-[9px] font-black uppercase text-gray-400">Teléfono</label><input className="w-full bg-gray-50 border p-3 rounded-xl font-bold" value={editingBusiness.phone} onChange={e => setEditingBusiness({...editingBusiness, phone: e.target.value})} /></div>
                      <div><label className="text-[9px] font-black uppercase text-gray-400">Plan</label>
                          <select className="w-full bg-gray-50 border p-3 rounded-xl font-bold uppercase" value={editingBusiness.packId} onChange={e => setEditingBusiness({...editingBusiness, packId: e.target.value})}>
                              {SUBSCRIPTION_PACKS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                      </div>
                      <button onClick={handleSaveBusiness} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 transition-colors shadow-lg mt-4">Actualizar Ficha</button>
                      <button onClick={() => setEditingBusiness(null)} className="w-full text-gray-400 py-2 text-xs uppercase hover:text-gray-600">Cancelar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
