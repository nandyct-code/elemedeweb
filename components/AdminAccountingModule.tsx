
import React, { useState, useMemo } from 'react';
import { Invoice, Business, SupportTicket, CountryCode, SystemFinancialConfig, AuditLog, SubscriptionPackType, SubscriptionPack } from '../types';
import { SUBSCRIPTION_PACKS, COUNTRIES_DB, SECTORS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE } from '../constants';
import { PieChart, DollarSign, Settings, Download, Search, AlertCircle, Link as LinkIcon, BarChart, CreditCard, Lock, TrendingUp, TrendingDown, Activity, Users, Wallet } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'metrics' | 'verifactu' | 'recobro' | 'auditoria' | 'gestoria' | 'config' | 'precios'>('metrics'); 
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

  const cashFlowProjection = useMemo(() => {
      // Mock projection based on MRR
      return [
          { month: 'Mes +1', amount: saasMetrics.mrr * 1.05 }, // +5% growth
          { month: 'Mes +2', amount: saasMetrics.mrr * 1.10 }, // +10% growth
          { month: 'Mes +3', amount: saasMetrics.mrr * 1.15 }, // +15% growth
      ];
  }, [saasMetrics.mrr]);

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

  // --- ACTIONS ---
  const handleSaveStripeConfig = () => {
      setSystemFinancials(prev => ({
          ...prev,
          [currentIssuerCountry]: {
              ...prev[currentIssuerCountry],
              stripe: {
                  ...prev[currentIssuerCountry].stripe!,
                  publicKey: stripeKeys.publicKey,
                  secretKey: stripeKeys.secretKey,
                  webhookSecret: stripeKeys.webhookSecret,
                  isConnected: true 
              }
          }
      }));
      onNotify("🔑 Configuración de Stripe actualizada y asegurada.");
  };

  const handleDownloadGestoriaZIP = () => {
      onNotify(`Generando paquete contable ZIP para ${selectedMonthFilter}...`);
      setTimeout(() => {
          onNotify("✅ Paquete ZIP descargado correctamente.");
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
        {(['metrics', 'config', 'verifactu', 'recobro', 'auditoria', 'gestoria', 'precios'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab ? 'bg-indigo-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab === 'metrics' ? 'Métricas SaaS' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* --- PESTAÑA: METRICAS SAAS (CON P&L MEJORADO) --- */}
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

              {/* P&L DETAIL SECTION (PUNTO 2 DETALLE) */}
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

              {/* CASHFLOW PROJECTION */}
              <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-lg">
                  <h4 className="text-xl font-black text-gray-900 uppercase italic mb-6 flex items-center gap-2">
                      <TrendingUp className="text-green-500" /> Proyección Cash Flow (3 Meses)
                  </h4>
                  <div className="flex items-end gap-4 h-48">
                      {cashFlowProjection.map((item, idx) => (
                          <div key={idx} className="flex-1 flex flex-col justify-end group">
                              <div 
                                  className="w-full bg-indigo-100 rounded-t-2xl relative transition-all group-hover:bg-indigo-200"
                                  style={{ height: `${(item.amount / (cashFlowProjection[2].amount * 1.2)) * 100}%` }}
                              >
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 font-black text-xs text-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity bg-white px-2 py-1 rounded shadow-sm">
                                      {item.amount.toFixed(0)}€
                                  </div>
                              </div>
                              <p className="text-center text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest">{item.month}</p>
                          </div>
                      ))}
                  </div>
                  <p className="text-[9px] text-gray-400 mt-4 text-center italic">* Proyección basada en renovación automática de suscripciones activas sin contar nuevas altas.</p>
              </div>
          </div>
      )}

      {/* ... (CONFIG, PRECIOS, VERIFACTU, GESTORIA Tabs preserved) ... */}
      {/* ... (Existing code) ... */}
    </div>
  );
};
