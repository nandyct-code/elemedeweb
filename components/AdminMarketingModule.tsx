
import React, { useState, useMemo } from 'react';
import { DiscountCode, Banner, Business, EmailTemplate, UserAccount, AdRequest, Invoice, SocialConfig, SupportTicket, SystemFinancialConfig, DemandZone, CouponTarget } from '../types';
import { MOCK_EMAIL_TEMPLATES, SECTORS } from '../constants';
import { getNotificationLogs } from '../services/notificationService';
import { 
  Wand2, AlertOctagon, Settings, Tag, Mail, MessageSquare, 
  TrendingUp, MousePointer, Heart, Smile, Meh, Frown, 
  Euro, Sliders, ShieldAlert, Bot, Zap, Lock, BarChart3,
  Plus, Trash2, Save, Send, Link as LinkIcon, Instagram, Facebook, Twitter, Youtube, Video,
  Layout, Calendar, Megaphone, Sparkles, Target, CheckCircle, XCircle
} from 'lucide-react';

interface AdminMarketingModuleProps {
  onNotify: (msg: string) => void;
  businesses: Business[];
  onUpdateBusiness: (id: string, updates: Partial<Business>) => void;
  users?: UserAccount[];
  banners: Banner[];
  onUpdateBanners: React.Dispatch<React.SetStateAction<Banner[]>>;
  coupons: DiscountCode[];
  setCoupons: React.Dispatch<React.SetStateAction<DiscountCode[]>>;
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  socialLinks?: SocialConfig;
  setSocialLinks?: React.Dispatch<React.SetStateAction<SocialConfig>>;
  tickets?: SupportTicket[];
  onUpdateTicket?: (id: string, updates: Partial<SupportTicket>) => void;
  systemConfig?: SystemFinancialConfig;
}

