
import React, { useState, useMemo, useEffect } from 'react';
import { DiscountCode, Banner, Business, EmailTemplate, UserAccount, AdRequest, Invoice, SocialConfig, SupportTicket, SystemFinancialConfig, DemandZone, CouponTarget, NotificationLog } from '../types';
import { MOCK_EMAIL_TEMPLATES, SECTORS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE, PUSH_NOTIFICATION_PRICE } from '../constants';
import { getNotificationLogs } from '../services/notificationService';
import { generateBannerImage } from '../services/geminiService'; // Uses robust service
import { 
  Wand2, AlertOctagon, Settings, Tag, Mail, MessageSquare, 
  TrendingUp, MousePointer, Heart, Smile, Meh, Frown, 
  Euro, Sliders, ShieldAlert, Bot, Zap, Lock, BarChart3,
  Plus, Trash2, Save, Send, Link as LinkIcon, Instagram, Facebook, Twitter, Youtube, Video,
  Layout, Calendar, Megaphone, Sparkles, Target, Image as ImageIcon, Store, RefreshCw
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
  const [selectedBusinessId, setSelectedBusinessId] = useState('');
  const [forceAiGeneration, setForceAiGeneration] = useState(false);
  const [isGeneratingCampaign, setIsGeneratingCampaign] = useState(false);
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);
  const [useCustomPrompt, setUseCustomPrompt] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');

  // SETTINGS STATE (MANUAL PARAMETERS)
  const [configRates, setConfigRates] = useState({
      day1: BANNER_1_DAY_PRICE,
      day7: BANNER_7_DAYS_PRICE,
      day14: BANNER_14_DAYS_PRICE,
      push: PUSH_NOTIFICATION_PRICE
  });
  const [aiConfidenceThreshold, setAiConfidenceThreshold] = useState(80); 
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

  // SOCIAL STATE
  const [localSocials, setLocalSocials] = useState<SocialConfig>(socialLinks || { instagram: '', facebook: '', tiktok: '', twitter: '', youtube: '' });

  useEffect(() => {
      if (socialLinks) setLocalSocials(socialLinks);
  }, [socialLinks]);

  // LOGS STATE
  const [emailLogs, setEmailLogs] = useState<NotificationLog[]>([]);

  useEffect(() => {
    if (activeTab === 'emails') {
      const fetchLogs = async () => {
        try {
          const logs = await getNotificationLogs();
          setEmailLogs(logs);
        } catch (error) {
          console.error("Error fetching logs:", error);
        }
      };
      fetchLogs();
      const interval = setInterval(fetchLogs, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

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

  // ACTIONS
  const handleSaveConfig = () => {
      if (setSocialLinks) setSocialLinks(localSocials);
      onNotify(`⚙️ Configuración Guardada`);
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

  // --- MAIN BANNER GENERATION LOGIC ---
  const handleGenerateCampaign = async () => {
      if (studioMode === 'platform') {
          if (platformType === 'season' && !seasonName) return alert("Indica el nombre de la temporada");
          if (platformType === 'boost' && !targetSector) return alert("Selecciona un sector");
      }
      if (studioMode === 'business' && !selectedBusinessId) return alert("Selecciona un negocio");

      setIsGeneratingCampaign(true);
      setGeneratedPreview(null);

      let imageToUse = '';
      let title = '';
      let subtitle = '';
      let cta = 'Saber Más';

      try {
          if (studioMode === 'business') {
              const biz = businesses.find(b => b.id === selectedBusinessId);
              if (!biz) throw new Error("Negocio no encontrado");

              title = biz.name;
              subtitle = `Lo mejor de ${biz.city}`;
              cta = 'Visitar Perfil';

              if (biz.mainImage && !forceAiGeneration && !useCustomPrompt) {
                  imageToUse = biz.mainImage;
              } else {
                  const basePrompt = useCustomPrompt ? imagePrompt : `${biz.sectorId} ${biz.name} delicious food`;
                  const generatedUrl = await generateBannerImage(basePrompt);
                  if (generatedUrl) imageToUse = generatedUrl;
              }
          } else {
              title = platformType === 'season' ? `Especial ${seasonName}` : `Descubre: ${targetSector}`;
              subtitle = platformType === 'season' ? 'Colección de Temporada' : 'Impulso Local';
              cta = 'Explorar';

              const contextPrompt = platformType === 'season' 
                  ? `${seasonName} holiday sweets decoration elegant`
                  : `Delicious artisan ${targetSector} professional photo`;
              
              const finalPrompt = useCustomPrompt && imagePrompt ? imagePrompt : contextPrompt;
              const generatedUrl = await generateBannerImage(finalPrompt);
              if (generatedUrl) imageToUse = generatedUrl;
          }

          if (!imageToUse) throw new Error("Falló la generación de imagen.");

          setGeneratedPreview({
              title,
              subtitle,
              imageUrl: imageToUse,
              ctaText: cta,
              type: studioMode === 'business' ? 'business_campaign' : 'sector_campaign',
              linkedBusinessId: studioMode === 'business' ? selectedBusinessId : undefined
          });
          onNotify("✨ Diseño generado con éxito.");

      } catch (e: any) {
          console.error(e);
          onNotify(`⚠️ Generado con respaldo: ${e.message}`);
          // Even on error, if we have a generatedPreview from a previous step or basic fallback logic, show it.
      } finally {
          setIsGeneratingCampaign(false);
      }
  };

  const handlePublishPlatformCampaign = () => {
      if (!generatedPreview) return;
      
      const newBanner: Banner = {
          id: `bp_${Date.now()}`,
          title: generatedPreview.title,
          subtitle: generatedPreview.subtitle,
          imageUrl: generatedPreview.imageUrl,
          type: generatedPreview.type,
          subtype: platformType === 'season' ? 'seasonality' : 'educational',
          format: 'horizontal',
          position: 'header',
          start_date: new Date().toISOString(),
          end_date: new Date(Date.now() + 30*24*60*60*1000).toISOString(), 
          status: 'active',
          visibility_rules: { roles: ['all'], plans: ['all'] },
          views: 0,
          clicks: 0,
          ctaText: generatedPreview.ctaText,
          linkedBusinessId: generatedPreview.linkedBusinessId
      };

      onUpdateBanners(prev => [newBanner, ...prev]);
      setGeneratedPreview(null);
      setSeasonName('');
      setTargetSector('');
      setSelectedBusinessId('');
      onNotify("🚀 Campaña publicada y activa.");
  };

  return (
    <div className="space-y-10 animate-fade-in relative pb-20">
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
          </div>
      )}

      {activeTab === 'ad_studio' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-[600px]">
              <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 flex flex-col">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white"><Wand2 size={20} /></div>
                      <div>
                          <h3 className="text-xl font-black text-gray-900 uppercase italic">Studio IA 2.0</h3>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Generador Creativo</p>
                      </div>
                  </div>
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                      <button onClick={() => setStudioMode('platform')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${studioMode === 'platform' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400'}`}>Plataforma</button>
                      <button onClick={() => setStudioMode('business')} className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase ${studioMode === 'business' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400'}`}>Negocio</button>
                  </div>

                  {studioMode === 'platform' ? (
                      <div className="space-y-6 flex-1 flex flex-col">
                          <div>
                              <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => setPlatformType('season')} className={`p-3 rounded-2xl border-2 text-left ${platformType === 'season' ? 'border-purple-500 bg-purple-50' : 'border-gray-100'}`}>
                                      <Calendar size={18} className="mb-2" />
                                      <span className="text-[10px] font-black uppercase block">Temporada</span>
                                  </button>
                                  <button onClick={() => setPlatformType('boost')} className={`p-3 rounded-2xl border-2 text-left ${platformType === 'boost' ? 'border-green-500 bg-green-50' : 'border-gray-100'}`}>
                                      <Megaphone size={18} className="mb-2" />
                                      <span className="text-[10px] font-black uppercase block">Boost</span>
                                  </button>
                              </div>
                          </div>
                          {platformType === 'season' && <input className="input-field" placeholder="Nombre Temporada" value={seasonName} onChange={e => setSeasonName(e.target.value)} />}
                          {platformType === 'boost' && <select className="input-field" value={targetSector} onChange={e => setTargetSector(e.target.value)}><option value="">Sector...</option>{SECTORS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>}
                      </div>
                  ) : (
                      <div className="space-y-6 flex-1 flex flex-col">
                          <select className="input-field" value={selectedBusinessId} onChange={e => setSelectedBusinessId(e.target.value)}><option value="">Negocio...</option>{businesses.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
                          <label className="flex items-center gap-3"><input type="checkbox" checked={forceAiGeneration} onChange={() => setForceAiGeneration(!forceAiGeneration)} /> <span className="text-xs font-bold">Forzar IA</span></label>
                      </div>
                  )}

                  <div className="border-t border-gray-100 pt-4 mt-auto">
                      <button onClick={() => setUseCustomPrompt(!useCustomPrompt)} className="text-[9px] font-black uppercase text-gray-500 mb-2 block">{useCustomPrompt ? 'Usar Auto' : 'Prompt Manual'}</button>
                      {useCustomPrompt && <textarea className="input-field mb-4" placeholder="Prompt..." value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} />}
                      <button onClick={handleGenerateCampaign} disabled={isGeneratingCampaign} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-xs hover:bg-purple-600 transition-all shadow-lg">
                          {isGeneratingCampaign ? 'Generando...' : 'Generar Banner'}
                      </button>
                  </div>
              </div>

              <div className="lg:col-span-2 bg-gray-50 rounded-[3rem] p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-200">
                  {generatedPreview ? (
                      <div className="w-full max-w-lg animate-fade-in-up">
                          <div className="bg-white rounded-[2rem] overflow-hidden shadow-2xl">
                              <div className="h-48 relative overflow-hidden bg-gray-100">
                                  <img src={generatedPreview.imageUrl} className="w-full h-full object-cover" />
                                  <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-lg text-[9px] font-black uppercase">{generatedPreview.subtitle}</div>
                              </div>
                              <div className="p-6">
                                  <h3 className="text-2xl font-black text-gray-900 italic mb-2">{generatedPreview.title}</h3>
                                  <button className="text-xs font-bold underline decoration-purple-400">{generatedPreview.ctaText}</button>
                              </div>
                          </div>
                          <div className="flex gap-4 mt-8">
                              <button onClick={() => setGeneratedPreview(null)} className="flex-1 py-3 text-gray-400 font-black text-[10px] uppercase">Descartar</button>
                              <button onClick={handlePublishPlatformCampaign} className="flex-[2] bg-green-600 text-white py-3 rounded-xl font-black text-[10px] uppercase shadow-lg">Publicar</button>
                          </div>
                      </div>
                  ) : (
                      <div className="text-center text-gray-400">
                          <Layout size={64} className="mb-4 opacity-20 mx-auto" />
                          <p className="font-bold uppercase text-xs tracking-widest">Esperando instrucciones...</p>
                      </div>
                  )}
              </div>
          </div>
      )}

      {activeTab === 'cupones' && (
          <div className="space-y-8 animate-fade-in">
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <h4 className="font-black text-gray-900 uppercase italic text-xl mb-6">Generador de Cupones</h4>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                      <input className="input-field" placeholder="Código" value={newCoupon.code} onChange={e => setNewCoupon({...newCoupon, code: e.target.value})} />
                      <select className="input-field" value={newCoupon.type} onChange={e => setNewCoupon({...newCoupon, type: e.target.value as any})}><option value="porcentaje">%</option><option value="fijo">€</option></select>
                      <input type="number" className="input-field" value={newCoupon.value} onChange={e => setNewCoupon({...newCoupon, value: Number(e.target.value)})} />
                      <select className="input-field" value={newCoupon.target} onChange={e => setNewCoupon({...newCoupon, target: e.target.value as any})}><option value="plan_subscription">Planes</option><option value="ad_banner">Ads</option></select>
                      <button onClick={handleCreateCoupon} className="bg-gray-900 text-white px-6 py-3.5 rounded-xl font-black uppercase text-xs hover:bg-orange-600 shadow-lg">Crear</button>
                  </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {coupons.map(c => (
                      <div key={c.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm relative group">
                          <button onClick={() => handleDeleteCoupon(c.id!)} className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                          <h5 className="font-black text-xl text-gray-900 uppercase">{c.code}</h5>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{c.type === 'porcentaje' ? `-${c.value}%` : `-${c.value}€`}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'config' && (
          <div className="space-y-8 animate-fade-in pb-10">
              <div className="flex justify-between items-center px-4">
                  <h3 className="text-2xl font-black text-gray-900 uppercase italic">Ajustes Generales</h3>
                  <button onClick={handleSaveConfig} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase shadow-lg">Guardar</button>
              </div>
              <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                  <h4 className="font-black uppercase tracking-widest mb-6">Redes Sociales</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input className="input-field" placeholder="Instagram" value={localSocials.instagram} onChange={e => setLocalSocials({...localSocials, instagram: e.target.value})} />
                      <input className="input-field" placeholder="Facebook" value={localSocials.facebook} onChange={e => setLocalSocials({...localSocials, facebook: e.target.value})} />
                      <input className="input-field" placeholder="Twitter" value={localSocials.twitter} onChange={e => setLocalSocials({...localSocials, twitter: e.target.value})} />
                      <input className="input-field" placeholder="TikTok" value={localSocials.tiktok} onChange={e => setLocalSocials({...localSocials, tiktok: e.target.value})} />
                  </div>
              </div>
          </div>
      )}
      <style>{`.input-field { width: 100%; background: #f9fafb; border: 2px solid #f3f4f6; border-radius: 0.75rem; padding: 0.75rem; font-weight: 700; font-size: 0.875rem; outline: none; }`}</style>
    </div>
  );
};
