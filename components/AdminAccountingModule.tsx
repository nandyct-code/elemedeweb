
import React, { useState, useMemo } from 'react';
import { Invoice, Business, SupportTicket, CountryCode, SystemFinancialConfig, AuditLog, SubscriptionPackType, SubscriptionPack } from '../types';
import { SUBSCRIPTION_PACKS, COUNTRIES_DB, SECTORS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE } from '../constants';
import { PieChart, DollarSign, Settings, Download, Search, AlertCircle, Link as LinkIcon, BarChart } from 'lucide-react';

interface AdminAccountingModuleProps {
  businesses: Business[];
  onNotify: (msg: string) => void;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  tickets: SupportTicket[];
  onUpdateTicket: (id: string, updates: Partial<SupportTicket>) => void;
  systemFinancials: Record<CountryCode, SystemFinancialConfig>;
  setSystemFinancials: React.Dispatch<React.SetStateAction<Record<CountryCode, SystemFinancialConfig>>>;
  subscriptionPacks: SubscriptionPack[];
  setSubscriptionPacks: React.Dispatch<React.SetStateAction<SubscriptionPack[]>>;
}

// MOCK AUDIT LOGS (Since we don't have a backend to persist them yet)
const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'aud_1', timestamp: '2024-03-20 10:30:00', user_id: 'adm_fin', user_name: 'CFO Finanzas', action_type: 'PLAN_CHANGE', details: 'Degradación forzosa plan Business A', previous_value: 'Gold', new_value: 'Basic', ip: '192.168.1.1' },
    { id: 'aud_2', timestamp: '2024-03-19 14:15:00', user_id: 'sys', user_name: 'System Bot', action_type: 'INVOICE_GEN', details: 'Generación remesa mensual Marzo', related_invoice_id: 'INV-BATCH-03', ip: '127.0.0.1' },
    { id: 'aud_3', timestamp: '2024-03-18 09:00:00', user_id: 'adm_root', user_name: 'Super Admin', action_type: 'ISSUER_UPDATE', details: 'Cambio de dirección fiscal emisora', ip: '80.50.10.2' },
];

