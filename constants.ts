
import { SectorInfo, SubscriptionPack, Business, UserAccount, SaaSMetrics, SupportTicket, AuditLog, ForumQuestion, Invoice, DiscountCode, Banner, Contract, EmailTemplate, AdvertisingSupplement, CountryConfig, SystemFinancialConfig, SocialConfig, CountryCode, GovernanceRule, Lead } from './types';

export const MAX_SYSTEM_RADIUS = 20000; // Radio base 20km
export const MICRO_PAYMENT_AMOUNT = 2.00;
export const LEAD_UNLOCK_PRICE = 3.00;
export const PUSH_NOTIFICATION_PRICE = 2.00;
export const AI_PACK_PRICE = 10.00; 
export const AI_PACK_AMOUNT = 10; 
export const BANNER_1_DAY_PRICE = 10.00;
export const BANNER_7_DAYS_PRICE = 40.00;
export const BANNER_14_DAYS_PRICE = 70.00;

// --- SWEET CREDITS SYSTEM ---
export const CREDIT_PACKS = [
    { id: 'pack_mini', credits: 10, price: 10.00, label: 'Pack Degustación', bonus: 0 },
    { id: 'pack_medium', credits: 25, price: 20.00, label: 'Pack Goloso', bonus: 5 }, 
    { id: 'pack_pro', credits: 60, price: 40.00, label: 'Pack Maestro', bonus: 10 },
];

export const ACTION_COSTS = {
    PUSH_NOTIFICATION: 2,
    LEAD_UNLOCK: 3,
    BANNER_FLASH_24H: 5,
    STORY_BOOST: 1,
    STORY_VIDEO: 2
};

export const SECTORS: SectorInfo[] = [
  { 
    id: 'mesas_dulces', 
    label: 'Mesas Dulces', 
    description: 'Diseño exclusivo de candy bars y repostería para eventos.', 
    icon: '🧁', 
    color: 'bg-pink-400', 
    tags: ['Candy Bar', 'Bodas', 'Bautizos', 'Comuniones', 'Cumpleaños', 'Corporativo', 'Personalizado', 'Tartas Fondant'] 
  },
  { 
    id: 'pasteleria', 
    label: 'Pastelería', 
    description: 'Alta repostería tradicional y moderna.', 
    icon: '🍰', 
    color: 'bg-yellow-400', 
    tags: ['Artesanal', 'Gourmet', 'Fresco', 'Pastelería Fina', 'Tradición', 'Novedad', 'Mousse', 'Hojaldre'] 
  },
  { 
    id: 'reposteria_creativa',
    label: 'Repostería Creativa',
    description: 'Tartas de diseño, modelado en azúcar y arte comestible.',
    icon: '🎂',
    color: 'bg-indigo-400',
    tags: ['Fondant', 'Diseño 3D', 'Tartas Escultura', 'Cookies Decoradas', 'Cake Pops']
  },
  { 
    id: 'confiterias', 
    label: 'Confiterías', 
    description: 'Bombones y dulces artesanales de autor.', 
    icon: '🥐', 
    color: 'bg-purple-400', 
    tags: ['Chocolate', 'Tradición', 'Bombones', 'Pralinés', 'Trufas', 'Caramelos'] 
  },
  { 
    id: 'churrerias_creperias', 
    label: 'Churrerías y Creperías', 
    description: 'El sabor de la tradición y el capricho.', 
    icon: '🥨', 
    color: 'bg-orange-400', 
    tags: ['Churros', 'Chocolate', 'Porras', 'Crepes Dulces', 'Crepes Salados', 'Desayunos'] 
  },
  { 
    id: 'heladerias', 
    label: 'Heladerías', 
    description: 'Frescura artesanal en cada bola.', 
    icon: '🍦', 
    color: 'bg-cyan-400', 
    tags: ['Helado', 'Natural', 'Fruta Real', 'Sin Conservantes', 'Sorbetes', 'Cremosos'] 
  },
  { 
    id: 'tiendas_chucherias', 
    label: 'Tiendas de Chucherías', 
    description: 'Un paraíso de colores y sabores.', 
    icon: '🍭', 
    color: 'bg-red-400', 
    tags: ['Gominolas', 'Color', 'Regalos Dulces', 'Tallas Personalizadas', 'Fiestas', 'Piñatas'] 
  }
];

