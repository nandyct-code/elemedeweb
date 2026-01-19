
import React, { useState, useEffect, useRef } from 'react';
import { Business, UserAccount, SubscriptionFormData, CountryConfig, SystemFinancialConfig, Invoice, AddressDetails, DiscountCode, CouponTarget, SubscriptionPack } from '../types';
import { SECTORS, LEGAL_TEXTS } from '../constants';
import { Eye, EyeOff, Loader2, CreditCard } from 'lucide-react';
import { sendNotification } from '../services/notificationService';
import { stripeService } from '../services/stripeService';
import { dataService } from '../services/supabase'; // PHASE 1: ASYNC VALIDATION

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: SubscriptionFormData, generatedId: string) => void;
  onInvoiceGenerated: (invoice: Invoice) => void;
  existingBusinesses: Business[];
  existingUsers: UserAccount[];
  currentCountry: CountryConfig;
  countryFinancials: SystemFinancialConfig;
  subscriptionPacks: SubscriptionPack[];
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen, onClose, onSuccess, onInvoiceGenerated, existingBusinesses, existingUsers, currentCountry, countryFinancials, subscriptionPacks
}) => {
  const [step, setStep] = useState(1);
  const initialFormData: SubscriptionFormData = {
    nombre: '',
    apellidos: '',
    email: '',
    telefono: '',
    nif: '',
    nombreNegocio: '',
    direccionPrincipal: { calle: '', cp: '', ciudad: '', provincia: '' },
    sectorId: '',
    packId: '',
    billingCycle: 'monthly',
    extraLocations: 0,
    sedes: [],
    password: '',
    consents: { privacy: false, terms: false, contract: false }
  };

  const [formData, setFormData] = useState<SubscriptionFormData>(initialFormData);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<DiscountCode | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  // Legal Text Modal State & Logic
  const [legalTextToShow, setLegalTextToShow] = useState<{title: string, content: string, type: 'privacy'|'terms'|'contract'} | null>(null);
  const [readDocs, setReadDocs] = useState({ privacy: false, terms: false, contract: false });
  const legalContentRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
        setStep(1);
        setFormData(initialFormData);
        setConfirmPassword('');
        setCardDetails({ number: '', expiry: '', cvc: '', name: '' });
        setIsProcessingPayment(false);
        setAppliedCoupon(null);
        setCouponCode('');
        setCouponError('');
        setReadDocs({ privacy: false, terms: false, contract: false });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentPack = subscriptionPacks.find(p => p.id === formData.packId);
  const stripeConfig = countryFinancials.stripe;

  // Formatting Helper for Expiry
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length >= 2) {
          val = val.slice(0, 2) + '/' + val.slice(2, 4);
      }
      setCardDetails({...cardDetails, expiry: val});
  };

  // Legal Scroll Handler
  const handleLegalScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (!legalTextToShow) return;
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      // Allow a small buffer of 20px
      if (scrollHeight - scrollTop <= clientHeight + 20) {
          setReadDocs(prev => ({ ...prev, [legalTextToShow.type]: true }));
      }
  };

  // Coupon Validation (Updated for Phase 1 Async)
  const validateCoupon = async () => {
      setCouponError('');
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);

      const code = couponCode.toUpperCase().trim();
      
      try {
          // PHASE 1: Fetch coupons from DataService
          const coupons = await dataService.getCoupons();
          const found = coupons.find((c: DiscountCode) => c.code === code && c.status === 'active');

          if (!found) {
              setCouponError('Cupón inválido o expirado.');
              setIsValidatingCoupon(false);
              return;
          }

          if (new Date(found.valid_to || '') < new Date()) {
              setCouponError('El cupón ha caducado.');
              setIsValidatingCoupon(false);
              return;
          }

          if ((found.usage_count || 0) >= (found.usage_limit || 0)) {
              setCouponError('El cupón ha agotado sus usos.');
              setIsValidatingCoupon(false);
              return;
          }

          const isApplicable = found.applicable_targets?.includes('plan_subscription') || (!found.applicable_targets);
          if (!isApplicable) {
              setCouponError('Este cupón no es válido para suscripciones de planes.');
              setIsValidatingCoupon(false);
              return;
          }

          setAppliedCoupon(found);
          setCouponError(''); 
      } catch (e) {
          setCouponError("Error validando cupón");
      } finally {
          setIsValidatingCoupon(false);
      }
  };

  const calculateFinancials = () => {
    if (!currentPack) return { base: 0, tax: 0, total: 0 };
    
    // NOTE: All prices in constants are now treated as Tax Inclusive (Total)
    const planPrice = formData.billingCycle === 'annual' ? currentPack.annualPriceYear1 : currentPack.monthlyPrice;
    
    // ANNUAL FREE LOCATIONS LOGIC (1st Year)
    let billableLocations = formData.sedes.length;
    if (formData.billingCycle === 'annual') {
        let freeAllowance = 0;
        if (currentPack.id === 'basic') freeAllowance = 1;
        if (currentPack.id === 'medium') freeAllowance = 2;
        if (currentPack.id === 'premium') freeAllowance = 3;
        if (currentPack.id === 'super_top') freeAllowance = 5;
        
        billableLocations = Math.max(0, billableLocations - freeAllowance);
    }

    const extraLocationsPriceMonthly = billableLocations * currentPack.extraLocationPrice;
    const extraLocationsTotal = formData.billingCycle === 'annual' ? extraLocationsPriceMonthly * 12 : extraLocationsPriceMonthly;
    
    // TOTAL GROSS (Before Tax Calculation)
    let totalGross = planPrice + extraLocationsTotal;

    if (appliedCoupon) {
        if (appliedCoupon.type === 'porcentaje') {
            const discountAmount = totalGross * (appliedCoupon.value! / 100);
            totalGross = Math.max(0, totalGross - discountAmount);
        } else if (appliedCoupon.type === 'fijo') {
            totalGross = Math.max(0, totalGross - appliedCoupon.value!);
        }
    }

    // Now extract tax from the final rounded total
    const { base, taxAmount, total } = stripeService.calculateFinancials(totalGross, countryFinancials.taxRate);
    return { base, tax: taxAmount, total };
  };

  const handleNext = () => {
    if (step === 1 && !formData.sectorId) return alert("Selecciona un sector");
    if (step === 2 && !formData.packId) return alert("Selecciona un plan");
    if (step === 3) {
      if (!formData.nombre || !formData.email || !formData.nif || !formData.nombreNegocio) return alert("Completa todos los campos obligatorios");
      if (existingUsers.find(u => u.email === formData.email)) return alert("Este email ya está registrado");
      
      if (!formData.password || !confirmPassword) return alert("Completa los campos de contraseña");
      if (formData.password !== confirmPassword) return alert("Las contraseñas no coinciden");
      if (formData.password.length < 6) return alert("La contraseña debe tener al menos 6 caracteres");

      if (!formData.consents.privacy || !formData.consents.terms || !formData.consents.contract) {
          return alert("Debes LEER y ACEPTAR todos los documentos legales (Política, Términos y Contrato) para continuar.");
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!cardDetails.number || !cardDetails.expiry || !cardDetails.cvc || !cardDetails.name) {
        return alert("Por favor, introduce los datos de tu tarjeta para procesar el pago.");
    }

    setIsProcessingPayment(true);

    try {
        const { base, tax, total } = calculateFinancials();
        
        // 1. Create Stripe Customer & Validate Card (Simulated via Service)
        const stripeCustomer = await stripeService.createCustomer(formData.email, formData.nombre, cardDetails);
        
        // 2. Create Subscription (Simulated) - This processes the first charge automatically
        const subscription = await stripeService.createSubscription(stripeCustomer.customerId, formData.packId);

        // Generate IDs
        const newBusinessId = Math.random().toString(36).substr(2, 9);
        // Use a generated ID or one from subscription response if available
        const invoiceId = `INV-${Date.now()}`;

        // Calculate Stripe Fee
        const stripeFee = stripeConfig?.isConnected 
            ? (total * (stripeConfig.feePercentage / 100)) + stripeConfig.fixedFee 
            : 0;

        const newInvoice: Invoice = {
            id: invoiceId,
            business_id: newBusinessId,
            business_name: countryFinancials.issuerDetails.businessName,
            business_nif: countryFinancials.issuerDetails.nif,
            business_address: `${countryFinancials.issuerDetails.address}, ${countryFinancials.issuerDetails.city}`,
            business_email: countryFinancials.issuerDetails.email,
            business_phone: countryFinancials.issuerDetails.phone,
            business_form_juridica: countryFinancials.issuerDetails.formJuridica,
            client_name: formData.nombreNegocio,
            client_nif: formData.nif,
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            base_amount: base,
            iva_rate: countryFinancials.taxRate,
            iva_amount: tax,
            irpf_rate: 0,
            irpf_amount: 0,
            total_amount: total,
            status: 'paid', // Subscription setup usually charges first cycle immediately
            concept: `Suscripción ${currentPack?.label} (${formData.billingCycle === 'annual' ? 'Anual' : 'Mensual'}) + ${formData.sedes.length} Sedes` + (appliedCoupon ? ` [CUPÓN: ${appliedCoupon.code}]` : ''),
            quarter: Math.floor(new Date().getMonth() / 3) + 1,
            currencySymbol: currentCountry.currencySymbol,
            stripe_fee: stripeFee
        };

        onInvoiceGenerated(newInvoice);
        
        const redeemedCouponObj = appliedCoupon ? [{
            code: appliedCoupon.code,
            date: new Date().toISOString(),
            applied_to: 'plan_subscription' as CouponTarget,
            savings_amount: total // Simplification, savings is implicit in reduced total
        }] : undefined;

        sendNotification(
            'auth_activation',
            formData.email,
            { name: formData.nombre, businessName: formData.nombreNegocio, planName: currentPack?.label || 'Plan' },
            'User Registration'
        );
        sendNotification(
            'sub_management',
            formData.email,
            { businessName: formData.nombreNegocio, amount: total.toFixed(2), invoiceId: invoiceId, month: new Date().toLocaleString('es-ES', { month: 'long' }) },
            'Payment Success'
        );
        
        const businessData = { 
            ...formData, 
            extraLocations: formData.sedes.length,
            redeemedCoupons: redeemedCouponObj,
            stripeConnection: {
                status: 'connected' as const,
                customerId: stripeCustomer.customerId,
                subscriptionId: subscription.subscriptionId,
                last4: stripeCustomer.last4,
                cardBrand: stripeCustomer.brand,
                nextBillingDate: subscription.nextBilling
            }
        };
        
        onSuccess(businessData, newBusinessId);
        
        // Reset
        setIsProcessingPayment(false);
        setFormData(initialFormData);
        setStep(1);
        setCardDetails({ number: '', expiry: '', cvc: '', name: '' });
        setConfirmPassword('');
        setAppliedCoupon(null);
        setCouponCode('');

    } catch (error: any) {
        alert(`Error en el pago: ${error.message || 'Inténtelo de nuevo'}`);
        setIsProcessingPayment(false);
    }
  };

  const addSede = () => {
      setFormData(prev => ({
          ...prev,
          sedes: [...prev.sedes, { calle: '', cp: '', ciudad: '', provincia: '' }]
      }));
  };

  const removeSede = (index: number) => {
      setFormData(prev => ({
          ...prev,
          sedes: prev.sedes.filter((_, i) => i !== index)
      }));
  };

  const updateSede = (index: number, field: keyof AddressDetails, value: string) => {
      const newSedes = [...formData.sedes];
      newSedes[index] = { ...newSedes[index], [field]: value };
      setFormData({ ...formData, sedes: newSedes });
  };

  const toggleConsent = (key: keyof typeof formData.consents) => {
      // Prevent toggling if document hasn't been read
      if (!readDocs[key]) {
          alert("Debes abrir y leer el documento completo (hacer scroll hasta el final) antes de aceptar.");
          return;
      }
      setFormData(prev => ({
          ...prev,
          consents: { ...prev.consents, [key]: !prev.consents[key] }
      }));
  };

  const openLegalDoc = (e: React.MouseEvent, title: string, content: string, type: 'privacy'|'terms'|'contract') => {
      e.preventDefault();
      setLegalTextToShow({ title, content, type });
  };

  const financials = calculateFinancials();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fade-in">
      
      {/* LEGAL TEXT MODAL OVERLAY */}
      {legalTextToShow && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2rem] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl relative">
                  <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
                      <h3 className="text-xl font-black text-gray-900 uppercase italic">{legalTextToShow.title}</h3>
                      <button onClick={() => setLegalTextToShow(null)} className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition-colors text-xl">×</button>
                  </div>
                  
                  {/* SCROLLABLE CONTENT */}
                  <div 
                    className="flex-1 overflow-y-auto p-8 whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-medium"
                    onScroll={handleLegalScroll}
                    ref={legalContentRef}
                  >
                      {legalTextToShow.content}
                      {/* Force content height to ensure scroll */}
                      <div className="h-20"></div> 
                      <p className="text-center text-gray-400 text-xs mt-4">--- Fin del Documento ---</p>
                  </div>

                  <div className="p-6 border-t border-gray-100 bg-white rounded-b-[2rem] text-center">
                      <button 
                        onClick={() => {
                            // Auto-accept if scrolled to bottom just now or before
                            if(readDocs[legalTextToShow.type]) {
                                setLegalTextToShow(null);
                            } else {
                                alert("Por favor, lee todo el documento (baja hasta el final) para continuar.");
                            }
                        }} 
                        className={`px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-colors ${readDocs[legalTextToShow.type] ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                      >
                          {readDocs[legalTextToShow.type] ? 'He leído y Acepto' : 'Lee hasta el final...'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 hover:text-red-500 transition-colors z-10">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        <div className="bg-gray-50 p-8 border-b border-gray-100">
          <h2 className="text-2xl font-brand font-black text-gray-900 uppercase italic">Alta de Nuevo Negocio</h2>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`}></div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {step === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest text-center mb-8">1. Selecciona tu Sector</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {SECTORS.map(sector => (
                  <button
                    key={sector.id}
                    onClick={() => setFormData({ ...formData, sectorId: sector.id })}
                    className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${formData.sectorId === sector.id ? 'border-orange-500 bg-orange-50 shadow-xl scale-105' : 'border-gray-100 hover:border-orange-200 hover:bg-gray-50'}`}
                  >
                    <span className="text-4xl">{sector.icon}</span>
                    <span className="text-[10px] font-black uppercase text-center">{sector.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="text-center space-y-4">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">2. Elige tu Plan</h3>
                  <div className="inline-flex bg-gray-100 p-1 rounded-xl">
                    <button onClick={() => setFormData({...formData, billingCycle: 'monthly'})} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.billingCycle === 'monthly' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Mensual</button>
                    <button onClick={() => setFormData({...formData, billingCycle: 'annual'})} className={`px-6 py-2 rounded-lg text-xs font-black uppercase transition-all ${formData.billingCycle === 'annual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}>Anual (-20%)</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subscriptionPacks.map(pack => (
                  <div 
                    key={pack.id}
                    onClick={() => setFormData({ ...formData, packId: pack.id })}
                    className={`p-6 rounded-[2rem] border-2 transition-all cursor-pointer relative flex flex-col justify-between ${formData.packId === pack.id ? 'border-orange-500 bg-orange-50 shadow-xl transform -translate-y-2' : 'border-gray-100 hover:border-orange-200'}`}
                  >
                    {formData.packId === pack.id && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Seleccionado</div>}
                    <div>
                        <div className={`text-[9px] font-black uppercase tracking-widest mb-2 px-2 py-1 rounded w-fit ${pack.colorClass.replace('bg-', 'text-').replace('-50', '-600')}`}>{pack.badge}</div>
                        <h4 className="text-xl font-black text-gray-900 uppercase italic">{pack.label}</h4>
                        <p className="text-3xl font-black text-orange-600 mt-2">
                        {formData.billingCycle === 'annual' ? pack.annualPriceYear1 : pack.monthlyPrice}{currentCountry.currencySymbol}
                        <span className="text-xs text-gray-400 font-bold ml-1">/{formData.billingCycle === 'annual' ? 'año' : 'mes'}</span>
                        </p>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {pack.benefits.map((b, i) => (
                        <li key={i} className="text-xs font-bold text-gray-600 flex items-center gap-2">
                          <span className="text-green-500">✓</span> {b}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-8 max-w-4xl mx-auto">
              <div>
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest text-center mb-8">3. Datos del Negocio</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Nombre Comercial</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.nombreNegocio} onChange={e => setFormData({...formData, nombreNegocio: e.target.value})} placeholder="Ej: Pastelería Real" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">NIF / CIF</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Nombre Contacto</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Email Administración</label>
                      <input required type="email" className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                    
                    {/* Password Fields */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Contraseña</label>
                        <div className="relative">
                            <input 
                                required 
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm pr-10" 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Repetir Contraseña</label>
                        <div className="relative">
                            <input 
                                required 
                                type={showPassword ? "text" : "password"}
                                className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm pr-10" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repite la contraseña"
                            />
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Dirección Principal</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.direccionPrincipal.calle} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, calle: e.target.value}})} placeholder="Calle, Número..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Ciudad</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.direccionPrincipal.ciudad} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, ciudad: e.target.value}})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase">Código Postal</label>
                      <input required className="w-full bg-white border border-gray-200 p-3 rounded-xl font-bold text-sm" value={formData.direccionPrincipal.cp} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, cp: e.target.value}})} />
                    </div>
                  </div>
              </div>

              <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <div>
                          <h4 className="font-black text-gray-900 uppercase italic text-lg">Sedes Adicionales</h4>
                          <p className="text-xs text-gray-500 font-medium">Gestiona múltiples ubicaciones para tu negocio ({currentPack?.extraLocationPrice || 0}{currentCountry.currencySymbol}/mes cada una)</p>
                      </div>
                      <button onClick={addSede} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md">+ Añadir Local</button>
                  </div>
                  
                  {formData.sedes.length === 0 ? (
                      <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">
                          No has añadido sedes adicionales
                      </div>
                  ) : (
                      <div className="grid gap-4">
                          {formData.sedes.map((sede, idx) => (
                              <div key={idx} className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 relative group animate-fade-in">
                                  <button onClick={() => removeSede(idx)} className="absolute top-4 right-4 text-red-400 hover:text-red-600 p-2">✕</button>
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                      <div className="md:col-span-2">
                                          <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Dirección Sede #{idx+1}</label>
                                          <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" placeholder="Calle, Número..." value={sede.calle} onChange={e => updateSede(idx, 'calle', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">CP</label>
                                          <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" value={sede.cp} onChange={e => updateSede(idx, 'cp', e.target.value)} />
                                      </div>
                                      <div>
                                          <label className="text-[9px] font-black text-blue-800 uppercase tracking-widest">Ciudad</label>
                                          <input className="w-full bg-white border border-blue-100 p-2.5 rounded-lg text-xs font-bold mt-1" value={sede.ciudad} onChange={e => updateSede(idx, 'ciudad', e.target.value)} />
                                      </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 space-y-3 shadow-sm">
                  <h4 className="text-xs font-black text-gray-900 uppercase mb-2">Consentimientos Legales Requeridos</h4>
                  
                  <label className={`flex items-start gap-3 cursor-pointer group ${!readDocs.privacy ? 'opacity-50' : ''}`}>
                      <input type="checkbox" className="mt-1 w-4 h-4 accent-orange-600 cursor-pointer" checked={formData.consents.privacy} onChange={() => toggleConsent('privacy')} disabled={!readDocs.privacy} />
                      <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900">
                          He leído, entiendo y acepto la <button onClick={(e) => openLegalDoc(e, 'Política de Privacidad', LEGAL_TEXTS.PRIVACY_POLICY, 'privacy')} className="text-orange-600 underline decoration-dotted hover:text-orange-800">Política de Privacidad</button>.
                      </span>
                  </label>
                  
                  <label className={`flex items-start gap-3 cursor-pointer group ${!readDocs.terms ? 'opacity-50' : ''}`}>
                      <input type="checkbox" className="mt-1 w-4 h-4 accent-orange-600 cursor-pointer" checked={formData.consents.terms} onChange={() => toggleConsent('terms')} disabled={!readDocs.terms} />
                      <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900">
                          He leído, entiendo y acepto las <button onClick={(e) => openLegalDoc(e, 'Condiciones de Uso', LEGAL_TEXTS.TERMS_OF_USE, 'terms')} className="text-orange-600 underline decoration-dotted hover:text-orange-800">Condiciones Generales de Uso</button>.
                      </span>
                  </label>
                  
                  <label className={`flex items-start gap-3 cursor-pointer group ${!readDocs.contract ? 'opacity-50' : ''}`}>
                      <input type="checkbox" className="mt-1 w-4 h-4 accent-orange-600 cursor-pointer" checked={formData.consents.contract} onChange={() => toggleConsent('contract')} disabled={!readDocs.contract} />
                      <span className="text-xs text-gray-600 font-medium group-hover:text-gray-900">
                          He leído, entiendo y acepto el <button onClick={(e) => openLegalDoc(e, 'Contrato de Suscripción', LEGAL_TEXTS.SUBSCRIPTION_CONTRACT, 'contract')} className="text-orange-600 underline decoration-dotted hover:text-orange-800">Contrato de Suscripción</button> vinculante.
                      </span>
                  </label>
                  
                  <p className="text-[9px] text-gray-400 italic mt-2">* Debes abrir y leer cada documento hasta el final para poder aceptar.</p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Resumen */}
              <div className="space-y-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">Resumen del Pedido (IVA Incluido)</h3>
                  <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">Plan {currentPack?.label}</span>
                        <span className="text-sm font-black text-gray-900">
                            {(formData.billingCycle === 'annual' ? currentPack!.annualPriceYear1 : currentPack!.monthlyPrice).toFixed(2)}{currentCountry.currencySymbol}
                        </span>
                    </div>
                    {formData.sedes.length > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-bold text-gray-600">
                                {formData.sedes.length} x Sede Extra
                                {formData.billingCycle === 'annual' && (
                                    <span className="text-green-600 text-[10px] ml-2 font-black uppercase">
                                        (Gratis 1er año según Plan)
                                    </span>
                                )}
                            </span>
                            <span className="text-sm font-black text-gray-900">
                                {((formData.billingCycle === 'annual' ? currentPack!.extraLocationPrice * 12 : currentPack!.extraLocationPrice) * formData.sedes.length).toFixed(2)}{currentCountry.currencySymbol}
                            </span>
                        </div>
                    )}
                    <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>Ciclo de Facturación</span>
                        <span className="uppercase font-bold">{formData.billingCycle === 'annual' ? 'Anual' : 'Mensual'}</span>
                    </div>

                    {/* COUPON SECTION */}
                    <div className="border-t border-gray-200 pt-4">
                        <div className="flex gap-2">
                            <input 
                                className="flex-1 bg-white border border-gray-300 rounded-lg p-2 text-xs uppercase font-bold"
                                placeholder="CÓDIGO PROMO"
                                value={couponCode}
                                onChange={(e) => setCouponCode(e.target.value)}
                                disabled={!!appliedCoupon || isValidatingCoupon}
                            />
                            {appliedCoupon ? (
                                <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="bg-red-50 text-red-500 px-3 rounded-lg text-xs font-bold border border-red-100">✕</button>
                            ) : (
                                <button onClick={validateCoupon} disabled={isValidatingCoupon} className="bg-gray-900 text-white px-3 rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors disabled:opacity-50">
                                    {isValidatingCoupon ? <Loader2 className="animate-spin w-3 h-3" /> : 'Aplicar'}
                                </button>
                            )}
                        </div>
                        {couponError && <p className="text-[10px] text-red-500 font-bold mt-1">{couponError}</p>}
                        {appliedCoupon && <p className="text-[10px] text-green-600 font-bold mt-1">✓ Cupón aplicado: {appliedCoupon.type === 'porcentaje' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value}€`}</p>}
                    </div>

                    <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                        <span className="text-sm font-bold text-gray-600">Total (IVA Incluido)</span>
                        <div className="text-right">
                            <span className="text-2xl font-black text-gray-900">{financials.total.toFixed(2)}{currentCountry.currencySymbol}</span>
                            <div className="text-[9px] text-gray-400 font-bold uppercase">
                                Base: {financials.base.toFixed(2)}€ | IVA: {financials.tax.toFixed(2)}€
                            </div>
                        </div>
                    </div>
                  </div>
              </div>

              {/* Stripe Payment Form */}
              <div className="space-y-6">
                  <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-6">Método de Pago Seguro</h3>
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-indigo-50 shadow-lg space-y-6 relative overflow-hidden">
                      <div className={`absolute top-0 right-0 p-6 opacity-10 font-black text-6xl text-indigo-900 pointer-events-none ${isProcessingPayment ? 'animate-pulse' : ''}`}>STRIPE</div>
                      
                      {/* Connection Status Badge */}
                      <div className="flex justify-between items-center">
                          <div className="flex gap-4">
                              <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">VISA</div>
                              <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">MC</div>
                              <div className="h-8 w-12 bg-gray-100 rounded flex items-center justify-center text-xs font-bold text-gray-500 border border-gray-200">AMEX</div>
                          </div>
                          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded border bg-[#635BFF] text-white border-transparent`}>
                              Stripe Secure
                          </span>
                      </div>

                      <div className={`space-y-4 transition-opacity ${isProcessingPayment ? 'opacity-50 pointer-events-none' : ''}`}>
                          {/* Stripe Elements Style Inputs */}
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Titular de la Tarjeta</label>
                              <input className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-bold text-sm mt-1 focus:border-[#635BFF] outline-none" placeholder="Nombre como aparece en la tarjeta" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} />
                          </div>
                          <div>
                              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Número de Tarjeta</label>
                              <div className="relative">
                                  <input className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm mt-1 focus:border-[#635BFF] outline-none pl-10" placeholder="0000 0000 0000 0000" maxLength={19} value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} />
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><CreditCard size={16} /></span>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Caducidad</label>
                                  <input 
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm mt-1 focus:border-[#635BFF] outline-none text-center" 
                                    placeholder="MM/YY" 
                                    maxLength={5} 
                                    value={cardDetails.expiry} 
                                    onChange={handleExpiryChange} 
                                  />
                              </div>
                              <div>
                                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">CVC</label>
                                  <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 font-mono text-sm mt-1 focus:border-[#635BFF] outline-none text-center" placeholder="123" maxLength={3} value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} />
                              </div>
                          </div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-xl flex items-center gap-2 border border-green-100">
                          <span className="text-green-600">🔒</span>
                          <p className="text-[10px] text-green-700 font-bold">Pago procesado de forma segura con encriptación SSL de 256-bits.</p>
                      </div>
                  </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex justify-between bg-white z-20">
          {step > 1 && !isProcessingPayment && (
            <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-black text-xs uppercase text-gray-500 hover:bg-gray-100 transition-colors">
              Atrás
            </button>
          )}
          <div className="flex-1"></div>
          {step < 4 ? (
            <button onClick={handleNext} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-orange-600 transition-all shadow-lg">
              Siguiente
            </button>
          ) : (
            <button 
                onClick={handleSubmit} 
                disabled={isProcessingPayment}
                className="bg-[#635BFF] text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#5349e0] transition-all shadow-lg flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isProcessingPayment ? (
                  <><Loader2 className="animate-spin w-4 h-4" /> Procesando con Stripe...</>
              ) : (
                  <><span>💳</span> Pagar {financials.total.toFixed(2)}€ y Activar</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
