
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UserAccount, Business, AddressDetails, SupportTicket, Invoice, AdRequestType, AdRequest, DiscountCode, Rating, SystemFinancialConfig, CouponTarget, LiveStatus, BusinessStory, OpeningHours, Lead, PushCampaign } from '../types';
import { getSectorImage, auditImageQuality, generateMarketingKit, editImageWithAI } from '../services/geminiService';
import { SECTORS, SUBSCRIPTION_PACKS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE, MICRO_PAYMENT_AMOUNT, MOCK_DISCOUNT_CODES, MOCK_LEADS, LEAD_UNLOCK_PRICE, PUSH_NOTIFICATION_PRICE, CREDIT_PACKS, ACTION_COSTS } from '../constants';
import { sendNotification } from '../services/notificationService';
import { stripeService } from '../services/stripeService';
import { uploadBusinessImage } from '../services/supabase';
import { Sparkles, Copy, Loader2, Zap, AlertTriangle, Clock, Calendar, Shield, Image as ImageIcon, Trash2, Star, CheckCircle, Smartphone, Mail, Globe, Lock, Crown, BarChart3, Tag, CreditCard, XCircle, FileText, PlusCircle, Package, Camera, Heart, Video, Save, X, Wand2, Eye } from 'lucide-react';
import { SweetGenerator } from './SweetGenerator'; // Import for "Crecimiento" tab