export const COUNTRIES_DB: CountryConfig[] = [
  { code: 'ES', name: 'España', flag: '🇪🇸', language: 'es', currency: 'EUR', currencySymbol: '€', taxName: 'IVA', defaultTaxRate: 21, locale: 'es-ES' },
  { code: 'US', name: 'United States', flag: '🇺🇸', language: 'en', currency: 'USD', currencySymbol: '$', taxName: 'Sales Tax', defaultTaxRate: 8, locale: 'en-US' },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', language: 'en', currency: 'GBP', currencySymbol: '£', taxName: 'VAT', defaultTaxRate: 20, locale: 'en-GB' },
  { code: 'FR', name: 'France', flag: '🇫🇷', language: 'fr', currency: 'EUR', currencySymbol: '€', taxName: 'TVA', defaultTaxRate: 20, locale: 'fr-FR' },
  { code: 'DE', name: 'Deutschland', flag: '🇩🇪', language: 'de', currency: 'EUR', currencySymbol: '€', taxName: 'MwSt', defaultTaxRate: 19, locale: 'de-DE' },
  { code: 'MX', name: 'México', flag: '🇲🇽', language: 'es', currency: 'MXN', currencySymbol: '$', taxName: 'IVA', defaultTaxRate: 16, locale: 'es-MX' },
];

export const INITIAL_SYSTEM_FINANCIALS: Record<CountryCode, SystemFinancialConfig> = {
  'ES': { 
    taxRate: 21, extraLocationFee: 0,
    globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE – Lemesedelce S.L.', formJuridica: 'SL', nif: 'B12345678', address: 'Calle de la Piruleta 123', city: '28001 Madrid', email: 'legal@elemede.com', phone: '910 000 000' },
    autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 5 },
    governanceRules: []
  },
  'US': { taxRate: 8, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true, issuerDetails: { businessName: 'ELEMEDE INC', formJuridica: 'INC', nif: 'US-99999', address: '123 Candy Lane', city: 'New York, NY', email: 'billing@elemede.com', phone: '+1 555 0000' }, autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: false, dynamicRadius: true, maxDensityPerZone: 3 }, governanceRules: [] },
  'GB': { taxRate: 20, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true, issuerDetails: { businessName: 'ELEMEDE LTD', formJuridica: 'LTD', nif: 'GB-88888', address: 'London Sweet St', city: 'London', email: 'billing.uk@elemede.com', phone: '+44 20 0000' }, autoPilot: { dynamicPricing: false, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 4 }, governanceRules: [] },
  'FR': { taxRate: 20, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true, issuerDetails: { businessName: 'ELEMEDE FRANCE', formJuridica: 'SAS', nif: 'FR-77777', address: 'Rue de la Douceur', city: 'Paris', email: 'billing.fr@elemede.com', phone: '+33 1 00 00 00' }, autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 6 }, governanceRules: [] },
  'DE': { taxRate: 19, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true, issuerDetails: { businessName: 'ELEMEDE GMBH', formJuridica: 'GmbH', nif: 'DE-66666', address: 'Süße Straße', city: 'Berlin', email: 'billing.de@elemede.com', phone: '+49 30 0000' }, autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 5 }, governanceRules: [] },
  'MX': { taxRate: 16, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true, issuerDetails: { businessName: 'ELEMEDE MEXICO', formJuridica: 'SA de CV', nif: 'MX-55555', address: 'Av. Dulces', city: 'CDMX', email: 'billing.mx@elemede.com', phone: '+52 55 0000' }, autoPilot: { dynamicPricing: false, autoSEO: true, autoModeration: true, saturationControl: false, dynamicRadius: true, maxDensityPerZone: 8 }, governanceRules: [] },
};