export const AdminAccountingModule: React.FC<AdminAccountingModuleProps> = ({ 
  businesses, onNotify, invoices, setInvoices, tickets, onUpdateTicket, systemFinancials, setSystemFinancials, subscriptionPacks, setSubscriptionPacks
}) => {
  const [activeTab, setActiveTab] = useState<'verifactu' | 'recobro' | 'auditoria' | 'gestoria' | 'config' | 'precios'>('verifactu');
  const [currentIssuerCountry, setCurrentIssuerCountry] = useState<CountryCode>('ES');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('all');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);

  // Editable Prices State - Now uses props instead of local const
  const [localAdPrices, setLocalAdPrices] = useState({
      '1_day': BANNER_1_DAY_PRICE,
      '7_days': BANNER_7_DAYS_PRICE,
      '14_days': BANNER_14_DAYS_PRICE
  });

  // --- ANALYSIS LOGIC ---
  const sectorBreakdown = useMemo(() => {
      const breakdown: Record<string, number> = {};
      invoices.forEach(inv => {
          const biz = businesses.find(b => b.id === inv.business_id);
          const sector = biz?.sectorId || 'unknown';
          breakdown[sector] = (breakdown[sector] || 0) + inv.total_amount;
      });
      return breakdown;
  }, [invoices, businesses]);

  // --- MOCK OVERDUE INVOICES ---
  const overdueInvoices = useMemo(() => {
      const simulatedOverdue = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
      if (simulatedOverdue.length === 0) {
          return [
              { id: 'INV-ERR-001', business_id: '2', business_name: 'ELEMEDE', business_nif: '', client_name: 'Churros & Co', client_nif: 'B87654321', date: '2024-02-01', due_date: '2024-02-01', base_amount: 29, iva_rate: 21, iva_amount: 6.09, irpf_rate: 0, irpf_amount: 0, total_amount: 35.09, status: 'overdue' as const, concept: 'Suscripción Mensual (Fallo Tarjeta)', quarter: 1 },
              { id: 'INV-ERR-002', business_id: '3', business_name: 'ELEMEDE', business_nif: '', client_name: 'Sweet Dreams', client_nif: 'B11223344', date: '2024-02-15', due_date: '2024-02-15', base_amount: 89, iva_rate: 21, iva_amount: 18.69, irpf_rate: 0, irpf_amount: 0, total_amount: 107.69, status: 'overdue' as const, concept: 'Renovación Pack GOLD', quarter: 1 }
          ];
      }
      return simulatedOverdue;
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const invDate = inv.date.slice(0, 7);
      const matchesMonth = selectedMonthFilter ? invDate === selectedMonthFilter : true;
      return matchesMonth;
    });
  }, [invoices, selectedMonthFilter]);

  // --- ACTIONS ---
  const handleDownloadInvoice = (invoice: Invoice) => {
    alert(`Descargando factura ${invoice.id}...`);
  };

  const handleRetryPayment = (invoice: Invoice) => {
      onNotify(`Iniciando reintento de cobro (Stripe) para ${invoice.client_name}...`);
      setTimeout(() => {
          const log: AuditLog = {
              id: Math.random().toString(36),
              timestamp: new Date().toISOString(),
              user_id: 'adm_fin',
              user_name: 'Admin Finanzas',
              action_type: 'RETRY_PAYMENT',
              details: `Reintento cobro factura ${invoice.id} - ÉXITO`,
              related_invoice_id: invoice.id
          };
          setAuditLogs(prev => [log, ...prev]);
          onNotify("✅ Cobro exitoso. Factura marcada como pagada.");
      }, 2000);
  };

  const handleDowngradePlan = (invoice: Invoice) => {
      if (confirm(`¿Degradar el plan de ${invoice.client_name} a 'Basic' por impago? Esta acción es irreversible.`)) {
          const log: AuditLog = {
              id: Math.random().toString(36),
              timestamp: new Date().toISOString(),
              user_id: 'adm_fin',
              user_name: 'Admin Finanzas',
              action_type: 'DUNNING_DOWNGRADE',
              details: `Degradación por impago (Factura ${invoice.id})`,
              previous_value: 'Premium/Gold',
              new_value: 'Basic'
          };
          setAuditLogs(prev => [log, ...prev]);
          onNotify("⚠️ Negocio degradado y notificado.");
      }
  };

  const handleDownloadGestoriaZIP = () => {
      onNotify(`Generando paquete contable ZIP para ${selectedMonthFilter}...`);
      setTimeout(() => {
          onNotify("✅ Paquete ZIP descargado correctamente.");
      }, 1500);
  };

  const handleConnectStripe = () => {
      // Simulate OAuth flow
      onNotify("Redirigiendo a Stripe Connect...");
      setTimeout(() => {
          onNotify("✅ Cuenta Conectada Exitosamente (Modo Test)");
      }, 2000);
  };

  const handleSavePrices = () => {
      // In a real app, this would persist to backend.
      // Since subscriptionPacks state is lifted, it's already "saved" in memory for the session.
      onNotify("Precios actualizados. Enviando notificaciones automáticas a usuarios afectados...");
      setTimeout(() => {
          onNotify("✅ Cambios aplicados y comunicados.");
      }, 2000);
  };

  const updatePackPrice = (id: string, field: 'monthlyPrice' | 'annualPriceYear1', val: number) => {
      setSubscriptionPacks(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER: STATUS & CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <span className="text-9xl">⚖️</span>
        </div>
        <div className="relative z-10">
           <h2 className="text-3xl font-brand font-black uppercase tracking-tighter italic">Contabilidad Master</h2>
           <p className="text-xs text-gray-400 font-bold uppercase tracking-[0.2em] mt-2 mb-4">Sistema VeriFactu • {COUNTRIES_DB.find(c => c.code === currentIssuerCountry)?.name}</p>
           
           <div className="flex gap-2">
               {COUNTRIES_DB.map(c => (
                   <button 
                    key={c.code}
                    onClick={() => setCurrentIssuerCountry(c.code)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all ${currentIssuerCountry === c.code ? 'bg-indigo-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                   >
                       {c.flag} {c.code}
                   </button>
               ))}
           </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-white p-2 rounded-3xl shadow-sm w-full md:w-fit border-2 border-gray-50 gap-2 overflow-x-auto scrollbar-hide">
        {(['verifactu', 'recobro', 'auditoria', 'gestoria', 'config', 'precios'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* --- VERIFACTU & REPORTING --- */}
      {activeTab === 'verifactu' && (
          <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100">
                      <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Ingresos por Sector</h4>
                      <div className="space-y-4">
                          {Object.entries(sectorBreakdown).map(([sector, amount]) => (
                              <div key={sector}>
                                  <div className="flex justify-between text-xs font-bold mb-1">
                                      <span className="uppercase text-gray-500">{SECTORS.find(s => s.id === sector)?.label || sector}</span>
                                      {/* Added cast to number for amount */}
                                      <span className="text-gray-900">{(amount as number).toFixed(2)}€</span>
                                  </div>
                                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                      {/* Added cast to number for amount */}
                                      <div className="bg-indigo-500 h-full" style={{ width: `${((amount as number) / (invoices.reduce((a, b) => a + b.total_amount, 0) || 1)) * 100}%` }}></div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
                  
                  <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border border-gray-100 flex flex-col justify-center items-center text-center">
                      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mb-4">✅</div>
                      <h4 className="text-2xl font-black text-gray-900 mb-2">Sistema VeriFactu Activo</h4>
                      <p className="text-xs text-gray-500 max-w-xs">Todas las facturas generadas incluyen huella digital y se almacenan en formato inalterable conforme a la normativa vigente.</p>
                  </div>
              </div>
          </div>
      )}

      {/* --- RECOBRO (DUNNING) --- */}
      {activeTab === 'recobro' && (
          <div className="space-y-6 animate-fade-in">
              <h4 className="text-xl font-black text-gray-900 uppercase italic">Gestión de Impagos</h4>
              {overdueInvoices.length === 0 ? (
                  <div className="bg-green-50 p-12 rounded-[2rem] text-center border-2 border-green-100">
                      <p className="text-green-700 font-bold uppercase text-xs tracking-widest">No hay facturas pendientes de cobro</p>
                  </div>
              ) : (
                  <div className="grid gap-4">
                      {overdueInvoices.map(inv => (
                          <div key={inv.id} className="bg-white p-6 rounded-3xl border-l-8 border-l-red-500 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
                              <div>
                                  <p className="font-black text-gray-900 text-lg">{inv.client_name}</p>
                                  <p className="text-xs text-red-500 font-bold uppercase">{inv.concept}</p>
                                  <p className="text-[10px] text-gray-400 mt-1">Vencimiento: {inv.due_date} • Importe: {inv.total_amount}€</p>
                              </div>
                              <div className="flex gap-2">
                                  <button onClick={() => handleRetryPayment(inv)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors">Reintentar Cobro</button>
                                  <button onClick={() => handleDowngradePlan(inv)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-colors">Degradar Plan</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {/* --- AUDITORIA --- */}
      {activeTab === 'auditoria' && (
          <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm animate-fade-in">
              <div className="bg-gray-50 p-4 border-b border-gray-100 font-black text-[10px] uppercase text-gray-400 tracking-widest">
                  Registro de Actividad (Audit Log)
              </div>
              <div className="divide-y divide-gray-50">
                  {auditLogs.map(log => (
                      <div key={log.id} className="p-4 flex flex-col md:flex-row justify-between text-xs hover:bg-gray-50 transition-colors">
                          <div className="flex gap-4">
                              <span className="font-mono text-gray-400 w-32">{log.timestamp}</span>
                              <div>
                                  <span className="font-bold text-gray-900 mr-2">[{log.action_type}]</span>
                                  <span className="text-gray-600">{log.details}</span>
                              </div>
                          </div>
                          <div className="text-right mt-2 md:mt-0 text-gray-400 font-mono text-[10px]">
                              {log.user_name} • {log.ip}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- GESTORIA --- */}
      {activeTab === 'gestoria' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100 text-center animate-fade-in space-y-6">
              <div className="text-6xl mb-4">🗂️</div>
              <h4 className="text-2xl font-black text-gray-900 uppercase italic">Exportación Contable</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                  Genera un archivo ZIP con todas las facturas del mes seleccionado en PDF y un CSV resumen para importación en software contable (Sage, A3, etc).
              </p>
              
              <div className="flex justify-center gap-4 items-center">
                  <input 
                      type="month" 
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                      value={selectedMonthFilter}
                      onChange={(e) => setSelectedMonthFilter(e.target.value)}
                  />
                  <button 
                      onClick={handleDownloadGestoriaZIP}
                      className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-xl flex items-center gap-2"
                  >
                      <Download size={16} /> Descargar Paquete
                  </button>
              </div>
          </div>
      )}

      {/* --- CONFIGURACION --- */}
      {activeTab === 'config' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-gray-100">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Datos Fiscales Emisor ({currentIssuerCountry})</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Razón Social</label>
                          <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={systemFinancials[currentIssuerCountry].issuerDetails.businessName} readOnly />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">NIF / Tax ID</label>
                          <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={systemFinancials[currentIssuerCountry].issuerDetails.nif} readOnly />
                      </div>
                      <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección Fiscal</label>
                          <input className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={systemFinancials[currentIssuerCountry].issuerDetails.address} readOnly />
                      </div>
                  </div>
              </div>

              <div className="bg-indigo-50 p-8 rounded-[3rem] border border-indigo-100">
                  <div className="flex justify-between items-center mb-6">
                      <h4 className="text-lg font-black text-indigo-900 uppercase italic">Conexión Stripe</h4>
                      <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${systemFinancials[currentIssuerCountry].stripe?.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="text-[10px] font-black uppercase text-indigo-800">{systemFinancials[currentIssuerCountry].stripe?.isConnected ? 'CONECTADO' : 'DESCONECTADO'}</span>
                      </div>
                  </div>
                  {!systemFinancials[currentIssuerCountry].stripe?.isConnected && (
                      <button onClick={handleConnectStripe} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all">
                          Conectar Cuenta Stripe
                      </button>
                  )}
                  {systemFinancials[currentIssuerCountry].stripe?.isConnected && (
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-2xl">
                              <p className="text-[9px] font-black text-gray-400 uppercase">Mode</p>
                              <p className="font-bold text-indigo-900">{systemFinancials[currentIssuerCountry].stripe?.mode.toUpperCase()}</p>
                          </div>
                          <div className="bg-white p-4 rounded-2xl">
                              <p className="text-[9px] font-black text-gray-400 uppercase">Fee Plataforma</p>
                              <p className="font-bold text-indigo-900">{systemFinancials[currentIssuerCountry].stripe?.feePercentage}% + {systemFinancials[currentIssuerCountry].stripe?.fixedFee}€</p>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- PRECIOS --- */}
      {activeTab === 'precios' && (
          <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic">Gestión de Tarifas</h4>
                  <button onClick={handleSavePrices} className="bg-green-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-green-700 shadow-lg">Guardar Cambios</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPacks.map(pack => (
                      <div key={pack.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all">
                          <h5 className={`font-black uppercase tracking-widest mb-4 px-3 py-1 rounded w-fit text-[10px] ${pack.colorClass.replace('bg-', 'text-').replace('-50', '-600')} bg-gray-50`}>
                              {pack.label}
                          </h5>
                          <div className="space-y-4">
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Precio Mensual</label>
                                  <div className="flex items-center gap-2 mt-1">
                                      <input 
                                          type="number" 
                                          className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg font-bold text-sm"
                                          value={pack.monthlyPrice}
                                          onChange={(e) => updatePackPrice(pack.id, 'monthlyPrice', parseFloat(e.target.value))}
                                      />
                                      <span className="text-xs font-bold">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Precio Anual</label>
                                  <div className="flex items-center gap-2 mt-1">
                                      <input 
                                          type="number" 
                                          className="w-full bg-gray-50 border border-gray-200 p-2 rounded-lg font-bold text-sm"
                                          value={pack.annualPriceYear1}
                                          onChange={(e) => updatePackPrice(pack.id, 'annualPriceYear1', parseFloat(e.target.value))}
                                      />
                                      <span className="text-xs font-bold">€</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm">
                  <h5 className="font-black text-gray-900 uppercase italic mb-6">Precios Publicidad (Banners)</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(localAdPrices).map(([key, val]) => (
                          <div key={key}>
                              <label className="text-[9px] font-black text-gray-400 uppercase">{key.replace('_', ' ')}</label>
                              <div className="flex items-center gap-2 mt-1">
                                  <input 
                                      type="number" 
                                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm"
                                      value={val}
                                      onChange={(e) => setLocalAdPrices({...localAdPrices, [key]: parseFloat(e.target.value)})}
                                  />
                                  <span className="text-xs font-bold">€</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};
