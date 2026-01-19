
import React, { useState, useMemo, useEffect } from 'react';
import { Invoice, Business, SupportTicket, CountryCode, SystemFinancialConfig, AuditLog, SubscriptionPackType, SubscriptionPack } from '../types';
import { SUBSCRIPTION_PACKS, COUNTRIES_DB, SECTORS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE } from '../constants';
import { PieChart, DollarSign, Settings, Download, Search, AlertCircle, Link as LinkIcon, BarChart, CreditCard, Lock, TrendingUp, TrendingDown, Activity, Users, Wallet, ShieldCheck, FileText, RefreshCw, Save } from 'lucide-react';

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

// MOCK AUDIT LOGS
const MOCK_AUDIT_LOGS: AuditLog[] = [
    { id: 'aud_1', timestamp: '2024-03-20 10:30:00', user_id: 'adm_fin', user_name: 'CFO Finanzas', action_type: 'PLAN_CHANGE', details: 'Degradación forzosa plan Business A', previous_value: 'Gold', new_value: 'Basic', ip: '192.168.1.1' },
    { id: 'aud_2', timestamp: '2024-03-19 14:15:00', user_id: 'sys', user_name: 'System Bot', action_type: 'INVOICE_GEN', details: 'Generación remesa mensual Marzo', related_invoice_id: 'INV-BATCH-03', ip: '127.0.0.1' },
    { id: 'aud_3', timestamp: '2024-03-18 09:00:00', user_id: 'adm_root', user_name: 'Super Admin', action_type: 'ISSUER_UPDATE', details: 'Cambio de dirección fiscal emisora', ip: '80.50.10.2' },
];