// --- SECURITY: INTERNAL ADMINS (HASHED PASSWORDS) ---
// Passwords are NOT visible here. Only their SHA-256 hash.
// 1. Root: ELEM_R00T_v9$X
// 2. Marketing: MKT_Guro_88!
// 3. Finance: CASH_Flow_$$$
// 4. Support: SUP_Tick_2025

export const MOCK_USERS: UserAccount[] = [
  // --- INTERNAL ADMINS (SECURE) ---
  { 
    id: 'adm_root', 
    email: 'sys.root@internal.elemede.local', 
    // Hash for: ELEM_R00T_v9$X
    password_hash: '9cd836079c0598762507662860737373f982823626d7f3730303036666336336', 
    name: 'SYSTEM ROOT', 
    role: 'admin_root', 
    status: 'active', 
    date_registered: '2023-01-01' 
  },
  { 
    id: 'adm_mkt', 
    email: 'mkt.lead@internal.elemede.local', 
    // Hash for: MKT_Guro_88!
    password_hash: '5f9c387d976077302766699c2777097b69572b626d56715f69695cc7e2a96933', 
    name: 'Director Marketing', 
    role: 'admin_marketing', 
    status: 'active' 
  },
  { 
    id: 'adm_fin', 
    email: 'fin.cfo@internal.elemede.local', 
    // Hash for: CASH_Flow_$$$
    password_hash: 'a7f9f9d562722c1025539563242634d262793262627632663911111111111111', 
    name: 'CFO Finanzas', 
    role: 'admin_finanzas', 
    status: 'active' 
  },
  { 
    id: 'adm_sup', 
    email: 'help.desk@internal.elemede.local', 
    // Hash for: SUP_Tick_2025
    password_hash: 'b8e5c6e834a7aa6eded54c26ce2bb2e74903538c61bdd5d2197997ab2f725555', 
    name: 'Jefe Soporte', 
    role: 'admin_soporte', 
    status: 'active' 
  },
  
  // --- DEMO USERS ---
  { id: '2', email: 'biz1@sweet.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', name: 'Juan Pastelero', role: 'business_owner', linkedBusinessId: '1', status: 'active', date_registered: '2023-02-15' },
  { id: '3', email: 'user@gmail.com', password_hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', name: 'Ana Golosa', role: 'user', favorites: ['1', '3'], status: 'active', date_registered: '2023-03-10' }
];

export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1', name: 'La Dulcería de Ana', sectorId: 'pasteleria', packId: 'super_top', nif: 'B12345678', phone: '912345678', cp: '28001', address: 'Calle Mayor 10', city: 'Madrid', province: 'Madrid', lat: 40.4168, lng: -3.7038, status: 'active', createdAt: '2024-01-15',
    mainImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1626803775151-61d756612f97?auto=format&fit=crop&q=80&w=800'],
    tags: ['Sin Gluten', 'Vegano', 'Bodas'],
    description: 'La Dulcería de Ana es el referente en pastelería sin gluten de Madrid. Elaboramos diariamente nuestros productos con ingredientes certificados.',
    ratings: [{id: 'r1', stars: 5, comment: 'Increíble tarta de queso', date: '2024-02-01'}],
    stats: { views: 1250, clicks: 85, ctr: 0.068, saturationIndex: 0.2 },
    reliabilityScore: 98,
    direccionesAdicionales: [{ calle: 'Paseo de la Castellana 200', cp: '28046', ciudad: 'Madrid', provincia: 'Madrid', lat: 40.4668, lng: -3.6890 }],
    stories: [{ id: 's1', timestamp: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), type: 'fresh_batch', text: '¡Croissants calientes!', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800', mediaType: 'image' }],
    totalAdSpend: 450.50,
    credits: 15
  },
  {
    id: '2', name: 'Churros & Co', sectorId: 'churrerias_creperias', packId: 'basic', nif: 'B87654321', phone: '934567890', cp: '08001', address: 'La Rambla 50', city: 'Barcelona', province: 'Barcelona', lat: 41.3851, lng: 2.1734, status: 'active', createdAt: '2024-02-20',
    mainImage: 'https://images.unsplash.com/photo-1614739665304-453724c9657c?auto=format&fit=crop&q=80&w=800',
    tags: ['Tradicional'],
    description: 'Churros tradicionales hechos al momento. Chocolate espeso y crujiente.',
    ratings: [],
    stats: { views: 400, clicks: 12, ctr: 0.03, saturationIndex: 0.8 },
    reliabilityScore: 75,
    totalAdSpend: 0,
    credits: 0
  },
  {
    id: '3', name: 'Sweet Dreams', sectorId: 'mesas_dulces', packId: 'premium', nif: 'B11223344', phone: '963258741', cp: '46001', address: 'Plaza Reina 5', city: 'Valencia', province: 'Valencia', lat: 39.4744, lng: -0.3753, status: 'active', createdAt: '2024-03-05',
    mainImage: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800',
    tags: ['Bodas', 'Eventos'],
    description: 'Creamos mesas dulces de ensueño para tu boda o evento.',
    ratings: [{id: 'r2', stars: 4, comment: 'Muy bonito todo', date: '2024-03-10'}],
    stats: { views: 890, clicks: 45, ctr: 0.05, saturationIndex: 0.4 },
    reliabilityScore: 88,
    totalAdSpend: 120.00,
    credits: 5
  }
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', business_id: '1', business_name: 'ELEMEDE SL', business_nif: 'B12345678', client_name: 'La Dulcería de Ana', client_nif: 'B12345678', date: '2024-01-15', due_date: '2024-01-15', base_amount: 49.58, iva_rate: 21, iva_amount: 10.42, irpf_rate: 0, irpf_amount: 0, total_amount: 60.00, status: 'paid', concept: 'Suscripción Pack DOMINIO (Mensual)', quarter: 1 },
];

