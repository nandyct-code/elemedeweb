
import React, { useState, useEffect, useRef } from 'react';
import { Business, UserAccount, SubscriptionFormData, CountryConfig, SystemFinancialConfig, Invoice, AddressDetails, DiscountCode, SubscriptionPack } from '../types';
import { SECTORS, LEGAL_TEXTS } from '../constants';
import { Loader2 } from 'lucide-react';
import { stripeService } from '../services/stripeService';
import { dataService } from '../services/supabase';

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

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length >= 2) {
          val = val.slice(0, 2) + '/' + val.slice(2, 4);
      }
      setCardDetails({...cardDetails, expiry: val});
  };

  const handleLegalScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (!legalTextToShow) return;
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 50) {
          setReadDocs(prev => ({ ...prev, [legalTextToShow.type]: true }));
      }
  };

  const validateCoupon = async () => {
      setCouponError('');
      if (!couponCode.trim()) return;
      setIsValidatingCoupon(true);

      const code = couponCode.toUpperCase().trim();
      
      try {
          const coupons = await dataService.getCoupons();
          const found = coupons.find((c: DiscountCode) => c.code === code && c.status === 'active');

          if (!found) {
              setCouponError('Cupón inválido o expirado.');
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
    
    // Base Price (Plan)
    const planPrice = formData.billingCycle === 'annual' ? currentPack.annualPriceYear1 : currentPack.monthlyPrice;
    
    // Extra Locations Calculation
    let billableLocations = formData.sedes.length;
    
    // Apply "Free First Year" Logic specifically for annual cycle if defined in benefits
    if (formData.billingCycle === 'annual') {
        let freeAllowance = 0;
        // Hardcoded allowance logic based on typical pack structure
        if (currentPack.id === 'basic') freeAllowance = 1;
        if (currentPack.id === 'medium') freeAllowance = 2;
        if (currentPack.id === 'premium') freeAllowance = 3;
        if (currentPack.id === 'super_top') freeAllowance = 5;
        
        billableLocations = Math.max(0, billableLocations - freeAllowance);
    }

    const unitCost = currentPack.extraLocationPrice;
    // For Annual, the extra location cost is multiplied by 12 months
    const extraLocationsTotal = formData.billingCycle === 'annual' 
        ? (billableLocations * unitCost * 12) 
        : (billableLocations * unitCost);
    
    let totalGross = planPrice + extraLocationsTotal;

    // Apply Coupon
    if (appliedCoupon) {
        if (appliedCoupon.type === 'porcentaje') {
            const discountAmount = totalGross * (appliedCoupon.value! / 100);
            totalGross = Math.max(0, totalGross - discountAmount);
        } else if (appliedCoupon.type === 'fijo') {
            totalGross = Math.max(0, totalGross - appliedCoupon.value!);
        }
    }

    // Calculate Tax (Inclusive Strategy)
    const { base, taxAmount, total } = stripeService.calculateFinancials(totalGross, countryFinancials.taxRate);
    return { base, tax: taxAmount, total };
  };

  const handleNext = () => {
    if (step === 1 && !formData.sectorId) return alert("Selecciona un sector");
    if (step === 2 && !formData.packId) return alert("Selecciona un plan");
    if (step === 3) {
      if (!formData.nombre || !formData.email || !formData.nif || !formData.nombreNegocio) return alert("Completa todos los campos obligatorios");
      
      if (existingUsers.some(u => u.email.toLowerCase() === formData.email.toLowerCase())) {
          return alert("Este email ya está registrado");
      }
      
      if (!formData.password || !confirmPassword) return alert("Completa los campos de contraseña");
      if (formData.password !== confirmPassword) return alert("Las contraseñas no coinciden");
      
      if (!formData.consents.privacy || !formData.consents.terms || !formData.consents.contract) {
          return alert("Debes LEER y ACEPTAR todos los documentos legales.");
      }
    }
    setStep(prev => prev + 1);
  };

  const handleSubmit = async () => {
    if (!cardDetails.number) return alert("Introduce tarjeta");
    setIsProcessingPayment(true);

    try {
        const { base, tax, total } = calculateFinancials();
        
        const stripeCustomer = await stripeService.createCustomer(formData.email, formData.nombre, cardDetails);
        const subscription = await stripeService.createSubscription(stripeCustomer.customerId, formData.packId);

        const invoiceId = `INV-${Date.now()}`;
        const newBusinessId = Math.random().toString(36).substr(2, 9);

        const newInvoice: Invoice = {
            id: invoiceId,
            business_id: newBusinessId,
            business_name: countryFinancials.issuerDetails.businessName,
            business_nif: countryFinancials.issuerDetails.nif,
            client_name: formData.nombreNegocio,
            client_nif: formData.nif,
            date: new Date().toISOString().split('T')[0],
            due_date: new Date().toISOString().split('T')[0],
            base_amount: base,
            iva_rate: countryFinancials.taxRate,
            iva_amount: tax,
            total_amount: total,
            status: 'paid',
            concept: `Suscripción ${currentPack?.label}`,
            quarter: Math.floor(new Date().getMonth() / 3) + 1,
            irpf_amount: 0,
            irpf_rate: 0
        };

        onInvoiceGenerated(newInvoice);
        
        const businessData = { 
            ...formData, 
            stripeConnection: {
                status: 'connected' as const,
                customerId: stripeCustomer.customerId,
                subscriptionId: subscription.subscriptionId,
                last4: stripeCustomer.last4,
                cardBrand: stripeCustomer.brand
            }
        };
        
        onSuccess(businessData, newBusinessId);
        setIsProcessingPayment(false);

    } catch (error: any) {
        alert(`Error: ${error.message}`);
        setIsProcessingPayment(false);
    }
  };

  const addSede = () => setFormData(prev => ({ ...prev, sedes: [...prev.sedes, { calle: '', cp: '', ciudad: '', provincia: '' }] }));
  const removeSede = (index: number) => setFormData(prev => ({ ...prev, sedes: prev.sedes.filter((_, i) => i !== index) }));
  const updateSede = (index: number, field: keyof AddressDetails, value: string) => {
      const newSedes = [...formData.sedes];
      newSedes[index] = { ...newSedes[index], [field]: value };
      setFormData({ ...formData, sedes: newSedes });
  };

  const toggleConsent = (key: keyof typeof formData.consents) => {
      if (!readDocs[key]) return alert("Debes abrir y leer el documento completo antes de aceptar.");
      setFormData(prev => ({ ...prev, consents: { ...prev.consents, [key]: !prev.consents[key] } }));
  };

  const openLegalDoc = (e: React.MouseEvent, title: string, content: string, type: 'privacy'|'terms'|'contract') => {
      e.preventDefault();
      setLegalTextToShow({ title, content, type });
  };

  const financials = calculateFinancials();

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md animate-fade-in">
      {/* LEGAL MODAL */}
      {legalTextToShow && (
          <div className="absolute inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-[2rem] w-full max-w-3xl h-[80vh] flex flex-col shadow-2xl relative border-4 border-white">
                  <div className="p-6 border-b flex justify-between items-center bg-gray-50 rounded-t-[2rem]">
                      <h3 className="text-xl font-black uppercase italic">{legalTextToShow.title}</h3>
                      <button onClick={() => setLegalTextToShow(null)} className="text-xl font-bold px-3">×</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 whitespace-pre-wrap text-sm" onScroll={handleLegalScroll} ref={legalContentRef}>
                      {legalTextToShow.content}
                      <div className="h-20"></div>
                      <p className="text-center text-gray-400 text-xs">--- Fin del Documento ---</p>
                  </div>
                  <div className="p-6 border-t bg-white rounded-b-[2rem] text-center">
                      <button onClick={() => readDocs[legalTextToShow.type] ? setLegalTextToShow(null) : alert("Lee hasta el final.")} className={`px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest ${readDocs[legalTextToShow.type] ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                          {readDocs[legalTextToShow.type] ? 'He leído y Acepto' : 'Lee hasta el final...'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="bg-white rounded-[2.5rem] w-full max-w-6xl h-[95vh] flex flex-col shadow-2xl overflow-hidden relative">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-gray-100 rounded-full hover:bg-red-100 text-gray-500 hover:text-red-500 z-10">✕</button>

        <div className="bg-gray-50 p-8 border-b">
          <h2 className="text-2xl font-black text-gray-900 uppercase italic">Alta de Nuevo Negocio</h2>
          <div className="flex gap-2 mt-4">
            {[1, 2, 3, 4].map(s => <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? 'bg-orange-500' : 'bg-gray-200'}`}></div>)}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          {step === 1 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {SECTORS.map(sector => (
                <button key={sector.id} onClick={() => setFormData({ ...formData, sectorId: sector.id })} className={`p-6 rounded-2xl border-2 flex flex-col items-center gap-3 ${formData.sectorId === sector.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                  <span className="text-4xl">{sector.icon}</span>
                  <span className="text-[10px] font-black uppercase">{sector.label}</span>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8">
              <div className="flex justify-center bg-gray-100 p-1 rounded-xl w-fit mx-auto">
                <button onClick={() => setFormData({...formData, billingCycle: 'monthly'})} className={`px-6 py-2 rounded-lg text-xs font-black uppercase ${formData.billingCycle === 'monthly' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Mensual</button>
                <button onClick={() => setFormData({...formData, billingCycle: 'annual'})} className={`px-6 py-2 rounded-lg text-xs font-black uppercase ${formData.billingCycle === 'annual' ? 'bg-white shadow-sm' : 'text-gray-500'}`}>Anual (-20%)</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {subscriptionPacks.map(pack => (
                  <div key={pack.id} onClick={() => setFormData({ ...formData, packId: pack.id })} className={`p-6 rounded-[2rem] border-2 cursor-pointer relative ${formData.packId === pack.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
                    {formData.packId === pack.id && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase">Seleccionado</div>}
                    <h4 className="text-xl font-black uppercase italic">{pack.label}</h4>
                    <p className="text-3xl font-black text-orange-600 mt-2">{formData.billingCycle === 'annual' ? pack.annualPriceYear1 : pack.monthlyPrice}€</p>
                    <ul className="mt-6 space-y-3">{pack.benefits.map((b, i) => <li key={i} className="text-xs font-bold text-gray-600">✓ {b}</li>)}</ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 p-6 rounded-[2rem]">
                <input required className="input-field" value={formData.nombreNegocio} onChange={e => setFormData({...formData, nombreNegocio: e.target.value})} placeholder="Nombre Comercial" />
                <input required className="input-field" value={formData.nif} onChange={e => setFormData({...formData, nif: e.target.value})} placeholder="NIF / CIF" />
                <input required className="input-field" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} placeholder="Nombre Contacto" />
                <input required type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email Admin" />
                <input required type="password" className="input-field" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="Contraseña" />
                <input required type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repetir Contraseña" />
                <input required className="input-field md:col-span-2" value={formData.direccionPrincipal.calle} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, calle: e.target.value}})} placeholder="Dirección Principal" />
                <input required className="input-field" value={formData.direccionPrincipal.ciudad} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, ciudad: e.target.value}})} placeholder="Ciudad" />
                <input required className="input-field" value={formData.direccionPrincipal.cp} onChange={e => setFormData({...formData, direccionPrincipal: {...formData.direccionPrincipal, cp: e.target.value}})} placeholder="CP" />
              </div>
              
              <div className="flex justify-between items-center">
                  <h4 className="font-black uppercase italic">Sedes Adicionales</h4>
                  <button onClick={addSede} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase">+ Añadir</button>
              </div>
              {formData.sedes.map((sede, idx) => (
                  <div key={idx} className="bg-blue-50 p-4 rounded-xl relative">
                      <button onClick={() => removeSede(idx)} className="absolute top-2 right-2 text-red-500 font-bold">✕</button>
                      <input className="bg-white p-2 rounded w-full mb-2 text-xs" placeholder="Dirección" value={sede.calle} onChange={e => updateSede(idx, 'calle', e.target.value)} />
                      <div className="grid grid-cols-2 gap-2">
                          <input className="bg-white p-2 rounded text-xs" placeholder="Ciudad" value={sede.ciudad} onChange={e => updateSede(idx, 'ciudad', e.target.value)} />
                          <input className="bg-white p-2 rounded text-xs" placeholder="CP" value={sede.cp} onChange={e => updateSede(idx, 'cp', e.target.value)} />
                      </div>
                  </div>
              ))}

              <div className="bg-white p-6 rounded-2xl border-2 border-orange-100 space-y-3">
                  <h4 className="text-xs font-black uppercase">Legal</h4>
                  {['privacy', 'terms', 'contract'].map(type => (
                      <label key={type} className={`flex items-start gap-3 cursor-pointer ${!readDocs[type as any] ? 'opacity-50' : ''}`}>
                          <input type="checkbox" className="mt-1" checked={formData.consents[type as any]} onChange={() => toggleConsent(type as any)} disabled={!readDocs[type as any]} />
                          <span className="text-xs">
                              He leído y acepto <button onClick={(e) => openLegalDoc(e, type.toUpperCase(), (LEGAL_TEXTS as any)[type === 'contract' ? 'SUBSCRIPTION_CONTRACT' : type === 'privacy' ? 'PRIVACY_POLICY' : 'TERMS_OF_USE'], type as any)} className="text-orange-600 underline">{type.toUpperCase()}</button>
                          </span>
                      </label>
                  ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid lg:grid-cols-2 gap-10">
                <div className="bg-gray-50 p-8 rounded-[2.5rem] space-y-4">
                    <h3 className="font-black uppercase">Resumen</h3>
                    <div className="flex justify-between font-bold text-sm">
                        <span>Plan {currentPack?.label}</span>
                        <span>{formData.billingCycle === 'annual' ? currentPack?.annualPriceYear1 : currentPack?.monthlyPrice}€</span>
                    </div>
                    {formData.sedes.length > 0 && (
                        <div className="flex justify-between font-bold text-sm">
                            <span>Sedes Extra ({formData.sedes.length})</span>
                            <span>
                                {((formData.billingCycle === 'annual' ? currentPack!.extraLocationPrice * 12 : currentPack!.extraLocationPrice) * formData.sedes.length).toFixed(2)}€
                            </span>
                        </div>
                    )}
                    <div className="flex gap-2 pt-4">
                        <input className="bg-white border rounded p-2 text-xs flex-1 uppercase" placeholder="CUPÓN" value={couponCode} onChange={e => setCouponCode(e.target.value)} disabled={!!appliedCoupon} />
                        <button onClick={validateCoupon} disabled={isValidatingCoupon || !!appliedCoupon} className="bg-black text-white px-4 rounded text-xs font-bold">
                            {isValidatingCoupon ? '...' : appliedCoupon ? '✓' : 'APLICAR'}
                        </button>
                    </div>
                    <div className="border-t pt-4 flex justify-between items-center">
                        <span className="font-black">TOTAL</span>
                        <span className="text-2xl font-black">{financials.total.toFixed(2)}€</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="font-black uppercase">Pago Seguro</h3>
                    <input className="input-field" placeholder="Titular" value={cardDetails.name} onChange={e => setCardDetails({...cardDetails, name: e.target.value})} />
                    <input className="input-field font-mono" placeholder="0000 0000 0000 0000" maxLength={19} value={cardDetails.number} onChange={e => setCardDetails({...cardDetails, number: e.target.value})} />
                    <div className="grid grid-cols-2 gap-4">
                        <input className="input-field font-mono text-center" placeholder="MM/YY" maxLength={5} value={cardDetails.expiry} onChange={handleExpiryChange} />
                        <input className="input-field font-mono text-center" placeholder="CVC" maxLength={3} value={cardDetails.cvc} onChange={e => setCardDetails({...cardDetails, cvc: e.target.value})} />
                    </div>
                </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-between bg-white">
          {step > 1 && !isProcessingPayment && <button onClick={() => setStep(s => s - 1)} className="px-6 py-3 rounded-xl font-bold uppercase text-xs text-gray-500 hover:bg-gray-100">Atrás</button>}
          <div className="flex-1"></div>
          {step < 4 ? (
            <button onClick={handleNext} className="bg-gray-900 text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-orange-600 shadow-lg">Siguiente</button>
          ) : (
            <button onClick={handleSubmit} disabled={isProcessingPayment} className="bg-[#635BFF] text-white px-8 py-3 rounded-xl font-black uppercase text-xs tracking-widest hover:bg-[#5349e0] shadow-lg flex items-center gap-2">
                {isProcessingPayment ? <Loader2 className="animate-spin w-4 h-4"/> : 'PAGAR Y ACTIVAR'}
            </button>
          )}
        </div>
      </div>
      <style>{`.input-field { width: 100%; background: white; border: 1px solid #e5e7eb; padding: 0.75rem; border-radius: 0.75rem; font-weight: 700; font-size: 0.875rem; outline: none; }`}</style>
    </div>
  );
};