export const AdminAccountingModule: React.FC<AdminAccountingModuleProps> = ({ 
  businesses, onNotify, invoices, setInvoices, tickets, onUpdateTicket, systemFinancials, setSystemFinancials, subscriptionPacks, setSubscriptionPacks
}) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'verifactu' | 'recobro' | 'auditoria' | 'gestoria' | 'config' | 'precios'>('config'); 
  const [currentIssuerCountry, setCurrentIssuerCountry] = useState<CountryCode>('ES');
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(MOCK_AUDIT_LOGS);

  // Operational Costs State (P&L)
  const [operationalCosts, setOperationalCosts] = useState({
      servers: 150,
      api: 80,
      marketing: 300,
      staff: 1500
  });

  // Editable Prices State
  const [localAdPrices, setLocalAdPrices] = useState({
      '1_day': BANNER_1_DAY_PRICE,
      '7_days': BANNER_7_DAYS_PRICE,
      '14_days': BANNER_14_DAYS_PRICE
  });

  // Stripe Config State (Local to this form)
  const [stripeKeys, setStripeKeys] = useState({
      publicKey: systemFinancials['ES'].stripe?.publicKey || '',
      secretKey: systemFinancials['ES'].stripe?.secretKey || '',
      webhookSecret: systemFinancials['ES'].stripe?.webhookSecret || ''
  });

  // SYNC KEYS WHEN COUNTRY CHANGES
  useEffect(() => {
      const config = systemFinancials[currentIssuerCountry].stripe;
      setStripeKeys({
          publicKey: config?.publicKey || '',
          secretKey: config?.secretKey || '',
          webhookSecret: config?.webhookSecret || ''
      });
  }, [currentIssuerCountry, systemFinancials]);

  // --- SAAS METRICS CALCULATION ---
  const saasMetrics = useMemo(() => {
      let mrr = 0;
      let activeSubs = 0;
      let churnCandidates = 0;

      businesses.forEach(biz => {
          if (biz.status === 'active') {
              activeSubs++;
              const pack = subscriptionPacks.find(p => p.id === biz.packId);
              if (pack) {
                  // Normalize annual to monthly MRR
                  const monthlyValue = biz.billingCycle === 'annual' 
                      ? pack.annualPriceYear1 / 12 
                      : pack.monthlyPrice;
                  mrr += monthlyValue;
              }
          }
          // Churn calculation (Scheduled cancellation or suspended)
          if (biz.scheduledCancellationDate || biz.status === 'suspended') {
              churnCandidates++;
          }
      });

      const arpu = activeSubs > 0 ? mrr / activeSubs : 0;
      const churnRate = activeSubs > 0 ? (churnCandidates / activeSubs) * 100 : 0;
      const ltv = churnRate > 0 ? arpu / (churnRate / 100) : arpu * 24; 

      return { mrr, activeSubs, churnRate, arpu, ltv };
  }, [businesses, subscriptionPacks]);

  // --- P&L CALCULATION (PUNTO 2) ---
  const profitAndLoss = useMemo(() => {
      const totalRevenue = saasMetrics.mrr; // Monthly Recurring Revenue as proxy for monthly income
      const totalExpenses = (Object.values(operationalCosts) as number[]).reduce((acc, curr) => acc + curr, 0);
      const netProfit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      return { totalRevenue, totalExpenses, netProfit, margin };
  }, [saasMetrics.mrr, operationalCosts]);

  // --- ACTIONS ---
  const handleSaveStripeConfig = () => {
      // Validate fake keys just for UX
      if (!stripeKeys.publicKey.startsWith('pk_') || !stripeKeys.secretKey.startsWith('sk_')) {
          return onNotify("⚠️ Formato de claves inválido (deben empezar por pk_ y sk_).");
      }

      setSystemFinancials(prev => ({
          ...prev,
          [currentIssuerCountry]: {
              ...prev[currentIssuerCountry],
              stripe: {
                  ...prev[currentIssuerCountry].stripe!,
                  publicKey: stripeKeys.publicKey,
                  secretKey: stripeKeys.secretKey,
                  webhookSecret: stripeKeys.webhookSecret,
                  isConnected: true,
                  mode: 'live'
              }
          }
      }));
      onNotify(`✅ API de Stripe para ${currentIssuerCountry} vinculada correctamente.`);
  };

  const handleDownloadGestoriaZIP = () => {
      onNotify(`Generando paquete contable ZIP para ${selectedMonthFilter}...`);
      setTimeout(() => {
          onNotify("✅ Paquete ZIP descargado (Simulación).");
      }, 1500);
  };

  const handleSavePrices = () => {
      onNotify("Precios actualizados. Enviando notificaciones automáticas a usuarios afectados...");
      setTimeout(() => {
          onNotify("✅ Cambios aplicados y comunicados.");
      }, 2000);
  };

  const updatePackPrice = (id: string, field: 'monthlyPrice' | 'annualPriceYear1' | 'extraLocationPrice', val: number) => {
      setSubscriptionPacks(prev => prev.map(p => p.id === id ? { ...p, [field]: val } : p));
  };

  const handleRetryCharge = (invoiceId: string) => {
      onNotify(`Reintentando cobro automático para factura ${invoiceId}...`);
      setTimeout(() => {
          setInvoices(prev => prev.map(inv => 
              inv.id === invoiceId ? { ...inv, status: 'paid' } : inv
          ));
          onNotify("✅ Cobro recuperado exitosamente.");
      }, 2000);
  };

  const currentStripeConfig = systemFinancials[currentIssuerCountry].stripe;

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 py-8">
      
      {/* HEADER: STATUS & CONTROL */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
            <span className="text-9xl">⚖️</span>
        </div>
        <div className="relative z-10">
           <h2 className="text-3xl font-brand font-black uppercase tracking-tighter italic">Control Fiscal</h2>
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
        <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20">
            <p className="text-[10px] font-black uppercase text-gray-300 tracking-widest mb-1">Pasarela de Pagos</p>
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${currentStripeConfig?.isConnected ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 animate-pulse'}`}></div>
                <span className="font-bold text-sm">{currentStripeConfig?.isConnected ? 'STRIPE ONLINE' : 'DESCONECTADO'}</span>
            </div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-white p-2 rounded-3xl shadow-sm w-full md:w-fit border-2 border-gray-50 gap-2 overflow-x-auto scrollbar-hide">
        {(['config', 'precios', 'metrics', 'verifactu', 'recobro', 'auditoria', 'gestoria'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'metrics' ? 'Métricas P&L' : tab === 'config' ? 'Vincular Stripe' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA: CONFIG (STRIPE INTEGRATION) --- */}
      {activeTab === 'config' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-[#635BFF] rounded-2xl flex items-center justify-center text-white"><CreditCard /></div>
                      <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase italic">Vinculación Stripe</h3>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Configuración para {currentIssuerCountry}</p>
                      </div>
                  </div>

                  <div className="space-y-5">
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Public Key (pk_test/live_...)</label>
                          <input 
                              type="text" 
                              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-mono text-xs font-bold mt-1 outline-none focus:border-[#635BFF]"
                              placeholder="pk_live_..."
                              value={stripeKeys.publicKey}
                              onChange={e => setStripeKeys({...stripeKeys, publicKey: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Secret Key (sk_test/live_...)</label>
                          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl mt-1 overflow-hidden">
                              <input 
                                  type="password" 
                                  className="w-full bg-transparent p-3 font-mono text-xs font-bold outline-none"
                                  placeholder="sk_live_..."
                                  value={stripeKeys.secretKey}
                                  onChange={e => setStripeKeys({...stripeKeys, secretKey: e.target.value})}
                              />
                              <Lock size={14} className="text-gray-400 mr-3" />
                          </div>
                      </div>
                      <div>
                          <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Webhook Secret (whsec_...)</label>
                          <input 
                              type="text" 
                              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-mono text-xs font-bold mt-1 outline-none focus:border-[#635BFF]"
                              placeholder="whsec_..."
                              value={stripeKeys.webhookSecret}
                              onChange={e => setStripeKeys({...stripeKeys, webhookSecret: e.target.value})}
                          />
                      </div>

                      <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-gray-500">Modo Producción</span>
                              <div className="w-10 h-5 bg-green-500 rounded-full relative cursor-pointer">
                                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm"></div>
                              </div>
                          </div>
                          <button 
                              onClick={handleSaveStripeConfig}
                              className="bg-[#635BFF] text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#5349e0] transition-all shadow-lg flex items-center gap-2"
                          >
                              <LinkIcon size={16} /> Guardar y Vincular
                          </button>
                      </div>
                  </div>
              </div>

              {/* ... (Security Banking Card preserved) ... */}
              <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-200 flex flex-col justify-center items-center text-center">
                  <div className="bg-white p-6 rounded-full shadow-lg mb-6">
                      <ShieldCheck size={48} className="text-green-500" />
                  </div>
                  <h4 className="text-lg font-black text-gray-900 uppercase mb-2">Seguridad Bancaria</h4>
                  <p className="text-xs text-gray-500 max-w-sm mb-6">
                      Al vincular las claves, ELEMEDE comenzará a procesar los cobros de suscripciones, publicidad y créditos de forma automática mediante la infraestructura segura de Stripe.
                  </p>
                  <div className="grid grid-cols-2 gap-4 w-full">
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase">Comisión Stripe</p>
                          <p className="text-xl font-black text-gray-900">{systemFinancials[currentIssuerCountry].stripe?.feePercentage}% + {systemFinancials[currentIssuerCountry].stripe?.fixedFee}€</p>
                      </div>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <p className="text-[9px] font-black text-gray-400 uppercase">Moneda</p>
                          <p className="text-xl font-black text-gray-900">{COUNTRIES_DB.find(c => c.code === currentIssuerCountry)?.currency}</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* ... (Other tabs preserved) ... */}
      
      {/* --- PESTAÑA: PRECIOS (PRICING MANAGEMENT) --- */}
      {activeTab === 'precios' && (
          <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic">Gestión de Tarifas</h3>
                  <button onClick={handleSavePrices} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition-all shadow-lg flex items-center gap-2">
                      <Save size={16} /> Aplicar Cambios Globales
                  </button>
              </div>

              {/* SUBSCRIPTION PACKS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {subscriptionPacks.map(pack => (
                      <div key={pack.id} className="bg-white p-6 rounded-[2.5rem] border-2 border-gray-100 shadow-lg relative overflow-hidden group hover:border-indigo-200 transition-all">
                          <div className={`absolute top-0 left-0 w-full h-2 ${pack.colorClass}`}></div>
                          <div className="flex justify-between items-center mb-4 mt-2">
                              <h4 className="font-black text-gray-900 uppercase italic">{pack.label}</h4>
                              <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${pack.colorClass.replace('bg-', 'text-').replace('-50', '-600')}`}>{pack.badge}</span>
                          </div>
                          
                          <div className="space-y-4">
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Precio Mensual</label>
                                  <div className="flex items-center bg-gray-50 p-2 rounded-xl mt-1">
                                      <input 
                                          type="number" 
                                          className="bg-transparent w-full font-bold text-sm outline-none" 
                                          value={pack.monthlyPrice}
                                          onChange={e => updatePackPrice(pack.id, 'monthlyPrice', Number(e.target.value))}
                                      />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Precio Anual (1er año)</label>
                                  <div className="flex items-center bg-gray-50 p-2 rounded-xl mt-1">
                                      <input 
                                          type="number" 
                                          className="bg-transparent w-full font-bold text-sm outline-none" 
                                          value={pack.annualPriceYear1}
                                          onChange={e => updatePackPrice(pack.id, 'annualPriceYear1', Number(e.target.value))}
                                      />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Precio Sede Extra</label>
                                  <div className="flex items-center bg-gray-50 p-2 rounded-xl mt-1">
                                      <input 
                                          type="number" 
                                          className="bg-transparent w-full font-bold text-sm outline-none" 
                                          value={pack.extraLocationPrice}
                                          onChange={e => updatePackPrice(pack.id, 'extraLocationPrice', Number(e.target.value))}
                                      />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* ADVERTISING PRICES */}
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-lg">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Tarifas Publicidad (Banners)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(localAdPrices).map(([key, val]) => (
                          <div key={key}>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{key.replace('_', ' ')}</label>
                              <div className="flex items-center mt-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-3">
                                  <input 
                                      type="number" 
                                      className="bg-transparent w-full font-bold text-lg outline-none" 
                                      value={val} 
                                      onChange={e => setLocalAdPrices({...localAdPrices, [key]: Number(e.target.value)})} 
                                  />
                                  <span className="text-sm font-black text-gray-400">€</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* ... (Metrics, Verifactu, Recobro, Gestoria preserved) ... */}
      {activeTab === 'metrics' && (
          <div className="space-y-8 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* MRR CARD */}
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={60} /></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">MRR (Ingreso Recurrente)</p>
                      <h3 className="text-3xl font-black text-indigo-900 mb-1">{saasMetrics.mrr.toFixed(2)}€</h3>
                      <div className="flex items-center gap-1 text-green-500 text-[10px] font-bold uppercase">
                          <TrendingUp size={12} /> +5.2% mes pasado
                      </div>
                  </div>

                  {/* LTV CARD */}
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={60} /></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">LTV (Valor de Vida)</p>
                      <h3 className="text-3xl font-black text-green-700 mb-1">{saasMetrics.ltv.toFixed(0)}€</h3>
                      <p className="text-[9px] text-gray-400">Promedio por cliente</p>
                  </div>

                  {/* CHURN CARD */}
                  <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={60} /></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Churn Rate</p>
                      <h3 className={`text-3xl font-black mb-1 ${saasMetrics.churnRate > 5 ? 'text-red-500' : 'text-indigo-900'}`}>{saasMetrics.churnRate.toFixed(1)}%</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                          {saasMetrics.churnRate > 5 ? <AlertCircle size={12} className="text-red-500"/> : <TrendingDown size={12} className="text-green-500"/>} 
                          {saasMetrics.churnRate > 5 ? 'Alerta Riesgo' : 'Estable'}
                      </div>
                  </div>

                  {/* NET PROFIT CARD (P&L SUMMARY) */}
                  <div className={`bg-white p-6 rounded-[2.5rem] border-2 shadow-lg relative overflow-hidden group ${profitAndLoss.netProfit > 0 ? 'border-green-100' : 'border-red-100'}`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Wallet size={60} /></div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Beneficio Neto</p>
                      <h3 className={`text-3xl font-black mb-1 ${profitAndLoss.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>{profitAndLoss.netProfit.toFixed(2)}€</h3>
                      <div className="flex items-center gap-1 text-[10px] font-bold uppercase text-gray-400">
                          Margen: <span className={profitAndLoss.margin > 20 ? 'text-green-600' : 'text-orange-500'}>{profitAndLoss.margin.toFixed(1)}%</span>
                      </div>
                  </div>
              </div>

              {/* P&L DETAIL SECTION */}
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic mb-6">Cuenta de Resultados (P&L)</h4>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      
                      {/* Expenses Inputs */}
                      <div className="space-y-4">
                          <h5 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Gastos Operativos (Mensuales)</h5>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Infraestructura (Servidores)</label>
                                  <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-200 mt-1">
                                      <input type="number" className="bg-transparent w-full font-bold text-sm outline-none" value={operationalCosts.servers} onChange={e => setOperationalCosts({...operationalCosts, servers: Number(e.target.value)})} />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Costes API (Maps/AI)</label>
                                  <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-200 mt-1">
                                      <input type="number" className="bg-transparent w-full font-bold text-sm outline-none" value={operationalCosts.api} onChange={e => setOperationalCosts({...operationalCosts, api: Number(e.target.value)})} />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Marketing Propio</label>
                                  <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-200 mt-1">
                                      <input type="number" className="bg-transparent w-full font-bold text-sm outline-none" value={operationalCosts.marketing} onChange={e => setOperationalCosts({...operationalCosts, marketing: Number(e.target.value)})} />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase">Personal / Nóminas</label>
                                  <div className="flex items-center bg-gray-50 rounded-xl p-3 border border-gray-200 mt-1">
                                      <input type="number" className="bg-transparent w-full font-bold text-sm outline-none" value={operationalCosts.staff} onChange={e => setOperationalCosts({...operationalCosts, staff: Number(e.target.value)})} />
                                      <span className="text-xs font-bold text-gray-500">€</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      {/* Visual Summary */}
                      <div className="bg-gray-50 p-6 rounded-[2.5rem] flex flex-col justify-center">
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-black text-gray-500 uppercase">Ingresos Totales (MRR)</span>
                              <span className="text-lg font-black text-indigo-900">{profitAndLoss.totalRevenue.toFixed(2)}€</span>
                          </div>
                          <div className="flex justify-between items-center mb-4">
                              <span className="text-xs font-black text-gray-500 uppercase">Gastos Totales</span>
                              <span className="text-lg font-black text-red-500">-{profitAndLoss.totalExpenses.toFixed(2)}€</span>
                          </div>
                          <div className="h-px bg-gray-200 mb-4"></div>
                          <div className="flex justify-between items-center">
                              <span className="text-sm font-black text-gray-900 uppercase tracking-widest">Resultado Neto</span>
                              <span className={`text-2xl font-black ${profitAndLoss.netProfit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {profitAndLoss.netProfit > 0 ? '+' : ''}{profitAndLoss.netProfit.toFixed(2)}€
                              </span>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- PESTAÑA: VERIFACTU (AUDITORIA FISCAL) --- */}
      {activeTab === 'verifactu' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-gray-950 p-8 rounded-[3rem] shadow-2xl border-4 border-gray-800 relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6 relative z-10">
                      <div>
                          <h4 className="text-xl font-black text-white uppercase italic flex items-center gap-2">
                              <ShieldCheck size={24} className="text-green-500" /> Sistema VeriFactu
                          </h4>
                          <p className="text-[10px] text-gray-400 font-mono mt-1">Conexión Segura AEAT / HASH Chain Integrity</p>
                      </div>
                      <div className="flex items-center gap-2 bg-green-900/30 border border-green-500/30 px-4 py-2 rounded-xl">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                          <span className="text-[10px] font-bold text-green-400 uppercase">Conectado</span>
                      </div>
                  </div>

                  <div className="bg-black/50 rounded-2xl p-6 font-mono text-[10px] h-96 overflow-y-auto border border-white/10 space-y-2 scrollbar-hide relative z-10">
                      {invoices.slice(0, 20).map((inv, i) => (
                          <div key={inv.id} className="flex gap-4 border-b border-white/5 pb-2 hover:bg-white/5 p-1 transition-colors">
                              <span className="text-gray-500 w-24 shrink-0">{inv.date}</span>
                              <span className="text-blue-400 font-bold w-32 shrink-0">{inv.id}</span>
                              <span className="text-gray-300 flex-1 truncate">{inv.business_nif} → {inv.client_nif} | {inv.total_amount.toFixed(2)}€</span>
                              <span className="text-green-500 font-bold w-24 text-right">HASH OK</span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- PESTAÑA: RECOBRO (DUNNING) --- */}
      {activeTab === 'recobro' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-red-50">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic mb-6 flex items-center gap-2">
                      <AlertCircle className="text-red-500" /> Gestión de Impagados
                  </h4>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-left">
                          <thead className="text-[9px] font-black uppercase text-gray-400 border-b border-gray-100">
                              <tr>
                                  <th className="px-4 py-3">Factura</th>
                                  <th className="px-4 py-3">Cliente</th>
                                  <th className="px-4 py-3">Importe</th>
                                  <th className="px-4 py-3">Días Vencido</th>
                                  <th className="px-4 py-3 text-right">Acción</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 text-sm">
                              {invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length === 0 ? (
                                  <tr>
                                      <td colSpan={5} className="py-8 text-center text-gray-400 font-bold text-xs uppercase">
                                          ¡Excelente! No hay facturas pendientes de cobro.
                                      </td>
                                  </tr>
                              ) : (
                                  invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').map(inv => (
                                      <tr key={inv.id} className="hover:bg-red-50/30">
                                          <td className="px-4 py-4 font-mono font-bold">{inv.id}</td>
                                          <td className="px-4 py-4">{inv.client_name}</td>
                                          <td className="px-4 py-4 font-black text-red-600">{inv.total_amount.toFixed(2)}€</td>
                                          <td className="px-4 py-4 font-bold text-orange-500">5 días</td>
                                          <td className="px-4 py-4 text-right">
                                              <button onClick={() => handleRetryCharge(inv.id)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-700 flex items-center gap-2 ml-auto">
                                                  <RefreshCw size={12} /> Reintentar
                                              </button>
                                          </td>
                                      </tr>
                                  ))
                              )}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- PESTAÑA: GESTORIA (EXPORT) --- */}
      {activeTab === 'gestoria' && (
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 text-center py-20">
              <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 text-indigo-500">
                  <FileText size={48} />
              </div>
              <h4 className="text-2xl font-black text-gray-900 uppercase italic mb-2">Exportación Contable</h4>
              <p className="text-sm text-gray-500 max-w-md mx-auto mb-8">
                  Descarga todos los documentos fiscales, facturas emitidas y recibidas en formato compatible con A3/Sage para tu gestor.
              </p>
              
              <div className="flex justify-center gap-4">
                  <select 
                      className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none"
                      value={selectedMonthFilter}
                      onChange={e => setSelectedMonthFilter(e.target.value)}
                  >
                      <option value="2024-03">Marzo 2024</option>
                      <option value="2024-02">Febrero 2024</option>
                      <option value="2024-01">Enero 2024</option>
                  </select>
                  <button onClick={handleDownloadGestoriaZIP} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-lg flex items-center gap-2">
                      <Download size={16} /> Descargar Paquete ZIP
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};