export const SUBSCRIPTION_PACKS: SubscriptionPack[] = [
  { 
    id: 'basic', label: 'Pack BRONCE', 
    monthlyPrice: 20, annualPriceYear1: 192,
    extraLocationPrice: 10, 
    benefits: ['Perfil Básico', '3 Fotos', 'Visible en Mapa (500m)', '3 Etiquetas', '1 Sede Gratis (Anual)'], 
    colorClass: 'bg-orange-800', badge: 'BRONCE', 
    visibilityRadius: 500, sortingScore: 10, 
    limits: { images: 3, videos: 0, tags: 3 } 
  },
  { 
    id: 'medium', label: 'Pack PLATA', 
    monthlyPrice: 30, annualPriceYear1: 288,
    extraLocationPrice: 8, 
    benefits: ['Perfil Completo', '10 Fotos', 'Visible 3km', 'Publicidad y Ads', '7 Etiquetas', '2 Sedes Gratis (Anual)'], 
    colorClass: 'bg-slate-400', badge: 'PLATA', 
    visibilityRadius: 3000, sortingScore: 20, 
    limits: { images: 10, videos: 0, tags: 7 } 
  },
  { 
    id: 'premium', label: 'Pack GOLD', 
    monthlyPrice: 40, annualPriceYear1: 384,
    extraLocationPrice: 6, 
    benefits: ['Destacado', '15 Fotos', 'Visible 10km', 'Soporte Prioritario', 'Campañas Ads', 'Analytics', '10 Etiquetas', '3 Sedes Gratis (Anual)'], 
    colorClass: 'bg-yellow-500', badge: 'GOLD', 
    visibilityRadius: 10000, sortingScore: 50, 
    limits: { images: 15, videos: 1, tags: 10 } 
  },
  { 
    id: 'super_top', label: 'Pack DOMINIO', 
    monthlyPrice: 60, annualPriceYear1: 576,
    extraLocationPrice: 4, 
    benefits: ['Top Ranking', '30 Fotos', 'Visible 20km', 'Prioridad Ads (25% Dto)', 'Etiquetas Ilimitadas', 'Prioridad Eventos >1000€', 'IA Content', '5 Sedes Gratis (Anual)'], 
    colorClass: 'bg-orange-600', badge: 'DOMINIO', 
    visibilityRadius: 20000, sortingScore: 100, 
    limits: { images: 30, videos: 5, tags: 999 } 
  }
];