export const AdminMarketingModule: React.FC<AdminMarketingModuleProps> = ({ 
  onNotify, businesses, onUpdateBusiness, users = [], banners, onUpdateBanners, coupons, setCoupons, invoices, setInvoices, socialLinks, setSocialLinks, tickets = [], onUpdateTicket, systemConfig
}) => {
  const [activeTab, setActiveTab] = useState<'vision_global' | 'ad_studio' | 'ad_control' | 'config' | 'cupones' | 'emails' | 'soporte'>('vision_global');
  
  // STUDIO STATE (ENHANCED)
  const [studioMode, setStudioMode] = useState<'platform' | 'business'>('platform');
  const [platformType, setPlatformType] = useState<'season' | 'boost'>('season');
  const [seasonName, setSeasonName] = useState('');
  const [targetSector, setTargetSector] = useState('');
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);

  // SETTINGS STATE (MANUAL PARAMETERS)
  const [configRates, setConfigRates] = useState({
      day1: 9.90,
      day7: 39.90,
      day14: 69.90,
      push: 1.21
  });
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(80); 
  const [saturationLimit, setSaturationLimit] = useState(3); 

  // SETTINGS STATE (AI AUTOPILOT)
  const [autoPilot, setAutoPilot] = useState({
      autoCharge: false,
      riskCeiling: 50,
      aiSupport: true,
      antiValley: false,
      autoFill: true,
      yieldStrategy: 'profit' 
  });

  // COUPON STATE
  const [newCoupon, setNewCoupon] = useState<{code: string, value: number, type: 'porcentaje'|'fijo', target: CouponTarget}>({
      code: '', value: 10, type: 'porcentaje', target: 'plan_subscription'
  });

  // SOCIAL STATE (Local state for editing)
  const [localSocials, setLocalSocials] = useState<SocialConfig>(socialLinks || { instagram: '', facebook: '', tiktok: '', twitter: '', youtube: '' });

  // ROI METRICS
  const roiMetrics = useMemo(() => {
      const totalViews = banners.reduce((acc, b) => acc + (b.views || 0), 0);
      const totalClicks = banners.reduce((acc, b) => acc + (b.clicks || 0), 0);
      const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
      
      let totalRatings = 0;
      const sentiment = { positive: 0, neutral: 0, negative: 0 };
      
      businesses.forEach(b => {
          if (b.ratings) {
              b.ratings.forEach(r => {
                  totalRatings++;
                  if (r.stars >= 4) sentiment.positive++;
                  else if (r.stars === 3) sentiment.neutral++;
                  else sentiment.negative++;
              });
          }
      });

      const safeTotal = totalRatings || 1;
      const sentimentPerc = {
          positive: (sentiment.positive / safeTotal) * 100,
          neutral: (sentiment.neutral / safeTotal) * 100,
          negative: (sentiment.negative / safeTotal) * 100
      };
      const nps = Math.round(sentimentPerc.positive - sentimentPerc.negative);

      return { ctr, totalViews, totalClicks, sentimentPerc, nps, totalRatings };
  }, [banners, businesses]);

  // CONTROL CENTER: PENDING REQUESTS
  const pendingRequests = useMemo(() => {
    const list: { business: Business, request: AdRequest }[] = [];
    businesses.forEach(b => {
      if (b.adRequests) {
        b.adRequests.forEach(req => {
          if (req.status === 'pending') {
            list.push({ business: b, request: req });
          }
        });
      }
    });
    return list;
  }, [businesses]);

  // ACTIONS
  const handleSaveConfig = () => {
      if (setSocialLinks) setSocialLinks(localSocials);
      onNotify(`⚙️ Configuración Guardada:\n- Redes Sociales Actualizadas\n- Cobro Auto: ${autoPilot.autoCharge ? 'ON' : 'OFF'}`);
  };

  const handleCreateCoupon = () => {
      if (!newCoupon.code) return alert("Escribe un código");
      const coupon: DiscountCode = {
          id: Math.random().toString(36).substr(2, 9),
          code: newCoupon.code.toUpperCase(),
          type: newCoupon.type,
          value: newCoupon.value,
          active: true,
          status: 'active',
          usage_limit: 100,
          usage_count: 0,
          valid_from: new Date().toISOString(),
          valid_to: new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          applicable_targets: [newCoupon.target]
      };
      setCoupons(prev => [...prev, coupon]);
      setNewCoupon({ code: '', value: 10, type: 'porcentaje', target: 'plan_subscription' });
      onNotify("Cupón creado exitosamente.");
  };

  const handleDeleteCoupon = (id: string) => {
      setCoupons(prev => prev.filter(c => c.id !== id));
      onNotify("Cupón eliminado.");
  };

  const handleResolveTicket = (id: string) => {
      if (onUpdateTicket) onUpdateTicket(id, { status: 'resolved' });
      onNotify("Ticket marcado como resuelto.");
  };

  // CONTROL ACTIONS
  const handleApproveAd = (businessId: string, request: AdRequest) => {
      // 1. Create Banner
      const biz = businesses.find(b => b.id === businessId);
      const newBanner: Banner = {
          id: `ad_${request.id}`,
          title: `Promoción: ${biz?.name}`,
          imageUrl: biz?.mainImage || '',
          type: 'business_campaign',
          subtype: 'featured', 
          format: 'card_vertical',
          position: 'sidebar', 
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + request.durationDays * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          visibility_rules: { roles: ['all'], plans: ['all'] },
          views: 0,
          clicks: 0,
          linkedBusinessId: businessId,
          spawnType: request.type === '1_day' ? '1_day' : request.type === '7_days' ? '7_days' : '14_days'
      };

      // 2. Update Business Request Status
      onUpdateBusiness(businessId, {
          adRequests: biz?.adRequests?.map(r => 
              r.id === request.id ? { ...r, status: 'active' } : r
          )
      });

      // 3. Add Banner to Global State
      onUpdateBanners(prev => [newBanner, ...prev]);
      
      // 4. Create Invoice (Simulated)
      const newInvoice: Invoice = {
          id: `INV-AD-${request.id}`,
          business_id: businessId,
          business_name: systemConfig?.issuerDetails.businessName || 'ELEMEDE SL',
          business_nif: systemConfig?.issuerDetails.nif || 'B12345678',
          client_name: biz?.name || 'Cliente',
          client_nif: biz?.nif || '',
          date: new Date().toISOString().split('T')[0],
          due_date: new Date().toISOString().split('T')[0],
          base_amount: request.price / 1.21,
          iva_rate: 21,
          iva_amount: request.price - (request.price / 1.21),
          irpf_rate: 0,
          irpf_amount: 0,
          total_amount: request.price,
          status: 'paid', // Pre-paid
          concept: `Campaña Publicidad ${request.durationDays} Días`,
          quarter: Math.floor(new Date().getMonth() / 3) + 1
      };
      setInvoices(prev => [newInvoice, ...prev]);

      onNotify(`Campaña aprobada y activada para ${biz?.name}`);
  };

  const handleRejectAd = (businessId: string, requestId: string) => {
      onUpdateBusiness(businessId, {
          adRequests: businesses.find(b => b.id === businessId)?.adRequests?.map(r => 
              r.id === requestId ? { ...r, status: 'rejected' } : r
          )
      });
      onNotify("Solicitud de campaña rechazada.");
  };

  const handleDeleteBanner = (bannerId: string) => {
      onUpdateBanners(prev => prev.filter(b => b.id !== bannerId));
      onNotify("Banner eliminado.");
  };

  // NEW STUDIO HANDLERS
  const handleGenerateCampaign = () => {
      if (studioMode === 'platform') {
          if (platformType === 'season' && !seasonName) return alert("Indica el nombre de la temporada (Ej: Navidad)");
          if (platformType === 'boost' && !targetSector) return alert("Selecciona un sector para impulsar");
      }

      setIsGeneratingCampaign(true);
      setGeneratedPreview(null);

      // Simulate AI Generation
      setTimeout(() => {
          setIsGeneratingCampaign(false);
          const mockImage = platformType === 'season' 
            ? 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=800' // Christmas/Season vibe
            : 'https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800'; // Generic sweet vibe

          const mockTitle = platformType === 'season' 
            ? `Especial ${seasonName}: Dulces Momentos`
            : `Descubre lo mejor de: ${SECTORS.find(s => s.id === targetSector)?.label}`;

          setGeneratedPreview({
              title: mockTitle,
              subtitle: platformType === 'season' ? 'Colección de Temporada' : 'Impulso Local',
              imageUrl: mockImage,
              ctaText: 'Explorar Ahora',
              type: 'platform'
          });
          onNotify("✨ Campaña de Plataforma generada por IA.");
      }, 1500);
  };

  const handlePublishPlatformCampaign = () => {
      if (!generatedPreview) return;
      
      const newBanner: Banner = {
          id: `bp_${Date.now()}`,
          title: generatedPreview.title,
          subtitle: generatedPreview.subtitle,
          imageUrl: generatedPreview.imageUrl,
          type: 'sector_campaign',
          subtype: platformType === 'season' ? 'seasonality' : 'educational',
          format: 'horizontal',
          position: 'header',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(), // 30 days
          status: 'active',
          visibility_rules: { roles: ['all'], plans: ['all'] },
          views: 0,
          clicks: 0,
          ctaText: generatedPreview.ctaText
      };

      onUpdateBanners(prev => [newBanner, ...prev]);
      setGeneratedPreview(null);
      setSeasonName('');
      setTargetSector('');
      onNotify("🚀 Campaña de Plataforma publicada (Coste: 0€ - Interno)");
  };

  // --- RENDER ---
  return (
    <div className="space-y-10 animate-fade-in relative pb-20">
      
      {/* HEADER TABS */}
      <div className="flex bg-white p-2 rounded-3xl shadow-sm w-full md:w-fit border-2 border-gray-50 gap-2 overflow-x-auto scrollbar-hide">
        {[
            { id: 'vision_global', label: 'Vision Global' },
            { id: 'ad_studio', label: 'Studio IA', icon: <Wand2 size={14}/> },
            { id: 'ad_control', label: 'Centro Control', icon: <AlertOctagon size={14}/> },
            { id: 'config', label: 'Ajustes & Redes', icon: <Settings size={14}/> },
            { id: 'cupones', label: 'Cupones', icon: <Tag size={14}/> },
            { id: 'emails', label: 'Comunicaciones', icon: <Mail size={14}/> },
            { id: 'soporte', label: 'Soporte Mkt', icon: <MessageSquare size={14}/> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 md:px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-shrink-0 flex items-center gap-2 ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-xl' : 'text-gray-400 hover:text-gray-600'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* --- VISION GLOBAL TAB --- */}
      {activeTab === 'vision_global' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-gradient-to-r from-gray-900 to-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
                  <div className="relative z-10 grid md:grid-cols-2 gap-8">
                      <div>
                          <h4 className="text-xl font-black uppercase italic mb-2">Panel ROI & Sentimiento</h4>
                          <p className="text-sm opacity-80 max-w-lg">Métricas clave de rendimiento y calidad.</p>
                      </div>
                      <div className="flex justify-end items-end gap-4">
                          <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">CTR Global</p>
                              <p className="text-4xl font-black">{roiMetrics.ctr.toFixed(2)}%</p>
                          </div>
                          <div className="h-10 w-px bg-white/20"></div>
                          <div className="text-right">
                              <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">NPS Score</p>
                              <p className={`text-4xl font-black ${roiMetrics.nps > 50 ? 'text-green-400' : 'text-yellow-400'}`}>{roiMetrics.nps}</p>
                          </div>
                      </div>
                  </div>
                  <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">📊</div>
              </div>
              {/* Sentiment Detail */}
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <div className="flex justify-between items-end mb-8">
                      <h4 className="text-xl font-black text-gray-900 uppercase italic flex items-center gap-2">
                          <Heart className="text-pink-500" /> Inteligencia de Opinión
                      </h4>
                      <p className="text-xs text-gray-500 font-bold">{roiMetrics.totalRatings} reseñas analizadas</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-green-50 p-6 rounded-[2rem] border border-green-100 text-center">
                          <Smile size={40} className="text-green-500 mb-2 mx-auto" />
                          <h5 className="font-black text-2xl text-green-700">{roiMetrics.sentimentPerc.positive.toFixed(1)}%</h5>
                          <p className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Positivo</p>
                      </div>
                      <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-200 text-center">
                          <Meh size={40} className="text-gray-400 mb-2 mx-auto" />
                          <h5 className="font-black text-2xl text-gray-600">{roiMetrics.sentimentPerc.neutral.toFixed(1)}%</h5>
                          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Neutro</p>
                      </div>
                      <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 text-center">
                          <Frown size={40} className="text-red-500 mb-2 mx-auto" />
                          <h5 className="font-black text-2xl text-red-700">{roiMetrics.sentimentPerc.negative.toFixed(1)}%</h5>
                          <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Negativo</p>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* --- STUDIO IA (RENOVADO) --- */}
      {activeTab === 'ad_studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
              
              {/* CONTROLS (LEFT PANEL) */}
              <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white"><Wand2 size={20} /></div>
                      <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase italic">Studio IA 2.0</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Generador Creativo</p>
                      </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                      <button 
                          onClick={() => setStudioMode('platform')}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${studioMode === 'platform' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}
                      >
                          Plataforma
                      </button>
                      <button 
                          onClick={() => setStudioMode('business')}
                          className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${studioMode === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}
                      >
                          Negocio (B2B)
                      </button>
                  </div>

                  {studioMode === 'platform' ? (
                      <div className="space-y-6 flex-1 flex flex-col">
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Tipo de Campaña Interna</label>
                              <div className="grid grid-cols-2 gap-3">
                                  <button 
                                      onClick={() => setPlatformType('season')}
                                      className={`p-3 rounded-2xl border-2 text-left transition-all ${platformType === 'season' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-100 text-gray-500 hover:border-purple-200'}`}
                                  >
                                      <Calendar size={18} className="mb-2" />
                                      <span className="text-[10px] font-black uppercase block">Temporada</span>
                                  </button>
                                  <button 
                                      onClick={() => setPlatformType('boost')}
                                      className={`p-3 rounded-2xl border-2 text-left transition-all ${platformType === 'boost' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500 hover:border-green-200'}`}
                                  >
                                      <Megaphone size={18} className="mb-2" />
                                      <span className="text-[10px] font-black uppercase block">Anti-Valle (Boost)</span>
                                  </button>
                              </div>
                          </div>

                          {platformType === 'season' && (
                              <div className="animate-fade-in">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nombre de la Temporada</label>
                                  <input 
                                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1 focus:border-purple-500 outline-none transition-colors"
                                      placeholder="Ej: Navidad, Verano, Black Friday..."
                                      value={seasonName}
                                      onChange={e => setSeasonName(e.target.value)}
                                  />
                                  <p className="text-[9px] text-gray-400 mt-2 italic">Crea banners temáticos para decorar la home.</p>
                              </div>
                          )}

                          {platformType === 'boost' && (
                              <div className="animate-fade-in">
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sector a Impulsar</label>
                                  <select 
                                      className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1 focus:border-green-500 outline-none transition-colors"
                                      value={targetSector}
                                      onChange={e => setTargetSector(e.target.value)}
                                  >
                                      <option value="">Selecciona Sector sin movimiento...</option>
                                      {SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                                  </select>
                                  <div className="mt-3 bg-green-50 p-3 rounded-xl border border-green-100 flex items-start gap-2">
                                      <Sparkles size={14} className="text-green-600 mt-0.5" />
                                      <p className="text-[9px] text-green-800 font-medium">Esta acción creará visibilidad gratuita para este sector para reactivar el tráfico.</p>
                                  </div>
                              </div>
                          )}

                          <div className="mt-auto">
                              <button 
                                  onClick={handleGenerateCampaign} 
                                  disabled={isGeneratingCampaign} 
                                  className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-600 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                              >
                                  {isGeneratingCampaign ? 'Diseñando...' : 'Generar Arte IA'}
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                          <Target size={48} className="mb-4 text-gray-300" />
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Modo B2B para Clientes</p>
                          <p className="text-[9px] text-gray-400 mt-2">Gestionar solicitudes individuales en pestaña "Control".</p>
                      </div>
                  )}
              </div>

              {/* PREVIEW (RIGHT PANEL) */}
              <div className="lg:col-span-2 bg-gray-50 rounded-[3rem] p-8 relative flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                  {generatedPreview ? (
                      <div className="w-full max-w-lg animate-fade-in-up">
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 text-center">Vista Previa Generada</h4>
                          
                          {/* Banner Card Preview */}
                          <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl relative group">
                              <div className="h-48 relative overflow-hidden">
                                  <img src={generatedPreview.imageUrl} className="w-full h-full object-cover" />
                                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                      {generatedPreview.subtitle}
                                  </div>
                              </div>
                              <div className="p-6">
                                  <h3 className="text-2xl font-brand font-black text-gray-900 italic tracking-tighter mb-2">{generatedPreview.title}</h3>
                                  <button className="text-xs font-bold underline decoration-2 decoration-purple-400">{generatedPreview.ctaText}</button>
                              </div>
                          </div>

                          <div className="flex gap-4 mt-8">
                              <button onClick={() => setGeneratedPreview(null)} className="flex-1 py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600">Descartar</button>
                              <button onClick={handlePublishPlatformCampaign} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 shadow-lg flex items-center justify-center gap-2">
                                  <Zap size={14} /> Publicar (0€ Interno)
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-gray-400">
                          <Layout size={64} className="mb-4 opacity-20 mx-auto" />
                          <p className="font-bold uppercase text-xs tracking-widest">Esperando instrucciones creativas...</p>
                          <p className="text-[9px] mt-2 opacity-60">Configura los parámetros a la izquierda para generar.</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {/* --- CONTROL CENTER (RESTORED FUNCTIONALITY) --- */}
      {activeTab === 'ad_control' && (
          <div className="space-y-8 animate-fade-in">
              <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic">Autopista de Aprobación</h3>
                  <span className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                      {pendingRequests.length} Solicitudes Pendientes
                  </span>
              </div>

              {pendingRequests.length === 0 ? (
                  <div className="h-64 flex flex-col items-center justify-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                      <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Todo limpio. No hay campañas por aprobar.</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {pendingRequests.map(({ business, request }) => (
                          <div key={request.id} className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-gray-100 flex flex-col md:flex-row gap-6 relative overflow-hidden group">
                              {/* Left: Info */}
                              <div className="flex-1 space-y-2">
                                  <div className="flex justify-between items-start">
                                      <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded uppercase tracking-widest">{request.type.replace('_', ' ')}</span>
                                      <span className="text-[9px] font-black text-gray-400">{request.requestDate.split('T')[0]}</span>
                                  </div>
                                  <h4 className="font-black text-xl text-gray-900 leading-tight">{business.name}</h4>
                                  <p className="text-xs text-gray-500 font-bold">Inversión: <span className="text-green-600">{request.price}€</span></p>
                              </div>
                              
                              {/* Right: Actions */}
                              <div className="flex md:flex-col gap-2 justify-center">
                                  <button onClick={() => handleApproveAd(business.id, request)} className="bg-green-500 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-green-600 shadow-md flex items-center justify-center gap-2 transition-all">
                                      <CheckCircle size={16} /> Aprobar
                                  </button>
                                  <button onClick={() => handleRejectAd(business.id, request.id)} className="bg-red-50 text-red-500 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-red-100 flex items-center justify-center gap-2 transition-all">
                                      <XCircle size={16} /> Rechazar
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* ACTIVE BANNERS MANAGEMENT */}
              <div className="pt-8 border-t border-gray-100">
                  <h4 className="text-lg font-black text-gray-900 uppercase italic mb-6">Campañas Activas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {banners.map(banner => (
                          <div key={banner.id} className="bg-white p-4 rounded-[2rem] border border-gray-100 shadow-sm relative group">
                              <button onClick={() => handleDeleteBanner(banner.id)} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                  <Trash2 size={12} />
                              </button>
                              <div className="h-24 rounded-xl overflow-hidden mb-3 relative">
                                  <img src={banner.imageUrl} className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 left-0 bg-black/50 text-white text-[8px] font-bold px-2 py-1 uppercase w-full">
                                      {banner.type === 'sector_campaign' ? 'Plataforma' : 'Negocio'} • {banner.subtype}
                                  </div>
                              </div>
                              <h5 className="font-bold text-xs truncate">{banner.title}</h5>
                              <div className="flex justify-between items-center mt-2 text-[9px] font-black text-gray-400 uppercase">
                                  <span>👁 {banner.views}</span>
                                  <span>🖱 {banner.clicks}</span>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- CUPONES TAB (RESTORED) --- */}
      {activeTab === 'cupones' && (
          <div className="space-y-8 animate-fade-in">
              <div className="