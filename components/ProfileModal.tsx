
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UserAccount, Business, AddressDetails, SupportTicket, Invoice, AdRequestType, AdRequest, DiscountCode, Rating, SystemFinancialConfig, CouponTarget, LiveStatus, BusinessStory, OpeningHours, Lead, PushCampaign } from '../types';
import { getSectorImage, auditImageQuality, generateMarketingKit, editImageWithAI } from '../services/geminiService';
import { SECTORS, SUBSCRIPTION_PACKS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE, MICRO_PAYMENT_AMOUNT, MOCK_DISCOUNT_CODES, MOCK_LEADS, LEAD_UNLOCK_PRICE, PUSH_NOTIFICATION_PRICE, CREDIT_PACKS, ACTION_COSTS } from '../constants';
import { sendNotification } from '../services/notificationService';
import { stripeService } from '../services/stripeService';
import { uploadBusinessImage } from '../services/supabase';
import { Sparkles, Copy, Loader2, Zap, AlertTriangle, Clock, Calendar, Shield, Image as ImageIcon, Trash2, Star, CheckCircle, Smartphone, Mail, Globe, Lock, Crown, BarChart3, Tag, CreditCard, XCircle, FileText, PlusCircle, Package, Camera, Heart, Video, Save, X, Wand2 } from 'lucide-react';

// ... (Rest of imports and constants are implicit)

const adPrices: Record<AdRequestType, { base: number, final: number }> = {
  '1_day': { base: 14.90, final: BANNER_1_DAY_PRICE },
  '7_days': { base: 49.90, final: BANNER_7_DAYS_PRICE },
  '14_days': { base: 89.90, final: BANNER_14_DAYS_PRICE }
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
  
  // Custom Banner Upload State
  const [customBannerMode, setCustomBannerMode] = useState(false);
  const [customBannerImage, setCustomBannerImage] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // ... (Other state variables) ...
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketDept, setTicketDept] = useState<'marketing' | 'admin' | 'tecnico' | 'contabilidad'>('tecnico');
  const [pushMessage, setPushMessage] = useState('');
  const [isSendingPush, setIsSendingPush] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationDate, setCancellationDate] = useState<string | null>(null);
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [newCardData, setNewCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [isSavingCard, setIsSavingCard] = useState(false);
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

  // ... (Effects and Helper logic same as before) ...
  
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

      if (confirm(`¿Comprar ${pack.label} por ${pack.price}€?`)) {
          const newInvoice: Invoice = {
              id: `INV-CREDIT-${Date.now()}`,
              business_id: business.id,
              business_name: 'ELEMEDE SL',
              business_nif: 'B12345678',
              client_name: business.name,
              client_nif: business.nif,
              date: new Date().toISOString().split('T')[0],
              due_date: new Date().toISOString().split('T')[0],
              base_amount: pack.price / 1.21,
              iva_rate: 21,
              iva_amount: pack.price - (pack.price / 1.21),
              irpf_rate: 0,
              irpf_amount: 0,
              total_amount: pack.price,
              status: 'paid',
              concept: `Recarga Sweet Credits: ${pack.label} (${pack.credits} + ${pack.bonus})`,
              quarter: Math.floor(new Date().getMonth() / 3) + 1
          };
          onGenerateInvoice(newInvoice);
          
          const totalCredits = pack.credits + pack.bonus;
          onUpdateBusiness(business.id, { credits: credits + totalCredits });
          alert(`✅ ¡Recarga exitosa! +${totalCredits} créditos.`);
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
              alert("No se pudo editar la imagen. Intenta otro prompt.");
          }
      } catch (e) {
          console.error(e);
          alert("Error en la edición.");
      } finally {
          setIsEditingLoading(false);
      }
  };

  const handleSaveEditedImage = () => {
      if (!business || !editedImagePreview) return;
      
      // Add as new image
      if (currentImagesCount >= limits.images) {
          alert("Límite de imágenes alcanzado. Reemplazando la original...");
          // Replace logic if full
          if (editingImageIndex !== null) {
              const newImages = [...(business.images || [])];
              newImages[editingImageIndex] = editedImagePreview;
              onUpdateBusiness(business.id, { images: newImages });
          }
      } else {
          // Add new
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
                                       <button onClick={() => handleOpenEdit(idx)} className="bg-white text-purple-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-purple-50 flex items-center gap-2">
                                           <Wand2 size={12}/> Magic Edit
                                       </button>
                                       <div className="flex gap-2">
                                           <button onClick={() => handleDeleteImage(img)} className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600"><Trash2 size={14}/></button>
                                           {business.mainImage !== img && <button onClick={() => handleSetMainImage(img)} className="bg-green-500 text-white px-2 py-1 rounded text-[10px] font-bold">Principal</button>}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               </div>
           )}

           {/* EDIT OVERLAY */}
           {editingImageIndex !== null && business?.images && (
               <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                   <div className="bg-white rounded-[2.5rem] w-full max-w-4xl p-8 shadow-2xl flex flex-col md:flex-row gap-8 relative overflow-hidden">
                       <button onClick={() => { setEditingImageIndex(null); setEditedImagePreview(null); }} className="absolute top-6 right-6 z-10 bg-gray-100 rounded-full p-2 hover:bg-red-100 hover:text-red-500 transition-colors">✕</button>
                       
                       <div className="flex-1 space-y-4">
                           <h3 className="text-2xl font-black text-gray-900 uppercase italic">Editor Mágico IA</h3>
                           <p className="text-xs text-gray-500">Describe cómo quieres transformar tu imagen usando el poder de Gemini Nano Banana.</p>
                           
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
                               <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Prompt de Edición</label>
                               <textarea 
                                   className="w-full bg-purple-50 border border-purple-100 p-4 rounded-2xl font-medium text-sm mt-2 focus:border-purple-300 outline-none h-32 resize-none"
                                   placeholder="Ej: Añadir nieve, filtro vintage, eliminar fondo..."
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
                                   <button 
                                       onClick={handleSaveEditedImage}
                                       className="w-full bg-green-600 text-white py-4 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all shadow-lg"
                                   >
                                       Guardar Resultado
                                   </button>
                               )}
                           </div>
                       </div>
                   </div>
               </div>
           )}

           {activeTab !== 'media' && activeTab !== 'perfil' && (
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