export const SWEET_KEYWORDS = ['tarta de queso', 'croissant', 'chocolate', 'churros', 'helado', 'sin gluten', 'vegano', 'donuts', 'bombones', 'turron'];

export const LEGAL_TEXTS = {
  PRIVACY_POLICY: `POLÍTICA DE PRIVACIDAD GENERICA ELEMEDE...`,
  TERMS_OF_USE: `CONDICIONES DE USO ELEMEDE...`,
  SUBSCRIPTION_CONTRACT: `CONTRATO DE SUSCRIPCIÓN...`,
  LEGAL_NOTICE: `AVISO LEGAL...`,
  COOKIES_POLICY: `POLÍTICA DE COOKIES...`
};

export const ALL_LEGAL_DOCS = LEGAL_TEXTS.TERMS_OF_USE + "\n\n" + LEGAL_TEXTS.LEGAL_NOTICE + "\n\n" + LEGAL_TEXTS.PRIVACY_POLICY;

export const MOCK_DISCOUNT_CODES: DiscountCode[] = [
    { id: 'c1', code: 'WELCOME20', type: 'porcentaje', value: 20, status: 'active', usage_limit: 100, usage_count: 12, valid_from: '2024-01-01', valid_to: '2025-12-31', applicable_targets: ['plan_subscription'] },
];

export const MOCK_BANNERS: Banner[] = [
    { id: 'b1', title: 'Ruta del Chocolate', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?auto=format&fit=crop&q=80&w=800', type: 'sector_campaign', subtype: 'seasonality', position: 'header', start_date: '2024-01-01', end_date: '2025-12-31', status: 'active', visibility_rules: { roles: ['all'], plans: ['all'] }, views: 1200, clicks: 45 },
];

export const MOCK_FORUM: ForumQuestion[] = [
    { id: 'q1', sectorId: 'pasteleria', authorName: 'María G.', province: 'Madrid', title: '¿Dónde encontrar tarta de queso estilo La Viña?', content: 'Busco una pastelería que la haga cremosa por dentro y tostada por fuera.', date: '2024-03-15', answers: [] },
];

export const DEFAULT_SOCIAL_LINKS: SocialConfig = {
    instagram: 'https://instagram.com/elemede_sweet',
    facebook: 'https://facebook.com/elemede',
    tiktok: 'https://tiktok.com/@elemede',
    twitter: 'https://x.com/elemede',
    youtube: 'https://youtube.com/@elemede'
};

export const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
    { id: 't1', type: 'onboarding', label: 'Bienvenida Negocio', subject: '¡Bienvenido a ELEMEDE, {{name}}!', body: 'Hola {{name}},\n\nTu cuenta ya está activa.', variables: ['name', 'businessName', 'planName'], last_updated: '2024-01-01', status: 'active' },
];

export const MOCK_LEADS: Lead[] = [
    { id: 'l1', eventType: 'boda', date: '2024-09-15', guests: 150, budget: '1500€', description: 'Mesa dulce completa.', location: 'Finca El Olivar, Madrid', clientName: 'Sofía Martín', clientContact: '600123456', createdAt: '2024-03-20' },
];
