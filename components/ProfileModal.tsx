
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { UserAccount, Business, AddressDetails, SupportTicket, Invoice, AdRequestType, AdRequest, DiscountCode, Rating, SystemFinancialConfig, CouponTarget, LiveStatus, BusinessStory, OpeningHours, Lead, PushCampaign } from '../types';
import { getSectorImage, auditImageQuality, generateMarketingKit } from '../services/geminiService';
import { SECTORS, SUBSCRIPTION_PACKS, BANNER_1_DAY_PRICE, BANNER_7_DAYS_PRICE, BANNER_14_DAYS_PRICE, MICRO_PAYMENT_AMOUNT, MOCK_DISCOUNT_CODES, MOCK_LEADS, LEAD_UNLOCK_PRICE, PUSH_NOTIFICATION_PRICE, CREDIT_PACKS, ACTION_COSTS } from '../constants';
import { sendNotification } from '../services/notificationService';
import { stripeService } from '../services/stripeService';
import { uploadBusinessImage } from '../services/supabase'; // IMPORT REAL UPLOAD
import { Sparkles, Copy, Loader2, Zap, AlertTriangle, Clock, Calendar, Shield, Image as ImageIcon, Trash2, Star, CheckCircle, Smartphone, Mail, Globe, Lock, Crown, BarChart3, Tag, CreditCard, XCircle, FileText, PlusCircle, Package, Camera, Heart, Video, Save, X } from 'lucide-react';

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
  const [imageInputMode, setImageInputMode] = useState<'url' | 'upload' | 'ai'>('url');
  const [imageUrlInput, setImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Ephemeral Story State
  const [isUploadingStory, setIsUploadingStory] = useState(false);
  const storyInputRef = useRef<HTMLInputElement>(null);
  const [storyText, setStoryText] = useState('');
  const [storyMediaType, setStoryMediaType] = useState<'image' | 'video'>('image'); // Toggle for Sweet Reels
  
  // Custom Banner Upload State
  const [customBannerMode, setCustomBannerMode] = useState(false);
  const [customBannerImage, setCustomBannerImage] = useState('');
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Ticket State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketDept, setTicketDept] = useState<'marketing' | 'admin' | 'tecnico' | 'contabilidad'>('tecnico');

  // Push Notification State
  const [pushMessage, setPushMessage] = useState('');
  const [isSendingPush, setIsSendingPush] = useState(false);

  // Cancellation State
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationDate, setCancellationDate] = useState<string | null>(null);

  // Card Edit State
  const [isEditingCard, setIsEditingCard] = useState(false);
  const [newCardData, setNewCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [isSavingCard, setIsSavingCard] = useState(false);

  // Info Editing State
  const [editFormData, setEditFormData] = useState<Partial<Business>>({});

  // Opening Hours State
  const [openingHours, setOpeningHours] = useState<Record<string, OpeningHours>>({});

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab as any);
    }
  }, [isOpen, initialTab]);

  const business = useMemo(() => 
    user.linkedBusinessId ? businesses.find(b => b.id === user.linkedBusinessId) : null
  , [user.linkedBusinessId, businesses]);

  // Sync edit form data when business loads
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
              description: business.description || '', // Ensure description is loaded
              direccionesAdicionales: business.direccionesAdicionales || []
          });
          if (business.openingHours) {
              setOpeningHours(business.openingHours);
          } else {
              // Initialize default hours
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

  const sectorInfo = useMemo(() => {
      if (!business) return null;
      return SECTORS.find(s => s.id === business.sectorId);
  }, [business]);

  // --- LIMITS CALCULATIONS ---
  const limits = currentPack?.limits || { images: 1, tags: 3, videos: 0 };
  const currentImagesCount = (business?.images?.length || 0);
  const currentTagsCount = business?.tags?.length || 0;
  
  // --- CREDITS LOGIC ---
  const credits = business?.credits || 0;

  const handleBuyCredits = (packId: string) => {
      if (!business || !onGenerateInvoice) return;
      const pack = CREDIT_PACKS.find(p => p.id === packId);
      if (!pack) return;

      if (confirm(`¿Comprar ${pack.label} por ${pack.price}€?`)) {
          // Generate Invoice
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

          // Update Balance
          const totalCredits = pack.credits + pack.bonus;
          onUpdateBusiness(business.id, { 
              credits: credits + totalCredits 
          });
          alert(`✅ ¡Recarga exitosa! Se han añadido ${totalCredits} Sweet Credits a tu monedero.`);
      }
  };

  // --- IMAGE UPLOAD LOGIC (REAL) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && business) {
      setIsUploading(true);
      try {
          // PHASE 2: Upload to Supabase Storage
          const publicUrl = await uploadBusinessImage(file, `biz_${business.id}`);
          await handleAddImage(publicUrl);
      } catch (error) {
          console.error(error);
          alert("Error subiendo imagen.");
      } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const handleAddImage = async (url: string) => {
      if (!business) return;
      if (currentImagesCount >= limits.images) {
          return alert(`Has alcanzado el límite de ${limits.images} imágenes de tu plan ${currentPack?.label}.`);
      }

      setIsUploading(true);
      try {
          const audit = await auditImageQuality(url);
          if (!audit.passed) {
              alert(`Imagen rechazada por IA: ${audit.reason} (Score: ${audit.score}/100)`);
              setIsUploading(false);
              return;
          }
      } catch (e) {
          console.error("Audit error", e);
      } finally {
          setIsUploading(false);
      }

      onUpdateBusiness(business.id, { 
          images: [...(business.images || []), url],
          ...( !business.mainImage ? { mainImage: url } : {} )
      });
      setImageUrlInput('');
      setAiPrompt('');
  };

  const handleSetMainImage = (url: string) => {
    if (!business) return;
    onUpdateBusiness(business.id, { mainImage: url });
  };

  const handleDeleteImage = (url: string) => {
    if (!business || !business.images) return;
    if (business.images.length <= 1 && business.images.includes(url)) {
        return alert("Debes tener al menos una imagen en tu galería.");
    }
    const newImages = business.images.filter(img => img !== url);
    const updates: Partial<Business> = { images: newImages };
    if (business.mainImage === url) {
      updates.mainImage = newImages.length > 0 ? newImages[0] : '';
    }
    onUpdateBusiness(business.id, updates);
  };

  // ... (Rest of component functions kept as is) ...
  const handleUpdateCard = () => {
      if (!business) return;
      if (newCardData.number.length < 15 || !newCardData.expiry || !newCardData.cvc) {
          return alert("Por favor revisa los datos de la tarjeta.");
      }

      setIsSavingCard(true);
      setTimeout(() => {
          onUpdateBusiness(business.id, {
              stripeConnection: {
                  ...business.stripeConnection,
                  status: 'connected',
                  last4: newCardData.number.slice(-4),
                  cardBrand: newCardData.number.startsWith('4') ? 'Visa' : 'MasterCard',
              }
          });
          setIsSavingCard(false);
          setIsEditingCard(false);
          setNewCardData({ number: '', expiry: '', cvc: '', name: '' });
          alert("✅ Método de pago actualizado correctamente.");
      }, 1500);
  };

  const handleConfirmCancellation = () => {
      if (!business) return;
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const endDateStr = endDate.toISOString().split('T')[0];

      onUpdateBusiness(business.id, {
          scheduledCancellationDate: endDate.toISOString(),
          adRequests: [], 
          totalAdSpend: 0, 
      });

      setCancellationDate(endDateStr);
      setShowCancelConfirm(false);
      sendNotification('exit', user.email, { name: user.name, endDate: endDateStr });
  };

  const handleUploadStory = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && business) {
          if (storyMediaType === 'video') {
              if (credits < ACTION_COSTS.STORY_VIDEO) {
                  alert(`Saldo insuficiente. Subir un Sweet Reel cuesta ${ACTION_COSTS.STORY_VIDEO} créditos.`);
                  return;
              }
          }

          setIsUploadingStory(true);
          try {
              // REAL UPLOAD FOR STORY
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

              const newCredits = storyMediaType === 'video' ? credits - ACTION_COSTS.STORY_VIDEO : credits;

              onUpdateBusiness(business.id, {
                  stories: [newStory, ...(business.stories || [])].slice(0, 5),
                  credits: newCredits
              });
              alert(storyMediaType === 'video' ? "🎥 ¡Sweet Reel subido!" : "✨ Tu escaparate efímero se ha actualizado.");
          } catch(e) {
              alert("Error subiendo historia.");
          } finally {
              setIsUploadingStory(false);
              setStoryText('');
          }
      }
  };

  const handleUpdateBusinessInfo = () => {
      if (!business) return;
      onUpdateBusiness(business.id, { ...editFormData, openingHours });
      alert("Ficha de negocio actualizada correctamente. Los cambios son visibles para los clientes inmediatamente.");
  };

  const handleBuyExtraLocation = () => {
      if (!business || !currentPack) return;
      const price = currentPack.extraLocationPrice;
      
      if (confirm(`AÑADIR SEDE EXTRA:\n\nEsto añadirá una nueva ubicación a tu perfil.\nCoste: ${price}€/mes añadidos a tu suscripción.\n\n¿Confirmar y procesar cobro proporcional de este mes?`)) {
          const newInvoice: Invoice = {
              id: `INV-SEDE-${Date.now()}`,
              business_id: business.id,
              business_name: 'ELEMEDE SL',
              business_nif: 'B12345678',
              client_name: business.name,
              client_nif: business.nif,
              date: new Date().toISOString().split('T')[0],
              due_date: new Date().toISOString().split('T')[0],
              base_amount: price / 1.21,
              iva_rate: 21,
              iva_amount: price - (price / 1.21),
              irpf_rate: 0,
              irpf_amount: 0,
              total_amount: price,
              status: 'paid',
              concept: `Alta Sede Adicional (Prorrateo) - Plan ${currentPack.label}`,
              quarter: Math.floor(new Date().getMonth() / 3) + 1
          };
          if (onGenerateInvoice) onGenerateInvoice(newInvoice);

          const newSede: AddressDetails = {
              calle: 'Nueva Dirección (Editar)',
              cp: '',
              ciudad: business.city,
              provincia: business.province,
              lat: business.lat + 0.01,
              lng: business.lng + 0.01
          };

          const updatedSedes = [...(business.direccionesAdicionales || []), newSede];
          onUpdateBusiness(business.id, { direccionesAdicionales: updatedSedes });
          setEditFormData(prev => ({ ...prev, direccionesAdicionales: updatedSedes }));
          
          alert("✅ Sede añadida y suscripción actualizada. Edita los detalles de la nueva dirección abajo.");
      }
  };

  const handleUpdateSede = (index: number, field: keyof AddressDetails, value: string) => {
      const currentSedes = [...(editFormData.direccionesAdicionales || [])];
      if (currentSedes[index]) {
          currentSedes[index] = { ...currentSedes[index], [field]: value };
          setEditFormData({ ...editFormData, direccionesAdicionales: currentSedes });
      }
  };

  const handleDeleteSede = (index: number) => {
      if(confirm("¿Eliminar esta sede? Dejarás de pagar por ella en el próximo ciclo de facturación.")) {
          const currentSedes = [...(editFormData.direccionesAdicionales || [])];
          const newSedes = currentSedes.filter((_, i) => i !== index);
          setEditFormData({ ...editFormData, direccionesAdicionales: newSedes });
          if(business) onUpdateBusiness(business.id, { direccionesAdicionales: newSedes });
      }
  };

  const handleToggleTag = (tag: string) => {
    if (!business) return;
    const currentTags = business.tags || [];
    if (currentTags.includes(tag)) {
      onUpdateBusiness(business.id, { tags: currentTags.filter(t => t !== tag) });
    } else {
      if (currentTags.length < limits.tags) {
        onUpdateBusiness(business.id, { tags: [...currentTags, tag] });
      } else {
        alert(`🔒 Límite de etiquetas alcanzado (${limits.tags}) para tu plan ${currentPack?.label}.`);
      }
    }
  };

  const handleCustomBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && business) {
          try {
              const url = await uploadBusinessImage(file, `ad_${business.id}`);
              setCustomBannerImage(url);
          } catch (e) {
              alert("Error subiendo banner.");
          }
      }
  };

  const handleGenerateImage = async () => {
    if (!aiPrompt || !business) return;
    setIsGenerating(true);
    try {
      const url = await getSectorImage(aiPrompt);
      if (url) {
        handleAddImage(url);
      } else {
          alert("La IA no pudo generar una imagen con esa descripción.");
      }
    } catch (error) {
      alert("Error de conexión con el servicio de IA.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUnlockLead = (lead: Lead) => {
      if (!business) return;
      const isDominio = business.packId === 'super_top';
      const cost = isDominio ? 0 : ACTION_COSTS.LEAD_UNLOCK;

      if (credits < cost) {
          alert(`Saldo insuficiente. Necesitas ${cost} créditos. Recarga en tu monedero.`);
          setActiveTab('negocio');
          return;
      }

      if (confirm(`¿Desbloquear este lead por ${cost} Sweet Credits?`)) {
          if (cost > 0) onUpdateBusiness(business.id, { credits: credits - cost });
          const updatedUnlockedLeads = [...(business.unlockedLeads || []), lead.id];
          onUpdateBusiness(business.id, { unlockedLeads: updatedUnlockedLeads });
          alert("Lead desbloqueado. Ahora puedes ver los datos de contacto.");
      }
  };

  const handleRequestAd = (type: AdRequestType) => {
      if (!business) return;
      const pricing = adPrices[type];
      
      if (confirm(`SOLICITUD DE PUBLICIDAD:\n\nTipo: "${type.replace('_', ' ')}"\nPrecio: ${pricing.final.toFixed(2)}€\n\n¿Confirmar y procesar cobro inmediato?`)) {
          const newRequest: AdRequest = {
              id: Math.random().toString(36).substr(2, 9),
              type: type,
              requestDate: new Date().toISOString(),
              status: 'pending',
              price: pricing.final,
              durationDays: type === '1_day' ? 1 : type === '7_days' ? 7 : 14
          };
          
          if (customBannerMode && customBannerImage) {
              alert("Tu diseño personalizado se ha adjuntado a la solicitud para revisión.");
          }
          
          onUpdateBusiness(business.id, { 
              adRequests: [...(business.adRequests || []), newRequest] 
          });
          alert("✅ Solicitud enviada. El equipo de marketing revisará tu campaña y diseño.");
          setCustomBannerMode(false);
          setCustomBannerImage('');
      }
  };

  const handleSendFlashPush = () => {
      if (!business || !pushMessage) return;
      const cost = ACTION_COSTS.PUSH_NOTIFICATION;

      if (credits < cost) {
          alert(`Saldo insuficiente. Necesitas ${cost} créditos para enviar una Push Flash.`);
          setActiveTab('negocio');
          return;
      }
      
      if (confirm(`ALERTAS FLASH:\n\nEnviar a usuarios en 3km a la redonda.\nCoste: ${cost} Sweet Credits.\n\n¿Confirmar envío?`)) {
          setIsSendingPush(true);
          onUpdateBusiness(business.id, { credits: credits - cost });

          const newCampaign: PushCampaign = {
              id: Math.random().toString(36).substr(2, 9),
              businessId: business.id,
              businessName: business.name,
              message: pushMessage,
              sentAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 3600000).toISOString(),
              reach: 1500,
              cost: cost
          };

          if (onSendPush) onSendPush(newCampaign);
          
          setTimeout(() => {
              setIsSendingPush(false);
              setPushMessage('');
              alert(`✅ Notificación enviada. Se han descontado ${cost} créditos.`);
          }, 1500);
      }
  };

  const handleCreateSupportTicket = (e: React.FormEvent) => {
      e.preventDefault();
      if (!onCreateTicket) return;

      const newTicket: SupportTicket = {
          id: Math.random().toString(36).substr(2, 9),
          user_id: user.id,
          user_name: user.name,
          subject: ticketSubject,
          description: ticketDesc,
          department: ticketDept,
          status: 'open',
          created_at: new Date().toISOString()
      };

      onCreateTicket(newTicket);
      setTicketSubject('');
      setTicketDesc('');
      alert("Ticket creado correctamente. Te responderemos pronto.");
  };

  // --- RENDER ---
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
        
        {/* CLOSE BUTTON */}
        <button 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 bg-gray-100 hover:bg-red-100 hover:text-red-500 text-gray-500 p-2 rounded-full transition-colors lg:hidden"
        >
            ✕
        </button>

        {/* SIDEBAR NAVIGATION */}
        <aside className="w-full lg:w-72 bg-gray-50 border-b lg:border-r lg:border-b-0 flex flex-col shrink-0">
          <div className="p-6 flex lg:flex-col gap-4 items-center lg:items-start justify-between w-full">
            <div className="flex lg:flex-col items-center gap-3 text-left lg:text-center shrink-0">
              <div className="w-12 h-12 lg:w-20 lg:h-20 bg-gray-900 rounded-xl flex items-center justify-center text-white text-xl shadow-lg border-2 border-white overflow-hidden">
                {business?.mainImage ? <img src={business.mainImage} className="w-full h-full object-cover" /> : user.name[0]}
              </div>
              <div className="min-w-0">
                <h4 className="font-brand font-black text-gray-900 uppercase tracking-tighter truncate text-sm lg:text-base">
                  {business?.name || user.name}
                </h4>
                <p className="text-[9px] text-orange-600 font-black uppercase tracking-widest">{currentPack?.label || 'Usuario'}</p>
                {/* Credits Display */}
                {business && (
                    <div className="mt-2 bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-[9px] font-black uppercase inline-block border border-orange-200">
                        🍬 {credits} Créditos
                    </div>
                )}
              </div>
            </div>
          </div>
          <nav className="flex lg:flex-col gap-1 overflow-x-auto p-2 lg:p-4 w-full scrollbar-hide">
            {navItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id as any)} className={`flex-1 lg:flex-none flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === item.id ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100'}`}>
                <span className="text-lg">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-auto p-6 border-t border-gray-100 hidden lg:block">
            <button onClick={onLogout} className="w-full py-3 text-[10px] font-black text-red-400 hover:text-red-600 uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-all">
                🚪 Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 p-4 sm:p-8 lg:p-12 overflow-y-auto scrollbar-hide bg-white relative">
          
          <div className="absolute top-6 right-6 hidden lg:block">
              <button onClick={onClose} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-900 transition-colors">
                  ✕
              </button>
          </div>

          {/* ... (User Profile Content) ... */}
          {activeTab === 'perfil' && (
            <div className="space-y-8 max-w-2xl animate-fade-in">
              <h2 className="text-3xl font-brand font-black text-gray-900 uppercase italic">Ajustes de Perfil</h2>
              <div className="space-y-4 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nombre</label>
                      <input className="profile-input" value={user.name} onChange={e => onUpdateUser({...user, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                      <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                      <input className="profile-input bg-gray-100 text-gray-500" readOnly value={user.email} />
                  </div>
                  
                  {/* PASSWORD CHANGE */}
                  <div className="pt-4 border-t border-gray-200 mt-4">
                      <h4 className="text-xs font-black text-gray-900 uppercase mb-4">Cambiar Contraseña</h4>
                      <div className="space-y-3">
                          <input 
                              type="password" 
                              className="profile-input" 
                              placeholder="Nueva Contraseña" 
                              value={newPassword}
                              onChange={e => setNewPassword(e.target.value)}
                          />
                          <input 
                              type="password" 
                              className="profile-input" 
                              placeholder="Confirmar Contraseña" 
                              value={confirmNewPassword}
                              onChange={e => setConfirmNewPassword(e.target.value)}
                          />
                          <button 
                              onClick={() => {
                                  if (newPassword !== confirmNewPassword) return alert("Las contraseñas no coinciden");
                                  if (newPassword.length < 6) return alert("Mínimo 6 caracteres");
                                  onUpdateUser({ ...user, password_hash: newPassword });
                                  alert("Contraseña actualizada.");
                                  setNewPassword('');
                                  setConfirmNewPassword('');
                              }}
                              className="bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase"
                          >
                              Actualizar Clave
                          </button>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* ... (Business Content - Preserved same structure but injected new handlers) ... */}
          {activeTab === 'negocio' && business && currentPack && (
            <div className="space-y-12 animate-fade-in pb-20">
                {/* 1. PLAN DASHBOARD & ACTIONS */}
                <div className={`rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl ${currentPack.colorClass.replace('bg-', 'bg-gradient-to-br from-').replace('50', '600 to-gray-900')}`}>
                    <div className="absolute top-0 right-0 p-8 opacity-20 transform rotate-12"><Crown size={120} /></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <span className="bg-white/20 backdrop-blur px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/30">
                                    Tu Plan Actual
                                </span>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white text-gray-900`}>
                                    {business.status}
                                </span>
                            </div>
                            <h2 className="text-4xl font-brand font-black uppercase italic tracking-tighter mb-2">{currentPack.label}</h2>
                            <p className="text-white/80 text-sm font-medium max-w-md">
                                Próxima renovación: <span className="font-bold text-white">{(business.stripeConnection?.nextBillingDate || 'Calculando...')}</span> ({business.billingCycle === 'annual' ? 'Ciclo Anual' : 'Ciclo Mensual'})
                            </p>
                        </div>
                        
                        <div className="flex gap-3">
                            <button className="bg-white text-gray-900 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">
                                Mejorar Plan ⚡
                            </button>
                        </div>
                    </div>
                </div>

                {/* 2. SWEET WALLET (CREDITS SYSTEM) */}
                <div className="bg-gradient-to-br from-orange-50 to-pink-50 p-8 rounded-[2.5rem] border-2 border-white shadow-lg relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-gray-900 uppercase italic text-lg flex items-center gap-2"><Package size={20} className="text-orange-500"/> Monedero Sweet Credits</h4>
                        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-orange-100 flex items-center gap-2">
                            <span className="text-2xl">🍬</span>
                            <span className="text-2xl font-black text-orange-600">{credits}</span>
                        </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-6 font-medium">Usa tus créditos para enviar notificaciones Push, destacar ofertas y desbloquear leads.</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {CREDIT_PACKS.map(pack => (
                            <div key={pack.id} className="bg-white p-4 rounded-2xl border border-gray-100 hover:border-orange-200 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => handleBuyCredits(pack.id)}>
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{pack.label}</span>
                                    {pack.bonus > 0 && <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">+{pack.bonus} Gratis</span>}
                                </div>
                                <div className="flex items-end gap-1 mb-3">
                                    <span className="text-3xl font-black text-gray-900">{pack.credits + pack.bonus}</span>
                                    <span className="text-xs font-bold text-gray-400 mb-1">créditos</span>
                                </div>
                                <button className="w-full bg-orange-100 text-orange-700 py-2 rounded-xl text-[10px] font-black uppercase group-hover:bg-orange-600 group-hover:text-white transition-colors">
                                    Comprar {pack.price}€
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                
                {/* 3. PAYMENT METHOD (CUSTOMER VIEW) - EDICIÓN HABILITADA */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-gray-900 uppercase italic text-lg flex items-center gap-2"><CreditCard size={20} className="text-indigo-600"/> Tu Método de Pago</h4>
                        {!isEditingCard && (
                            <button onClick={() => setIsEditingCard(true)} className="text-indigo-600 text-[10px] font-black uppercase hover:underline flex items-center gap-1">
                                <CreditCard size={14}/> Editar Tarjeta
                            </button>
                        )}
                    </div>
                    
                    {isEditingCard ? (
                        <div className="bg-gray-50 p-6 rounded-2xl border border-indigo-100 animate-fade-in">
                            <h5 className="text-xs font-black uppercase mb-4 text-indigo-900">Actualizar Datos de Facturación</h5>
                            <div className="space-y-4">
                                <input 
                                    className="w-full bg-white border border-gray-200 rounded-xl p-3 font-bold text-sm outline-none" 
                                    placeholder="Nombre del Titular" 
                                    value={newCardData.name} 
                                    onChange={e => setNewCardData({...newCardData, name: e.target.value})} 
                                />
                                <div className="relative">
                                    <input 
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 font-mono text-sm outline-none pl-10" 
                                        placeholder="0000 0000 0000 0000" 
                                        maxLength={19} 
                                        value={newCardData.number} 
                                        onChange={e => setNewCardData({...newCardData, number: e.target.value})} 
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={16} /></span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input 
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 font-mono text-sm outline-none text-center" 
                                        placeholder="MM/YY" 
                                        maxLength={5} 
                                        value={newCardData.expiry} 
                                        onChange={e => setNewCardData({...newCardData, expiry: e.target.value})} 
                                    />
                                    <input 
                                        type="password"
                                        className="w-full bg-white border border-gray-200 rounded-xl p-3 font-mono text-sm outline-none text-center" 
                                        placeholder="CVC" 
                                        maxLength={3} 
                                        value={newCardData.cvc} 
                                        onChange={e => setNewCardData({...newCardData, cvc: e.target.value})} 
                                    />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button 
                                        onClick={handleUpdateCard} 
                                        disabled={isSavingCard}
                                        className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs uppercase hover:bg-indigo-700 transition-colors shadow-md disabled:opacity-70 flex justify-center gap-2"
                                    >
                                        {isSavingCard ? <Loader2 className="animate-spin" /> : <Save size={14} />} Guardar
                                    </button>
                                    <button onClick={() => setIsEditingCard(false)} className="px-6 bg-gray-200 text-gray-600 rounded-xl font-bold text-xs hover:bg-gray-300">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tarjeta Vinculada</label>
                                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                        <div className="w-8 h-5 bg-gray-200 rounded flex items-center justify-center text-[8px] font-bold">CARD</div>
                                        <span className="text-xs font-bold text-gray-700">•••• •••• •••• {business.stripeConnection?.last4 || '0000'}</span>
                                        <span className="text-[9px] text-gray-400 uppercase ml-auto">{business.stripeConnection?.cardBrand || 'VISA'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Próximo Cobro</label>
                                    <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold">
                                        {(business.stripeConnection?.nextBillingDate || 'Calculando...')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. BUSINESS INFO FORM (WITH DESCRIPTION) */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-gray-100 shadow-sm space-y-6">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                        <h4 className="font-black text-gray-900 uppercase italic text-lg flex items-center gap-2"><FileText size={20} className="text-orange-500"/> Información Pública</h4>
                        <button onClick={handleUpdateBusinessInfo} className="bg-indigo-600 text-white px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-md">
                            Guardar Cambios
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Nombre Comercial</label>
                            <input className="profile-input" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Teléfono Público</label>
                            <input className="profile-input" value={editFormData.phone} onChange={e => setEditFormData({...editFormData, phone: e.target.value})} />
                        </div>
                        
                        {/* DESCRIPTION FIELD RESTORED */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Descripción del Negocio (Visible en Perfil)</label>
                            <textarea 
                                className="profile-input min-h-[150px] leading-relaxed" 
                                value={editFormData.description} 
                                onChange={e => setEditFormData({...editFormData, description: e.target.value})}
                                placeholder="Describe tu historia, tus especialidades y qué hace único a tu negocio..."
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Dirección Principal</label>
                            <input className="profile-input" value={editFormData.address} onChange={e => setEditFormData({...editFormData, address: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ciudad / Provincia</label>
                            <div className="flex gap-2">
                                <input className="profile-input" value={editFormData.city} onChange={e => setEditFormData({...editFormData, city: e.target.value})} />
                                <input className="profile-input" value={editFormData.province} onChange={e => setEditFormData({...editFormData, province: e.target.value})} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 5. TAGS MANAGEMENT */}
                <div className="bg-white p-8 rounded-[2.5rem] border-2 border-orange-50 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="font-black text-gray-900 uppercase italic text-lg flex items-center gap-2">
                            <Tag size={20} className="text-orange-500"/> Etiquetas del Sector
                        </h4>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {currentTagsCount} / {limits.tags} Usadas
                        </span>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        {sectorInfo?.tags?.map(tag => {
                            const isActive = business.tags?.includes(tag);
                            const isLimitReached = currentTagsCount >= limits.tags;
                            
                            return (
                                <button
                                    key={tag}
                                    onClick={() => handleToggleTag(tag)}
                                    disabled={!isActive && isLimitReached}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                                        isActive 
                                            ? 'bg-orange-500 text-white border-orange-500 shadow-lg scale-105' 
                                            : isLimitReached 
                                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-orange-300 hover:text-orange-500'
                                    }`}
                                >
                                    {isActive && '✓ '} {tag}
                                </button>
                            );
                        })}
                    </div>
                    {currentTagsCount >= limits.tags && (
                        <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-2">
                            <Lock size={14} /> Has alcanzado el límite de etiquetas de tu plan. Mejora tu plan para seleccionar más.
                        </p>
                    )}
                </div>

                {/* 6. LOCATIONS MANAGEMENT */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-black text-gray-900 uppercase italic text-lg">Sedes Adicionales</h4>
                        <button onClick={handleBuyExtraLocation} className="bg-green-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 shadow-md flex items-center gap-2">
                            <PlusCircle size={14} /> Añadir Sede ({currentPack.extraLocationPrice}€/mes)
                        </button>
                    </div>
                    
                    {(!editFormData.direccionesAdicionales || editFormData.direccionesAdicionales.length === 0) ? (
                        <div className="p-8 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                            Solo tienes la sede principal activa.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {editFormData.direccionesAdicionales.map((sede, idx) => (
                                <div key={idx} className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 relative group animate-fade-in">
                                    <button onClick={() => handleDeleteSede(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2">
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className="md:col-span-2">
                                            <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Dirección Sede #{idx+1}</label>
                                            <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" placeholder="Calle, Número..." value={sede.calle} onChange={e => handleUpdateSede(idx, 'calle', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">CP</label>
                                            <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" value={sede.cp} onChange={e => handleUpdateSede(idx, 'cp', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Ciudad</label>
                                            <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" value={sede.ciudad} onChange={e => handleUpdateSede(idx, 'ciudad', e.target.value)} />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* 7. SUBSCRIPTION CANCELLATION (DANGER ZONE) - ENHANCED */}
                <div className="bg-red-50 p-8 rounded-[2.5rem] border border-red-100">
                    <h4 className="font-black text-red-900 uppercase italic text-lg mb-4 flex items-center gap-2"><XCircle size={20}/> Zona de Peligro</h4>
                    
                    {business.scheduledCancellationDate ? (
                        <div className="bg-white p-6 rounded-2xl border-2 border-red-200 text-center animate-fade-in">
                            <p className="text-sm font-black text-red-600 uppercase tracking-widest mb-2">⚠ Cancelación Programada</p>
                            <p className="text-xs text-gray-600 font-medium mb-1">
                                Tu acceso y visibilidad se perderán el día:
                            </p>
                            <p className="text-xl font-black text-gray-900 mb-4">{business.scheduledCancellationDate.split('T')[0]}</p>
                            <div className="bg-red-50 p-3 rounded-xl inline-block text-[10px] text-red-800 font-bold border border-red-100">
                                Estado: Solo Mapa (Al finalizar periodo)
                            </div>
                        </div>
                    ) : showCancelConfirm ? (
                        <div className="bg-white p-6 rounded-2xl border-2 border-red-500 shadow-xl animate-shake">
                            <h5 className="font-black text-red-600 uppercase text-sm mb-3">¿Confirmar Cancelación?</h5>
                            <p className="text-xs text-gray-600 font-medium mb-4 leading-relaxed">
                                Al confirmar, perderás tus privilegios Premium al final del ciclo actual.
                                <br/><br/>
                                <strong className="text-red-600">• Se cancelará toda tu publicidad activa inmediatamente.</strong>
                                <br/>
                                <strong className="text-red-600">• Tu negocio solo será visible en el mapa (sin destacar).</strong>
                                <br/>
                                <strong className="text-red-600">• No se te cobrará nada más.</strong>
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={handleConfirmCancellation}
                                    className="bg-red-600 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg flex-1"
                                >
                                    Sí, Cancelar Definitivamente
                                </button>
                                <button 
                                    onClick={() => setShowCancelConfirm(false)}
                                    className="bg-gray-100 text-gray-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-200 flex-1"
                                >
                                    Volver
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <p className="text-xs text-red-700 font-medium max-w-xl">
                                Si cancelas tu suscripción, tu perfil dejará de ser visible en los listados y perderás tu posicionamiento. No se realizarán más cobros.
                            </p>
                            <button 
                                onClick={() => setShowCancelConfirm(true)}
                                className="bg-white text-red-600 border border-red-200 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                            >
                                Cancelar Suscripción
                            </button>
                        </div>
                    )}
                </div>
            </div>
          )}

          {/* ... (Rest of the tabs: Publicidad, Media, Leads, Soporte - Preserved) ... */}
          {/* PUBLICIDAD TAB (ENHANCED WITH SAVINGS PACKS & WALLET) */}
          {activeTab === 'publicidad' && business && (
              <div className="space-y-12 animate-fade-in">
                  {/* Credits Balance Header */}
                  <div className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl border border-gray-100">
                      <div>
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Disponible</p>
                          <p className="text-2xl font-black text-orange-600">{credits} Créditos</p>
                      </div>
                      <button onClick={() => setActiveTab('negocio')} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-[9px] font-black uppercase hover:bg-orange-200 transition-colors">
                          Recargar
                      </button>
                  </div>

                  {/* ADVERTISING OPTIONS */}
                  <div className="space-y-6">
                      <h4 className="text-xl font-black text-gray-900 uppercase italic px-2">Campañas Individuales</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {(['1_day', '7_days', '14_days'] as const).map(type => {
                              const pricing = adPrices[type];
                              return (
                                  <div key={type} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 hover:border-orange-200 shadow-md hover:shadow-xl transition-all text-center group cursor-pointer flex flex-col h-full" onClick={() => handleRequestAd(type)}>
                                      <div className="w-16 h-16 bg-gray-900 text-white rounded-full flex items-center justify-center mx-auto mb-4 text-2xl group-hover:scale-110 transition-transform">🚀</div>
                                      <h5 className="font-black text-gray-900 uppercase tracking-widest mb-1">{type.replace('_', ' ')}</h5>
                                      <div className="flex justify-center items-baseline gap-1 mb-4">
                                          <span className="text-2xl font-black text-orange-600">{pricing.final.toFixed(2)}€</span>
                                          {pricing.final < pricing.base && <span className="text-xs text-gray-400 line-through">{pricing.base.toFixed(2)}€</span>}
                                      </div>
                                      
                                      {/* Custom Banner Toggle inside Card */}
                                      <div className="mt-auto pt-4 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                                          <label className="flex items-center justify-center gap-2 cursor-pointer text-[9px] font-bold uppercase text-gray-500 hover:text-orange-600">
                                              <input 
                                                type="checkbox" 
                                                className="accent-orange-500"
                                                checked={customBannerMode}
                                                onChange={(e) => setCustomBannerMode(e.target.checked)}
                                              />
                                              Usar Diseño Propio
                                          </label>
                                          {customBannerMode && (
                                              <div className="mt-2">
                                                  <button 
                                                    onClick={() => bannerInputRef.current?.click()} 
                                                    className="w-full bg-gray-100 text-gray-600 py-2 rounded-lg text-[8px] font-black uppercase hover:bg-gray-200"
                                                  >
                                                      {customBannerImage ? 'Imagen Cargada ✓' : 'Subir Banner'}
                                                  </button>
                                                  <input 
                                                    type="file" 
                                                    ref={bannerInputRef} 
                                                    className="hidden" 
                                                    accept="image/*"
                                                    onChange={handleCustomBannerUpload} 
                                                  />
                                              </div>
                                          )}
                                      </div>

                                      <button className="mt-4 w-full bg-gray-900 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase group-hover:bg-orange-600 transition-colors">
                                          Solicitar
                                      </button>
                                  </div>
                              );
                          })}
                      </div>
                  </div>

                  {/* Existing Push Notification Section */}
                  <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-lg">
                      <div className="flex justify-between items-start mb-4">
                          <div>
                              <h4 className="text-lg font-black text-gray-900 uppercase italic">Notificaciones Push Flash</h4>
                              <p className="text-xs text-gray-500">Envía una alerta directa a móviles en 3km a la redonda.</p>
                          </div>
                          <span className="bg-red-100 text-red-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">{PUSH_NOTIFICATION_PRICE}€ / Envío</span>
                      </div>
                      <textarea 
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 font-medium text-sm h-24 mb-4 outline-none focus:border-red-400"
                          placeholder="Ej: ¡Acaban de salir croissants calientes! 2x1 solo próxima hora."
                          value={pushMessage}
                          onChange={e => setPushMessage(e.target.value)}
                          maxLength={100}
                      />
                      <div className="flex justify-between items-center">
                          <span className="text-[10px] font-bold text-gray-400">{pushMessage.length}/100</span>
                          <button onClick={handleSendFlashPush} disabled={!pushMessage || isSendingPush} className="bg-red-600 text-white px-6 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-red-700 shadow-xl disabled:opacity-50 flex items-center gap-2">
                              {isSendingPush ? <Loader2 className="animate-spin" /> : <Zap size={16} />} Enviar Alerta
                          </button>
                      </div>
                  </div>
              </div>
          )}

          {/* MEDIA TAB (Updated with EPHEMERAL SHOWCASE & SWEET REELS) */}
          {activeTab === 'media' && business && (
              <div className="space-y-12 animate-fade-in">
                  
                  {/* ESCAPARATE EFÍMERO (DAILY SPECIAL) */}
                  <div className="bg-gradient-to-r from-pink-500 to-orange-400 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-20 text-9xl">📸</div>
                      <div className="relative z-10">
                          <div className="flex justify-between items-start mb-4">
                              <div>
                                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">Escaparate Efímero</h3>
                                  <p className="text-xs font-medium opacity-90 max-w-lg mt-1">
                                      {storyMediaType === 'image' 
                                        ? "Sube una foto de lo que acabas de hornear. Caduca en 24h. Gratis 1/día."
                                        : "🎥 SWEET REELS: Sube un vídeo corto (15s) para mostrar la textura y el movimiento. Coste: 2 Créditos."}
                                  </p>
                              </div>
                              <div className="flex bg-white/20 backdrop-blur rounded-xl p-1">
                                  <button 
                                    onClick={() => setStoryMediaType('image')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${storyMediaType === 'image' ? 'bg-white text-orange-600 shadow-md' : 'text-white hover:bg-white/10'}`}
                                  >
                                      Foto (Gratis)
                                  </button>
                                  <button 
                                    onClick={() => setStoryMediaType('video')}
                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 ${storyMediaType === 'video' ? 'bg-white text-pink-600 shadow-md' : 'text-white hover:bg-white/10'}`}
                                  >
                                      <Video size={10} /> Reel (2 Credits)
                                  </button>
                              </div>
                          </div>

                          <div className="flex gap-4 items-center">
                              <button 
                                  onClick={() => storyInputRef.current?.click()}
                                  className="bg-white text-orange-600 px-6 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-orange-50 transition-all shadow-lg flex items-center gap-2 shrink-0"
                                  disabled={isUploadingStory}
                              >
                                  {isUploadingStory ? <Loader2 className="animate-spin" /> : (storyMediaType === 'video' ? <Video size={18} /> : <Camera size={18} />)} 
                                  {storyMediaType === 'video' ? 'Subir Reel' : 'Subir Foto'}
                              </button>
                              <input 
                                  className="flex-1 bg-white/10 border border-white/30 rounded-xl px-4 py-4 text-white placeholder-white/60 font-medium text-sm outline-none focus:bg-white/20"
                                  placeholder={storyMediaType === 'video' ? "Descripción del vídeo..." : "Ej: Tarta de Queso recién salida..."}
                                  value={storyText}
                                  onChange={e => setStoryText(e.target.value)}
                              />
                              <input 
                                  type="file" 
                                  ref={storyInputRef} 
                                  className="hidden" 
                                  accept={storyMediaType === 'video' ? "video/*" : "image/*"}
                                  onChange={handleUploadStory}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div className="flex justify-between items-center">
                          <h2 className="text-2xl font-brand font-black text-gray-900 uppercase italic">Galería Permanente</h2>
                          <div className="bg-gray-100 px-4 py-2 rounded-full text-xs font-bold text-gray-600">
                              {currentImagesCount} / {limits.images} Imágenes
                          </div>
                      </div>

                      {/* UPLOAD CONTROLS */}
                      <div className="bg-white p-6 rounded-[2.5rem] shadow-lg border border-gray-100">
                          <div className="flex gap-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                              <button onClick={() => setImageInputMode('url')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${imageInputMode === 'url' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}>🔗 Enlace Web</button>
                              <button onClick={() => setImageInputMode('upload')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${imageInputMode === 'upload' ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-400'}`}>📂 Subir PC</button>
                              <button onClick={() => setImageInputMode('ai')} className={`px-6 py-3 rounded-2xl font-black text-xs uppercase transition-all whitespace-nowrap ${imageInputMode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-50 text-gray-400'}`}>✨ Generar IA</button>
                          </div>

                          <div className="bg-gray-50 p-6 rounded-3xl border-2 border-dashed border-gray-200">
                              {imageInputMode === 'url' && (
                                  <div className="flex gap-3">
                                      <input className="flex-1 bg-white border border-gray-200 rounded-xl px-4 font-medium text-sm" placeholder="https://..." value={imageUrlInput} onChange={e => setImageUrlInput(e.target.value)} />
                                      <button onClick={() => handleAddImage(imageUrlInput)} disabled={isUploading} className="bg-gray-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase disabled:opacity-50">
                                          {isUploading ? 'Auditando...' : 'Añadir'}
                                      </button>
                                  </div>
                              )}
                              {imageInputMode === 'upload' && (
                                  <div className="text-center">
                                      <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="bg-white border-2 border-gray-200 text-gray-600 px-8 py-4 rounded-xl font-black text-xs uppercase hover:border-orange-400 hover:text-orange-500 transition-all">
                                          {isUploading ? 'Subiendo a la Nube...' : 'Seleccionar Archivo'}
                                      </button>
                                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                  </div>
                              )}
                              {imageInputMode === 'ai' && (
                                  <div className="flex gap-3">
                                      <input className="flex-1 bg-white border border-gray-200 rounded-xl px-4 font-medium text-sm" placeholder="Describe el postre..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} />
                                      <button onClick={handleGenerateImage} disabled={isGenerating} className="bg-purple-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                                          {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={16} />} Generar
                                      </button>
                                  </div>
                              )}
                          </div>
                      </div>

                      {/* GALLERY GRID */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {business.images?.map((img, idx) => (
                              <div key={idx} className="group relative aspect-square rounded-2xl overflow-hidden shadow-md">
                                  <img src={img} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-4">
                                      <button onClick={() => handleSetMainImage(img)} className="bg-white text-gray-900 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase w-full hover:bg-green-400 hover:text-white">
                                          {business.mainImage === img ? '★ Principal' : 'Hacer Principal'}
                                      </button>
                                      <button onClick={() => handleDeleteImage(img)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase w-full">Eliminar</button>
                                  </div>
                                  {business.mainImage === img && <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 p-1 rounded-md text-xs">⭐</div>}
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}

          {/* LEADS TAB (INTELLIGENT MATCHING) */}
          {activeTab === 'leads' && business && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-gradient-to-r from-gray-900 to-indigo-900 p-8 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-8 opacity-10 text-9xl">💼</div>
                      <h4 className="text-2xl font-black uppercase italic tracking-tighter relative z-10">Oportunidades de Negocio</h4>
                      <p className="text-sm font-medium opacity-80 max-w-lg mt-2 relative z-10">
                          Matching inteligente basado en tus etiquetas. Los leads marcados con ⭐ coinciden con tu especialidad.
                      </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {leads.map(lead => {
                          const isUnlocked = business.unlockedLeads?.includes(lead.id);
                          const isDominio = business.packId === 'super_top';
                          
                          // INTELLIGENT MATCHING LOGIC
                          // Check if lead description contains any of business tags
                          const matchedTags = business.tags?.filter(tag => 
                              lead.description.toLowerCase().includes(tag.toLowerCase()) ||
                              lead.eventType.toLowerCase().includes(tag.toLowerCase())
                          ) || [];
                          const isMatch = matchedTags.length > 0;

                          return (
                              <div key={lead.id} className={`bg-white p-6 rounded-[2rem] border-2 shadow-lg transition-all relative overflow-hidden ${isMatch ? 'border-orange-400' : 'border-gray-100'}`}>
                                  {isMatch && (
                                      <div className="absolute top-0 right-0 bg-orange-400 text-white px-3 py-1 rounded-bl-2xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                          Coincidencia: {matchedTags.join(', ')}
                                      </div>
                                  )}
                                  
                                  <div className="flex justify-between items-start mb-4 mt-2">
                                      <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                          {lead.eventType}
                                      </span>
                                      <span className="text-[10px] font-bold text-gray-400">{lead.date}</span>
                                  </div>
                                  <h5 className="font-black text-lg text-gray-900 mb-2">{lead.location} • {lead.guests} Pax</h5>
                                  <p className="text-xs text-gray-600 mb-4 line-clamp-3">"{lead.description}"</p>
                                  
                                  {isUnlocked ? (
                                      <div className="bg-green-50 p-4 rounded-xl border border-green-200 space-y-2">
                                          <div>
                                              <p className="text-[9px] font-black text-green-700 uppercase tracking-widest">Datos de Contacto</p>
                                              <p className="font-bold text-gray-900">{lead.clientName}</p>
                                          </div>
                                          <div className="flex gap-2">
                                              <a href={`tel:${lead.clientContact}`} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-[10px] font-black uppercase text-center hover:bg-green-700 flex items-center justify-center gap-2">
                                                  <Smartphone size={12} /> Llamar
                                              </a>
                                              <a href={`mailto:${lead.clientContact}`} className="flex-1 bg-white border border-green-600 text-green-600 py-2 rounded-lg text-[10px] font-black uppercase text-center hover:bg-green-50 flex items-center justify-center gap-2">
                                                  <Mail size={12} /> Email
                                              </a>
                                          </div>
                                      </div>
                                  ) : (
                                      <div className="space-y-2">
                                          <button onClick={() => handleUnlockLead(lead)} className="w-full bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase shadow-xl hover:bg-orange-600 transition-colors flex justify-between items-center px-4">
                                              <span>{isDominio ? 'Desbloquear GRATIS' : 'Desbloquear'}</span>
                                              {!isDominio && <span className="bg-white/20 px-2 py-0.5 rounded text-white">{ACTION_COSTS.LEAD_UNLOCK} Créditos</span>}
                                          </button>
                                          {!isDominio && credits < ACTION_COSTS.LEAD_UNLOCK && (
                                              <p className="text-[9px] text-red-500 font-bold text-center">Saldo insuficiente. Recarga en Negocio.</p>
                                          )}
                                      </div>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              </div>
          )}

          {/* SOPORTE TAB */}
          {activeTab === 'soporte' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="bg-gray-50 p-8 rounded-[3rem] border border-gray-100">
                      <h4 className="text-xl font-black text-gray-900 uppercase italic mb-6">Nuevo Ticket</h4>
                      <form onSubmit={handleCreateSupportTicket} className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input required className="profile-input" placeholder="Asunto" value={ticketSubject} onChange={e => setTicketSubject(e.target.value)} />
                              <select className="profile-input uppercase" value={ticketDept} onChange={e => setTicketDept(e.target.value as any)}>
                                  <option value="tecnico">Soporte Técnico</option>
                                  <option value="marketing">Marketing y Visibilidad</option>
                                  <option value="contabilidad">Facturación</option>
                              </select>
                          </div>
                          <textarea required className="profile-input h-32" placeholder="Detalla tu incidencia..." value={ticketDesc} onChange={e => setTicketDesc(e.target.value)} />
                          <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-600 transition-all shadow-xl">Crear Ticket</button>
                      </form>
                  </div>

                  <div className="space-y-4">
                      <h4 className="text-lg font-black text-gray-900 uppercase italic">Historial</h4>
                      {tickets?.filter(t => t.user_id === user.id).length === 0 ? (
                          <p className="text-gray-400 text-xs text-center py-10">No tienes tickets abiertos.</p>
                      ) : (
                          tickets?.filter(t => t.user_id === user.id).map(t => (
                              <div key={t.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                                  <div>
                                      <h5 className="font-bold text-gray-900">{t.subject}</h5>
                                      <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${t.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{t.status}</span>
                                  </div>
                                  <span className="text-[10px] font-mono text-gray-400">{t.created_at.split('T')[0]}</span>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          )}
        </main>
      </div>
      <style>{`
        .profile-input {
          width: 100%;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 0.875rem 1.25rem;
          font-weight: 700;
          font-size: 0.875rem;
          outline: none;
          transition: all 0.2s;
        }
        .profile-input:focus {
          background: white;
          border-color: #fb923c;
          box-shadow: 0 0 0 5px rgba(251, 146, 60, 0.1);
        }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};