const adPrices: Record<AdRequestType, { final: number }> = {
  '1_day': { final: BANNER_1_DAY_PRICE },
  '7_days': { final: BANNER_7_DAYS_PRICE },
  '14_days': { final: BANNER_14_DAYS_PRICE }
};

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount;
  businesses: Business[];
  onUpdateUser: (user: UserAccount) => void;
  onUpdateBusiness: (id: string, updates: Partial<Business>) => void;
  onLogout: () => void;
  initialTab?: 'perfil' | 'negocio' | 'media' | 'crecimiento';
  onCreateTicket?: (ticket: SupportTicket) => void;
  tickets?: SupportTicket[];
  onGenerateInvoice?: (invoice: Invoice) => void;
  coupons?: DiscountCode[];
  invoices?: Invoice[];
  systemConfig?: SystemFinancialConfig;
  leads?: Lead[];
  onSendPush?: (campaign: PushCampaign) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ 
  isOpen, onClose, user, businesses, onUpdateUser, onUpdateBusiness, onLogout, initialTab = 'perfil', onCreateTicket, tickets, onGenerateInvoice, coupons = [], invoices = [], systemConfig, leads = MOCK_LEADS, onSendPush
}) => {
  const [activeTab, setActiveTab] = useState<'perfil' | 'negocio' | 'media' | 'favoritos' | 'soporte' | 'publicidad' | 'crecimiento' | 'leads'>(initialTab as any);
  
  // Media State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // EDIT IMAGE STATE (NEW)
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [isEditingLoading, setIsEditingLoading] = useState(false);
  const [editedImagePreview, setEditedImagePreview] = useState<string | null>(null);

  // Ephemeral Story State
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [storyText, setStoryText] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image'); 
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketDept, setTicketDept] = useState<'marketing' | 'admin' | 'tecnico' | 'contabilidad'>('tecnico');
  const [editFormData, setEditFormData] = useState<Partial<Business>>({});
  const [openingHours, setOpeningHours] = useState<Record<string, OpeningHours>>({});

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab as any);
    }
  }, [isOpen, initialTab]);

  const business = useMemo(() => 
    user.linkedBusinessId ? businesses.find(b => b.id === user.linkedBusinessId) : null
  , [user.linkedBusinessId, businesses]);

  // --- FILTRADO INTELIGENTE DE LEADS (PRIVACIDAD) ---
  const compatibleLeads = useMemo(() => {
      if (!business || !leads) return [];
      
      return leads.filter(lead => {
          // 1. Filtro Geográfico (Ciudad/Provincia)
          const leadLoc = lead.location.toLowerCase();
          const bizCity = business.city.toLowerCase();
          const bizProv = business.province.toLowerCase();
          
          // Si el lead menciona la ciudad o provincia del negocio
          const isLocationMatch = leadLoc.includes(bizCity) || leadLoc.includes(bizProv);
          
          // 2. Filtro de Sector (Opcional, pero recomendado)
          // Mapeo simple: Boda -> Pasteleria/Mesas Dulces, etc.
          let isSectorMatch = true;
          // (Podríamos añadir lógica compleja aquí, por ahora confiamos en ubicación para máxima oportunidad)

          return isLocationMatch;
      });
  }, [leads, business]);

  useEffect(() => {
      if (business) {
          setEditFormData({
              name: business.name,
              nif: business.nif,
              phone: business.phone,
              address: business.address,
              city: business.city,
              province: business.province,
              cp: business.cp,
              description: business.description || '',
              direccionesAdicionales: business.direccionesAdicionales || []
          });
          if (business.openingHours) {
              setOpeningHours(business.openingHours);
          } else {
              const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
              const defaults: Record<string, OpeningHours> = {};
              days.forEach(d => defaults[d] = { open: '09:00', close: '20:00', closed: false });
              setOpeningHours(defaults);
          }
      }
  }, [business]);

  const currentPack = useMemo(() => {
    if (!business) return null;
    return SUBSCRIPTION_PACKS.find(p => p.id === business.packId);
  }, [business]);

  const limits = currentPack?.limits || { images: 1, tags: 3, videos: 0 };
  const currentImagesCount = (business?.images?.length || 0);
  const credits = business?.credits || 0;

  // --- ACTIONS ---

  const handleBuyCredits = (packId: string) => {
      if (!business || !onGenerateInvoice) return;
      const pack = CREDIT_PACKS.find(p => p.id === packId);
      if (!pack) return;

      if (confirm(`¿Comprar ${pack.label} por ${pack.price.toFixed(2)}€ (IVA incluido)?`)) {
          // Calculate backwards from Total
          const { base, taxAmount, total } = stripeService.calculateFinancials(pack.price, 21);

          const newInvoice: Invoice = {
              id: `INV-CREDIT-${Date.now()}`,
              business_id: business.id,
              business_name: 'ELEMEDE SL',
              business_nif: 'B12345678',
              client_name: business.name,
              client_nif: business.nif,
              date: new Date().toISOString().split('T')[0],
              due_date: new Date().toISOString().split('T')[0],
              base_amount: base,
              iva_rate: 21,
              iva_amount: taxAmount,
              irpf_rate: 0,
              irpf_amount: 0,
              total_amount: total, // Should match pack.price (e.g., 20.00)
              status: 'paid',
              concept: `Recarga Sweet Credits: ${pack.label} (${pack.credits} + ${pack.bonus})`,
              quarter: Math.floor(new Date().getMonth() / 3) + 1
          };
          onGenerateInvoice(newInvoice);
          
          const totalCredits = pack.credits + pack.bonus;
          onUpdateBusiness(business.id, { credits: credits + totalCredits });
          alert(`✅ ¡Recarga exitosa! +${totalCredits} créditos añadidos.`);
      }
  };

  const handleUnlockLead = (leadId: string) => {
      if (!business) return;
      if (credits < ACTION_COSTS.LEAD_UNLOCK) {
          return alert(`Créditos insuficientes. Necesitas ${ACTION_COSTS.LEAD_UNLOCK} créditos.`);
      }
      if (confirm(`¿Desbloquear datos de contacto por ${ACTION_COSTS.LEAD_UNLOCK} créditos?`)) {
          const unlocked = business.unlockedLeads || [];
          onUpdateBusiness(business.id, { 
              unlockedLeads: [...unlocked, leadId],
              credits: credits - ACTION_COSTS.LEAD_UNLOCK
          });
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && business) {
      setIsUploading(true);
      try {
          const publicUrl = await uploadBusinessImage(file, `biz_${business.id}`);
          await handleAddImage(publicUrl);
      } catch (error) {
          console.error(error);
          alert("Error subiendo imagen. Verifica tu conexión.");
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && business) {
          setIsUploadingStory(true);
          try {
              const publicUrl = await uploadBusinessImage(file, `story_${business.id}`);
              
              const newStory: BusinessStory = {
                  id: `st_${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                  type: 'fresh_batch',
                  text: storyText || (storyMediaType === 'video' ? '¡Sweet Reel del día!' : '¡Novedad del día!'),
                  imageUrl: publicUrl,
                  mediaType: storyMediaType
              };

              const cost = storyMediaType === 'video' ? ACTION_COSTS.STORY_VIDEO : 0;
              if (cost > 0 && credits < cost) {
                  throw new Error("Créditos insuficientes");
              }

              onUpdateBusiness(business.id, {
                  stories: [newStory, ...(business.stories || [])].slice(0, 5),
                  credits: credits - cost
              });
              alert("✨ Historia publicada.");
          } catch(e: any) {
              alert(e.message || "Error subiendo historia.");
          } finally {
              setIsUploadingStory(false);
              setStoryText('');
          }
      }
  };
  
  const handleAddImage = async (url: string) => {
      if (!business) return;
      if (currentImagesCount >= limits.images) {
          return alert(`Has alcanzado el límite de ${limits.images} imágenes.`);
      }
      setIsUploading(true);
      try {
          const audit = await auditImageQuality(url);
          if (!audit.passed) {
              alert(`Imagen rechazada: ${audit.reason}`);
              setIsUploading(false);
              return;
          }
          onUpdateBusiness(business.id, { 
              images: [...(business.images || []), url],
              ...( !business.mainImage ? { mainImage: url } : {} )
          });
          setImageUrlInput('');
          setAiPrompt('');
      } catch (e) { console.error(e); } finally { setIsUploading(false); }
  };

  const handleSetMainImage = (url: string) => {
    if (business) onUpdateBusiness(business.id, { mainImage: url });
  };

  const handleDeleteImage = (url: string) => {
    if (!business || !business.images) return;
    const newImages = business.images.filter(img => img !== url);
    const updates: Partial<Business> = { images: newImages };
    if (business.mainImage === url) updates.mainImage = newImages[0] || '';
    onUpdateBusiness(business.id, updates);
  };

  // --- IMAGE EDITING HANDLERS ---
  const handleOpenEdit = (index: number) => {
      setEditingImageIndex(index);
      setEditedImagePreview(null);
      setEditPrompt('');
  };

  const handleGenerateEdit = async () => {
      if (!business || editingImageIndex === null || !editPrompt) return;
      const originalUrl = business.images![editingImageIndex];
      
      setIsEditingLoading(true);
      try {
          const newImageBase64 = await editImageWithAI(originalUrl, editPrompt);
          if (newImageBase64) {
              setEditedImagePreview(newImageBase64);
          } else {
              alert("No se pudo editar la imagen. Intenta simplificar el prompt.");
          }
      } catch (e) {
          console.error(e);
          alert("Error en la edición.");
      } finally {
          setIsEditingLoading(false);
      }
  };

  const handleSaveEditedImage = (replaceOriginal: boolean) => {
      if (!business || !editedImagePreview) return;
      
      // Check limits if adding new
      if (!replaceOriginal && currentImagesCount >= limits.images) {
          return alert(`Límite de imágenes (${limits.images}) alcanzado. Debes reemplazar.`);
      }

      if (replaceOriginal && editingImageIndex !== null) {
          // OVERWRITE LOGIC
          const newImages = [...(business.images || [])];
          newImages[editingImageIndex] = editedImagePreview;
          onUpdateBusiness(business.id, { images: newImages });
      } else {
          // APPEND LOGIC
          onUpdateBusiness(business.id, { 
              images: [...(business.images || []), editedImagePreview] 
          });
      }
      
      setEditingImageIndex(null);
      setEditedImagePreview(null);
  };

  if (!isOpen) return null;

  const navItems = [
    { id: 'perfil', label: 'Mi Perfil', icon: '👤' },
    { id: 'negocio', label: 'Gestión & Monedero', icon: '🏪', hide: user.role !== 'business_owner' },
    { id: 'media', label: 'Media & Escaparate', icon: '📸', hide: user.role !== 'business_owner' },
    { id: 'publicidad', label: 'Marketing', icon: '📢', hide: user.role !== 'business_owner' },
    { id: 'leads', label: 'Oportunidades', icon: '💼', hide: user.role !== 'business_owner' },
    { id: 'crecimiento', label: 'IA Content', icon: '🚀', hide: user.role !== 'business_owner' },
    { id: 'soporte', label: 'Centro Soporte', icon: '🎧', hide: user.role !== 'business_owner' },
    { id: 'favoritos', label: 'Favoritos', icon: '❤️', hide: user.role !== 'user' },
  ].filter(item => !item.hide);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-0 sm:p-2 md:p-4 bg-gray-950/90 backdrop-blur-2xl animate-fade-in overflow-hidden">
      <div className="bg-white rounded-t-[2.5rem] sm:rounded-[3rem] w-full max-w-6xl h-full sm:h-[95vh] lg:h-[90vh] shadow-2xl flex flex-col lg:flex-row overflow-hidden relative">
        <aside className="w-full lg:w-72 bg-gray-50 border-b lg:border-r lg:border-b-0 flex flex-col shrink-0">
           <div className="p-6 flex lg:flex-col gap-4 items-center lg:items-start justify-between w-full">
             <div className="flex lg:flex-col items-center gap-3 text-left lg:text-center shrink-0">
               <div className="w-12 h-12 lg:w-20 lg:h-20 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xl shadow-lg overflow-hidden">
                 {business?.mainImage ? <img src={business.mainImage} className="w-full h-full object-cover" /> : user.name[0]}
               </div>
               <div><h4 className="font-brand font-black text-sm">{business?.name || user.name}</h4></div>
             </div>
           </div>
           <nav className="flex lg:flex-col gap-1 overflow-x-auto p-2">
             {navItems.map(item => (
               <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase ${activeTab === item.id ? 'bg-gray-900 text-white' : 'text-gray-400 hover:bg-gray-100'}`}>
                 <span className="text-lg">{item.icon}</span> {item.label}
               </button>
             ))}
           </nav>
           <div className="mt-auto p-6 hidden lg:block"><button onClick={onLogout} className="w-full py-3 text-[10px] font-black text-red-400 hover:bg-red-50 rounded-xl">Cerrar Sesión</button></div>
        </aside>

        <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto scrollbar-hide bg-white relative">
           <div className="absolute top-6 right-6 hidden lg:block"><button onClick={onClose}>✕</button></div>
           
           {/* --- BUSINESS MANAGEMENT (MONEDERO & STATS) --- */}
           {activeTab === 'negocio' && business && (
               <div className="space-y-8 animate-fade-in">
                   {/* STATS HEADER */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-6 opacity-10"><Crown size={64}/></div>
                           <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Monedero Sweet Credits</p>
                           <h3 className="text-4xl font-black mt-2">{credits}</h3>
                           <div className="mt-6 flex gap-2">
                               {CREDIT_PACKS.map(pack => (
                                   <button 
                                       key={pack.id} 
                                       onClick={() => handleBuyCredits(pack.id)}
                                       className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-colors"
                                   >
                                       +{pack.credits} ({pack.price}€)
                                   </button>
                               ))}
                           </div>
                       </div>
                       
                       <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100 flex flex-col justify-center">
                           <div className="flex items-center gap-3 mb-2">
                               <span className="text-2xl">👁️</span>
                               <span className="text-xs font-bold text-gray-500 uppercase">Visualizaciones</span>
                           </div>
                           <h3 className="text-3xl font-black text-gray-900">{business.stats?.views || 0}</h3>
                           <p className="text-[10px] text-green-500 font-bold mt-1">+12% este mes</p>
                       </div>

                       <div className="bg-white rounded-[2.5rem] p-8 shadow-lg border border-gray-100 flex flex-col justify-center">
                           <div className="flex items-center gap-3 mb-2">
                               <span className="text-2xl">⚡</span>
                               <span className="text-xs font-bold text-gray-500 uppercase">Suscripción</span>
                           </div>
                           <h3 className="text-2xl font-black text-gray-900 uppercase">{currentPack?.label || 'FREE'}</h3>
                           <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">
                               Ciclo: {business.billingCycle === 'annual' ? 'Anual' : 'Mensual'}
                           </p>
                       </div>
                   </div>

                   {/* EDIT FORM (SIMPLIFIED) */}
                   <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                       <h4 className="font-black text-gray-900 uppercase italic mb-6">Datos Básicos</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase">Nombre</label>
                               <input className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                           </div>
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase">Teléfono</label>
                               <input className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm mt-1" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                           </div>
                           <div className="md:col-span-2">
                               <label className="text-[9px] font-black text-gray-400 uppercase">Descripción</label>
                               <textarea className="w-full bg-white border border-gray-200 p-3 rounded-xl font-medium text-sm mt-1 h-24" value={editFormData.description} onChange={e => setEditFormData({...editFormData, description: e.target.value})} />
                           </div>
                       </div>
                       <div className="mt-6 text-right">
                           <button onClick={() => { onUpdateBusiness(business.id, editFormData); alert('Datos guardados'); }} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase hover:bg-orange-600 transition-all">Guardar Cambios</button>
                       </div>
                   </div>
               </div>
           )}

           {/* --- LEADS TAB (OPPORTUNITIES & REQUESTS) --- */}
           {activeTab === 'leads' && (
               <div className="space-y-8 animate-fade-in">
                   {user.role === 'business_owner' ? (
                       // VIEW FOR BUSINESS
                       <>
                           <div className="bg-indigo-50 p-6 rounded-[2rem] flex items-center justify-between border border-indigo-100">
                               <div>
                                   <h3 className="text-xl font-black text-indigo-900 uppercase italic">Oportunidades de Negocio</h3>
                                   <p className="text-xs text-indigo-600 font-bold">Solicitudes de eventos en tu zona ({business?.province})</p>
                               </div>
                               <div className="bg-white px-4 py-2 rounded-xl text-xs font-black shadow-sm">
                                   Saldo: {credits} Créditos
                               </div>
                           </div>
                           
                           {compatibleLeads.length === 0 ? (
                               <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                                   <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">
                                       No hay solicitudes activas en {business?.province} por ahora.
                                   </p>
                               </div>
                           ) : (
                               <div className="space-y-4">
                                   {compatibleLeads.map(lead => {
                                       const isUnlocked = business?.unlockedLeads?.includes(lead.id);
                                       return (
                                           <div key={lead.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-lg relative overflow-hidden group">
                                               <div className="flex justify-between items-start mb-4">
                                                   <div>
                                                       <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">{lead.eventType}</span>
                                                       <h4 className="text-lg font-black text-gray-900 mt-2">{lead.location}</h4>
                                                       <p className="text-xs text-gray-500 font-bold">{lead.date} • {lead.guests} Pax • Presupuesto: {lead.budget}</p>
                                                   </div>
                                                   {isUnlocked ? (
                                                       <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2">
                                                           <CheckCircle size={14}/> Contacto Visible
                                                       </div>
                                                   ) : (
                                                       <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase">
                                                           Bloqueado
                                                       </div>
                                                   )}
                                               </div>
                                               
                                               <div className={`p-4 rounded-xl border-2 ${isUnlocked ? 'bg-green-50 border-green-100' : 'bg-gray-50 border-gray-100 filter blur-[2px] select-none'}`}>
                                                   <p className="font-bold text-sm mb-1">{lead.clientName}</p>
                                                   <p className="text-xs font-mono">{isUnlocked ? lead.clientContact : 'content-hidden-until-unlock'}</p>
                                                   <p className="text-xs text-gray-600 mt-2 italic">"{lead.description}"</p>
                                               </div>

                                               {!isUnlocked && (
                                                   <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <button 
                                                           onClick={() => handleUnlockLead(lead.id)}
                                                           className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-xl hover:bg-indigo-700 transition-all transform hover:scale-105"
                                                       >
                                                           Desbloquear ({ACTION_COSTS.LEAD_UNLOCK} Créditos)
                                                       </button>
                                                   </div>
                                               )}
                                           </div>
                                       );
                                   })}
                               </div>
                           )}
                       </>
                   ) : (
                       // VIEW FOR USER (MY REQUESTS)
                       <>
                           <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-6">Mis Solicitudes</h3>
                           <div className="space-y-4">
                               {leads.filter(l => l.clientName === user.name).length === 0 ? (
                                   <div className="text-center py-20 text-gray-400 font-bold uppercase text-xs">
                                       No has enviado solicitudes aún.
                                   </div>
                               ) : (
                                   leads.filter(l => l.clientName === user.name).map(lead => (
                                       <div key={lead.id} className="bg-white p-6 rounded-[2rem] border-l-8 border-l-orange-400 shadow-md">
                                           <div className="flex justify-between">
                                               <h4 className="font-black text-gray-900">{lead.eventType.toUpperCase()}</h4>
                                               <span className="text-xs font-bold text-gray-400">{lead.date}</span>
                                           </div>
                                           <p className="text-sm text-gray-600 mt-2">{lead.description}</p>
                                           <div className="mt-4 flex gap-2">
                                               <span className="bg-gray-100 px-3 py-1 rounded-full text-[10px] font-bold uppercase text-gray-500">Estado: Enviada</span>
                                           </div>
                                       </div>
                                   ))
                               )}
                           </div>
                       </>
                   )}
               </div>
           )}

           {/* --- FAVORITOS TAB --- */}
           {activeTab === 'favoritos' && (
               <div className="space-y-8 animate-fade-in">
                   <h3 className="text-2xl font-black text-gray-900 uppercase italic mb-6 flex items-center gap-3">
                       <Heart className="text-red-500 fill-red-500" /> Mis Favoritos
                   </h3>
                   {user.favorites && user.favorites.length > 0 ? (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {user.favorites.map(favId => {
                               const biz = businesses.find(b => b.id === favId);
                               if (!biz) return null;
                               return (
                                   <div key={biz.id} className="bg-white p-4 rounded-[2rem] shadow-lg border border-gray-100 flex gap-4 items-center group cursor-pointer hover:shadow-xl transition-all" onClick={() => {/* Navigate logic could go here */}}>
                                       <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0">
                                           <img src={biz.mainImage} className="w-full h-full object-cover" />
                                       </div>
                                       <div className="flex-1 min-w-0">
                                           <h4 className="font-black text-gray-900 truncate">{biz.name}</h4>
                                           <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">{biz.sectorId.replace('_',' ')}</p>
                                           <p className="text-[10px] text-gray-400 truncate mt-1">📍 {biz.address}</p>
                                       </div>
                                       <button 
                                           onClick={(e) => {
                                               e.stopPropagation();
                                               const newFavs = user.favorites?.filter(id => id !== biz.id);
                                               onUpdateUser({...user, favorites: newFavs});
                                           }}
                                           className="w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                                       >
                                           ✕
                                       </button>
                                   </div>
                               );
                           })}
                       </div>
                   ) : (
                       <div className="text-center py-20 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                           <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                           <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">Aún no tienes favoritos guardados.</p>
                       </div>
                   )}
               </div>
           )}

           {/* --- MEDIA TAB (EXISTING + REFINED) --- */}
           {activeTab === 'media' && business && (
               <div className="space-y-8 animate-fade-in">
                   {/* STORY UPLOAD SECTION */}
                   <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                       <h3 className="text-2xl font-black uppercase italic mb-4">Escaparate Efímero</h3>
                       <div className="flex gap-4 items-center">
                           <button onClick={() => storyInputRef.current?.click()} disabled={isUploadingStory} className="bg-white text-orange-600 px-6 py-4 rounded-2xl font-black uppercase text-xs hover:bg-orange-50 transition-all flex items-center gap-2">
                               {isUploadingStory ? <Loader2 className="animate-spin" /> : <Camera size={18} />} Subir
                           </button>
                           <input className="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-white/60 font-medium text-sm" placeholder="Descripción..." value={storyText} onChange={e => setStoryText(e.target.value)} />
                           <input type="file" ref={storyInputRef} className="hidden" accept="image/*,video/*" onChange={handleUploadStory} />
                       </div>
                   </div>

                   {/* GALLERY SECTION */}
                   <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-gray-100">
                       <div className="flex justify-between mb-6">
                           <h2 className="text-xl font-black uppercase italic">Galería</h2>
                           <div className="flex gap-2">
                               <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
                                   {isUploading ? 'Subiendo...' : 'Subir Foto'}
                               </button>
                               <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                           </div>
                       </div>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                           {business.images?.map((img, idx) => (
                               <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group border border-gray-100 shadow-sm">
                                   <img src={img} className="w-full h-full object-cover" />
                                   <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                       <button onClick={() => handleOpenEdit(idx)} className="bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-purple-50 flex items-center gap-2 shadow-lg">
                                           <Wand2 size={12}/> Magic Edit
                                       </button>
                                       <div className="flex gap-2">
                                           <button onClick={() => handleDeleteImage(img)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 shadow-lg"><Trash2 size={14}/></button>
                                           {business.mainImage !== img && <button onClick={() => handleSetMainImage(img)} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold shadow-lg">Principal</button>}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           )}

           {/* --- GROWTH TAB (NEW SWEET GENERATOR) --- */}
           {activeTab === 'crecimiento' && business && (
               <div className="space-y-8 animate-fade-in">
                   <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-8 opacity-20"><Sparkles size={120} /></div>
                       <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">IA Content Studio</h3>
                       <p className="text-sm font-medium text-indigo-200 max-w-lg mb-6">Genera descripciones irresistibles y previsualiza ideas para tus próximos productos usando nuestra inteligencia artificial.</p>
                       
                       <SweetGenerator activeSector={business.sectorId} />
                   </div>
               </div>
           )}

           {/* EDIT OVERLAY (PRESERVED) */}
           {editingImageIndex !== null && business?.images && (
               <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                   <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 relative overflow-hidden">
                       <button onClick={() => { setEditingImageIndex(null); setEditedImagePreview(null); }} className="absolute top-6 right-6 z-10 bg-gray-100 rounded-full p-2 hover:bg-red-100 hover:text-red-500 transition-colors">✕</button>
                       
                       <div className="flex-1 space-y-4">
                           <h3 className="text-2xl font-black text-gray-900 uppercase italic">Editor Mágico IA</h3>
                           <p className="text-xs text-gray-500">Describe cómo quieres transformar tu imagen (Ej: "Añadir luces de navidad", "Quitar fondo", "Hacer más brillante").</p>
                           
                           <div className="relative aspect-video rounded-2xl overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200">
                               {editedImagePreview ? (
                                   <img src={editedImagePreview} className="w-full h-full object-contain" />
                               ) : (
                                   <img src={business.images[editingImageIndex]} className="w-full h-full object-contain" />
                               )}
                               {isEditingLoading && (
                                   <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                       <div className="flex flex-col items-center">
                                           <Loader2 className="animate-spin text-purple-600 mb-2" size={32}/>
                                           <span className="text-[10px] font-black uppercase text-purple-600 animate-pulse">Transformando...</span>
                                       </div>
                                   </div>
                               )}
                           </div>
                       </div>

                       <div className="w-full md:w-80 flex flex-col justify-center space-y-6">
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Instrucción (Prompt)</label>
                               <textarea 
                                   className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-medium text-sm mt-2 focus:border-purple-300 outline-none h-32 resize-none"
                                   placeholder="Ej: Añadir nieve en la ventana..."
                                   value={editPrompt}
                                   onChange={e => setEditPrompt(e.target.value)}
                               />
                           </div>
                           
                           <div className="space-y-3">
                               <button 
                                   onClick={handleGenerateEdit}
                                   disabled={isEditingLoading || !editPrompt}
                                   className="w-full bg-purple-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-purple-700 transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                               >
                                   <Sparkles size={16} /> Generar Cambio
                               </button>
                               {editedImagePreview && (
                                   <div className="grid grid-cols-2 gap-2 animate-fade-in-up">
                                       <button 
                                           onClick={() => handleSaveEditedImage(true)} // REPLACE
                                           className="bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-black uppercase text-[9px] hover:bg-red-100 transition-colors"
                                       >
                                           Reemplazar Original
                                       </button>
                                       <button 
                                           onClick={() => handleSaveEditedImage(false)} // SAVE NEW
                                           className="bg-green-600 text-white py-3 rounded-xl font-black uppercase text-[9px] hover:bg-green-700 transition-colors shadow-lg"
                                       >
                                           Guardar Copia
                                       </button>
                                   </div>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab !== 'media' && activeTab !== 'perfil' && activeTab !== 'negocio' && activeTab !== 'leads' && activeTab !== 'favoritos' && activeTab !== 'crecimiento' && (
               <div className="text-center py-20">
                   <p className="text-gray-400 font-bold uppercase text-xs">Sección {activeTab} en construcción.</p>
               </div>
           )}
           
           {activeTab === 'perfil' && (
               <div className="space-y-8 animate-fade-in">
                   <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100">
                       <h3 className="text-xl font-black text-gray-900 uppercase italic mb-6">Datos de Cuenta</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase">Nombre</label>
                               <p className="font-bold text-gray-900 text-lg">{user.name}</p>
                           </div>
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase">Email</label>
                               <p className="font-bold text-gray-900 text-lg">{user.email}</p>
                           </div>
                           <div>
                               <label className="text-[9px] font-black text-gray-400 uppercase">Rol</label>
                               <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{user.role}</span>
                           </div>
                       </div>
                   </div>
               </div>
           )}
        </main>
      </div>
    </div>
  );
};
