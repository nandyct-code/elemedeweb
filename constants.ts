
import { SectorInfo, SubscriptionPack, Business, UserAccount, SaaSMetrics, SupportTicket, AuditLog, ForumQuestion, Invoice, DiscountCode, Banner, Contract, EmailTemplate, AdvertisingSupplement, CountryConfig, SystemFinancialConfig, SocialConfig, CountryCode, GovernanceRule, Lead } from './types';

export const MAX_SYSTEM_RADIUS = 3750; // Radio base
export const MICRO_PAYMENT_AMOUNT = 1.21; // Coste notificación Push Flash
export const LEAD_UNLOCK_PRICE = 2.50; // Coste desbloqueo Lead (Gratis para Dominio)
export const PUSH_NOTIFICATION_PRICE = 1.21; // Precio exacto solicitado
export const AI_PACK_PRICE = 9.90; 
export const AI_PACK_AMOUNT = 10; 
export const BANNER_1_DAY_PRICE = 9.90;
export const BANNER_7_DAYS_PRICE = 39.90;
export const BANNER_14_DAYS_PRICE = 69.90;

export const SECTORS: SectorInfo[] = [
  { 
    id: 'mesas_dulces', 
    label: 'Mesas Dulces', 
    description: 'Diseño exclusivo de candy bars y repostería para eventos.', 
    icon: '🧁', 
    color: 'bg-pink-400', 
    tags: [
      'Candy Bar', 'Bodas', 'Bautizos', 'Comuniones', 'Cumpleaños', 'Corporativo', 
      'Personalizado', 'Tartas Fondant', 'Cupcakes', 'Macarons', 'Donuts Wall', 
      'Sin Gluten', 'Vegano', 'Decoración Temática', 'Montaje Incluido'
    ] 
  },
  { 
    id: 'pasteleria', 
    label: 'Pastelería', 
    description: 'Alta repostería tradicional y moderna.', 
    icon: '🍰', 
    color: 'bg-yellow-400', 
    tags: [
      'Artesanal', 'Gourmet', 'Fresco', 'Pastelería Fina', 'Tradición', 'Novedad', 
      'Mousse', 'Hojaldre', 'Bollería', 'Sin Azúcar', 'Tartas de Cumpleaños', 
      'Pasteles de Autor', 'Ingredientes Bio', 'Fruta de Temporada', 'Repostería Francesa',
      'Tartas Frías', 'Bizcochos Caseros', 'Salados', 'Panadería Gourmet'
    ] 
  },
  { 
    id: 'confiterias', 
    label: 'Confiterías', 
    description: 'Bombones y dulces artesanales de autor.', 
    icon: '🥐', 
    color: 'bg-purple-400', 
    tags: [
      'Chocolate', 'Tradición', 'Bombones', 'Pralinés', 'Trufas', 'Caramelos', 
      'Regalo Gourmet', 'Cajas de Lujo', 'Frutos Secos', 'Chocolate Negro', 
      'Chocolate con Leche', 'Chocolate Blanco', 'Sin Lactosa', 'Artesanía Real',
      'Dulces Típicos', 'Turrones', 'Mazapanes', 'Peladillas'
    ] 
  },
  { 
    id: 'churrerias_creperias', 
    label: 'Churrerías y Creperías', 
    description: 'El sabor de la tradición y el capricho.', 
    icon: '🥨', 
    color: 'bg-orange-400', 
    tags: [
      'Churros', 'Chocolate', 'Porras', 'Crepes Dulces', 'Crepes Salados', 
      'Desayunos', 'Meriendas', 'Chocolate a la Taza', 'Gofres', 'Toppings', 
      'Artesanal', 'Receta Familiar', 'Servicio a Domicilio', 'Take Away',
      'Churros Rellenos', 'Batidos Naturales', 'Café Especialidad'
    ] 
  },
  { 
    id: 'heladerias', 
    label: 'Heladerías', 
    description: 'Frescura artesanal en cada bola.', 
    icon: '🍦', 
    color: 'bg-cyan-400', 
    tags: [
      'Helado', 'Natural', 'Fruta Real', 'Sin Conservantes', 'Sorbetes', 
      'Cremosos', 'Sin Gluten', 'Vegano', 'Cucuruchos Artesanos', 'Tarrinas', 
      'Helado de Autor', 'Sabores Exóticos', 'Granizados', 'Horchata', 
      'Popsicles', 'Yogur Helado', 'Batidos', 'Toppings Premium'
    ] 
  },
  { 
    id: 'tiendas_chucherias', 
    label: 'Tiendas de Chucherías', 
    description: 'Un paraíso de colores y sabores.', 
    icon: '🍭', 
    color: 'bg-red-400', 
    tags: [
      'Gominolas', 'Color', 'Regalos Dulces', 'Tallas Personalizadas', 'Fiestas', 
      'Piñatas', 'Snacks', 'Bebidas Frías', 'Pica Pica', 'Regaliz', 'Nubes', 
      'Sin Alérgenos', 'Frutos Secos', 'Piruletas', 'Brochetas Dulces',
      'Cumpleaños Infantiles', 'Globos', 'Detalles de Boda'
    ] 
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

const DEFAULT_GOVERNANCE_RULES: GovernanceRule[] = [
  { id: 'rule_1', name: 'Limpieza de Inactivos', condition: 'Inactividad > 90 días', action: 'Auto-Suspender Cuenta', isActive: true, lastTriggered: '2025-01-20' },
  { id: 'rule_2', name: 'Control de Saturación', condition: 'Densidad > 5 Negocios/km²', action: 'Bloquear Nuevos Registros en Zona', isActive: true },
  { id: 'rule_3', name: 'Boost de Calidad', condition: 'Valoración > 4.8 & Fotos > 5', action: 'Aplicar Boost de Visibilidad (+15%)', isActive: true, lastTriggered: '2025-01-23' },
  { id: 'rule_4', name: 'Protección Anti-Spam', condition: '> 3 Reportes/Semana', action: 'Auto-Moderación Preventiva', isActive: true },
];

export const INITIAL_SYSTEM_FINANCIALS: Record<CountryCode, SystemFinancialConfig> = {
  'ES': { 
    taxRate: 21, extraLocationFee: 0, // Managed in Pack now
    globalDiscount: 0, allowRegistrations: true,
    issuerDetails: {
        businessName: 'ELEMEDE – Lemesedelce S.L.',
        formJuridica: 'SL',
        nif: 'B12345678',
        address: 'Calle de la Piruleta 123',
        city: '28001 Madrid',
        email: 'legal@elemede.com',
        phone: '910 000 000'
    },
    autoPilot: {
        dynamicPricing: true,
        autoSEO: true,
        autoModeration: true,
        saturationControl: true,
        dynamicRadius: true,
        maxDensityPerZone: 5
    },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
  'US': { 
    taxRate: 8, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE INC', formJuridica: 'INC', nif: 'US-99999', address: '123 Candy Lane', city: 'New York, NY', email: 'billing@elemede.com', phone: '+1 555 0000' },
    autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: false, dynamicRadius: true, maxDensityPerZone: 3 },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
  'GB': { 
    taxRate: 20, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE LTD', formJuridica: 'LTD', nif: 'GB-88888', address: 'London Sweet St', city: 'London', email: 'billing.uk@elemede.com', phone: '+44 20 0000' },
    autoPilot: { dynamicPricing: false, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 4 },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
  'FR': { 
    taxRate: 20, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE FRANCE', formJuridica: 'SAS', nif: 'FR-77777', address: 'Rue de la Douceur', city: 'Paris', email: 'billing.fr@elemede.com', phone: '+33 1 00 00 00' },
    autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 6 },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
  'DE': { 
    taxRate: 19, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE GMBH', formJuridica: 'GmbH', nif: 'DE-66666', address: 'Süße Straße', city: 'Berlin', email: 'billing.de@elemede.com', phone: '+49 30 0000' },
    autoPilot: { dynamicPricing: true, autoSEO: true, autoModeration: true, saturationControl: true, dynamicRadius: true, maxDensityPerZone: 5 },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
  'MX': { 
    taxRate: 16, extraLocationFee: 0, globalDiscount: 0, allowRegistrations: true,
    issuerDetails: { businessName: 'ELEMEDE MEXICO', formJuridica: 'SA de CV', nif: 'MX-55555', address: 'Av. Dulces', city: 'CDMX', email: 'billing.mx@elemede.com', phone: '+52 55 0000' },
    autoPilot: { dynamicPricing: false, autoSEO: true, autoModeration: true, saturationControl: false, dynamicRadius: true, maxDensityPerZone: 8 },
    governanceRules: DEFAULT_GOVERNANCE_RULES
  },
};

export const MOCK_USERS: UserAccount[] = [
  { id: '1', email: 'admin@elemede.com', password_hash: 'admin123', name: 'Super Admin', role: 'admin_root', status: 'active', date_registered: '2023-01-01' },
  { id: '2', email: 'biz1@sweet.com', password_hash: '123456', name: 'Juan Pastelero', role: 'business_owner', linkedBusinessId: '1', status: 'active', date_registered: '2023-02-15' },
  { id: '3', email: 'user@gmail.com', password_hash: '123456', name: 'Ana Golosa', role: 'user', favorites: ['1', '3'], status: 'active', date_registered: '2023-03-10' },
  // SPECIFIC ADMIN ROLES FOR DEMO
  { id: 'adm_mk', email: 'marketing@elemede.com', password_hash: 'mark123', name: 'Director Marketing', role: 'admin_marketing', status: 'active' },
  { id: 'adm_fin', email: 'finanzas@elemede.com', password_hash: 'fin123', name: 'CFO Finanzas', role: 'admin_finanzas', status: 'active' },
  { id: 'adm_sup', email: 'soporte@elemede.com', password_hash: 'sup123', name: 'Jefe Soporte', role: 'admin_soporte', status: 'active' }
];

export const MOCK_BUSINESSES: Business[] = [
  {
    id: '1', name: 'La Dulcería de Ana', sectorId: 'pasteleria', packId: 'super_top', nif: 'B12345678', phone: '912345678', cp: '28001', address: 'Calle Mayor 10', city: 'Madrid', province: 'Madrid', lat: 40.4168, lng: -3.7038, status: 'active', createdAt: '2024-01-15',
    mainImage: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800',
    images: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=800', 'https://images.unsplash.com/photo-1626803775151-61d756612f97?auto=format&fit=crop&q=80&w=800'],
    tags: ['Sin Gluten', 'Vegano'],
    ratings: [{id: 'r1', stars: 5, comment: 'Increíble tarta de queso', date: '2024-02-01'}],
    stats: { views: 1250, clicks: 85, ctr: 0.068, saturationIndex: 0.2 },
    reliabilityScore: 98,
    direccionesAdicionales: [{ calle: 'Paseo de la Castellana 200', cp: '28046', ciudad: 'Madrid', provincia: 'Madrid', lat: 40.4668, lng: -3.6890 }],
    stories: [{ id: 's1', timestamp: new Date().toISOString(), expiresAt: new Date(Date.now() + 86400000).toISOString(), type: 'fresh_batch', text: '¡Croissants calientes!', imageUrl: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=800' }],
    totalAdSpend: 450.50
  },
  {
    id: '2', name: 'Churros & Co', sectorId: 'churrerias_creperias', packId: 'basic', nif: 'B87654321', phone: '934567890', cp: '08001', address: 'La Rambla 50', city: 'Barcelona', province: 'Barcelona', lat: 41.3851, lng: 2.1734, status: 'active', createdAt: '2024-02-20',
    mainImage: 'https://images.unsplash.com/photo-1614739665304-453724c9657c?auto=format&fit=crop&q=80&w=800',
    tags: ['Tradicional'],
    ratings: [],
    stats: { views: 400, clicks: 12, ctr: 0.03, saturationIndex: 0.8 },
    reliabilityScore: 75,
    totalAdSpend: 0
  },
  {
    id: '3', name: 'Sweet Dreams', sectorId: 'mesas_dulces', packId: 'premium', nif: 'B11223344', phone: '963258741', cp: '46001', address: 'Plaza Reina 5', city: 'Valencia', province: 'Valencia', lat: 39.4744, lng: -0.3753, status: 'active', createdAt: '2024-03-05',
    mainImage: 'https://images.unsplash.com/photo-1535141192574-5d4897c12636?auto=format&fit=crop&q=80&w=800',
    tags: ['Bodas', 'Eventos'],
    ratings: [{id: 'r2', stars: 4, comment: 'Muy bonito todo', date: '2024-03-10'}],
    stats: { views: 890, clicks: 45, ctr: 0.05, saturationIndex: 0.4 },
    reliabilityScore: 88,
    totalAdSpend: 120.00
  }
];

export const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-2024-001', business_id: '1', business_name: 'ELEMEDE SL', business_nif: 'B12345678', client_name: 'La Dulcería de Ana', client_nif: 'B12345678', date: '2024-01-15', due_date: '2024-01-15', base_amount: 100, iva_rate: 21, iva_amount: 21, irpf_rate: 0, irpf_amount: 0, total_amount: 121, status: 'paid', concept: 'Suscripción Pack FUEGO (Mensual)', quarter: 1 },
  { id: 'INV-2024-002', business_id: '2', business_name: 'ELEMEDE SL', business_nif: 'B12345678', client_name: 'Churros & Co', client_nif: 'B87654321', date: '2024-02-20', due_date: '2024-02-20', base_amount: 29, iva_rate: 21, iva_amount: 6.09, irpf_rate: 0, irpf_amount: 0, total_amount: 35.09, status: 'paid', concept: 'Suscripción Pack BRONCE (Mensual)', quarter: 1 },
];

export const SUBSCRIPTION_PACKS: SubscriptionPack[] = [
  { 
    id: 'basic', label: 'Pack BRONCE', 
    monthlyPrice: 20, annualPriceYear1: 192, // 20 * 12 * 0.8
    extraLocationPrice: 10, 
    benefits: ['Perfil Básico', '3 Fotos', 'Visible en Mapa (500m)', '3 Etiquetas', '1 Sede Gratis (Anual)'], 
    colorClass: 'bg-orange-800', badge: 'BRONCE', 
    visibilityRadius: 500, sortingScore: 10, 
    limits: { images: 3, videos: 0, tags: 3 } 
  },
  { 
    id: 'medium', label: 'Pack PLATA', 
    monthlyPrice: 30, annualPriceYear1: 288, // 30 * 12 * 0.8
    extraLocationPrice: 8, 
    benefits: ['Perfil Completo', '10 Fotos', 'Visible 3km', 'Publicidad y Ads', '7 Etiquetas', '2 Sedes Gratis (Anual)'], 
    colorClass: 'bg-slate-400', badge: 'PLATA', 
    visibilityRadius: 3000, sortingScore: 20, 
    limits: { images: 10, videos: 0, tags: 7 } 
  },
  { 
    id: 'premium', label: 'Pack GOLD', 
    monthlyPrice: 40, annualPriceYear1: 384, // 40 * 12 * 0.8
    extraLocationPrice: 6, 
    benefits: ['Destacado', '15 Fotos', 'Visible 10km', 'Soporte Prioritario', 'Campañas Ads', 'Analytics', '10 Etiquetas', '3 Sedes Gratis (Anual)'], 
    colorClass: 'bg-yellow-500', badge: 'GOLD', 
    visibilityRadius: 10000, sortingScore: 50, 
    limits: { images: 15, videos: 1, tags: 10 } 
  },
  { 
    id: 'super_top', label: 'Pack DOMINIO', 
    monthlyPrice: 60, annualPriceYear1: 576, // 60 * 12 * 0.8
    extraLocationPrice: 4, 
    benefits: ['Top Ranking', '30 Fotos', 'Visible 20km', 'Prioridad Ads (25% Dto)', 'Etiquetas Ilimitadas', 'Prioridad Eventos >1000€', 'IA Content', '5 Sedes Gratis (Anual)'], 
    colorClass: 'bg-orange-600', badge: 'DOMINIO', 
    visibilityRadius: 20000, sortingScore: 100, 
    limits: { images: 30, videos: 5, tags: 999 } 
  }
];

export const SWEET_KEYWORDS = [
  'tarta de queso', 'croissant', 'chocolate', 'churros', 'helado', 'sin gluten', 'vegano', 
  'donuts', 'palmeras', 'milhojas', 'rosquillas', 'torrijas', 'cupcakes', 'macarons', 
  'bombones', 'turron', 'mazapan', 'ensaimada', 'gofre', 'crepe', 'horchata', 'granizado'
];

export const LEGAL_TEXTS = {
    PRIVACY_POLICY: `POLÍTICA DE PRIVACIDAD Y PROTECCIÓN DE DATOS\n
1. RESPONSABLE DEL TRATAMIENTO
Identidad: ELEMEDE (Lemesedelce S.L.)
NIF: B12345678
Dirección: Calle de la Piruleta 123, 28001 Madrid, España
Email DPO: legal@elemede.com

2. FINALIDAD DEL TRATAMIENTO
Tratamos la información que nos facilitan las personas interesadas con el fin de:
- Gestionar la suscripción y visualización de negocios en la plataforma.
- Procesar pagos y facturación (mediante Stripe).
- Enviar notificaciones sobre el estado de la cuenta, leads y oportunidades.
- Prevenir el fraude y garantizar la seguridad de la plataforma.

3. LEGITIMACIÓN
La base legal para el tratamiento de sus datos es:
- Ejecución de un contrato: Para la prestación del servicio de suscripción.
- Consentimiento del interesado: Para el envío de comunicaciones comerciales y cookies.
- Interés legítimo: Para la prevención del fraude y mejora del servicio.

4. DESTINATARIOS
Los datos se comunicarán a los siguientes destinatarios:
- Proveedores de servicios de pago (Stripe) para el procesamiento de cobros.
- Administración Tributaria y Bancos para el cumplimiento de obligaciones legales.
- No se cederán datos a terceros salvo obligación legal.

5. DERECHOS
Cualquier persona tiene derecho a obtener confirmación sobre si en ELEMEDE estamos tratando datos personales que les conciernan. Las personas interesadas tienen derecho a:
- Acceder a sus datos personales.
- Solicitar la rectificación de los datos inexactos.
- Solicitar su supresión cuando, entre otros motivos, los datos ya no sean necesarios.
- Solicitar la limitación del tratamiento.
- Oponerse al tratamiento.
- Portabilidad de los datos.`,

    TERMS_OF_USE: `CONDICIONES GENERALES DE USO\n
1. OBJETO
Las presentes condiciones regulan el uso de la plataforma web y app móvil ELEMEDE, titularidad de Lemesedelce S.L.

2. USUARIOS
El acceso y/o uso de este portal atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.

3. USO DEL PORTAL
ELEMEDE proporciona el acceso a multitud de informaciones, servicios, programas o datos (en adelante, "los contenidos") en Internet pertenecientes a ELEMEDE o a sus licenciantes. El USUARIO asume la responsabilidad del uso del portal.

4. PROPIEDAD INTELECTUAL E INDUSTRIAL
ELEMEDE por sí o como cesionaria, es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma.

5. EXCLUSIÓN DE GARANTÍAS Y RESPONSABILIDAD
ELEMEDE no se hace responsable, en ningún caso, de los daños y perjuicios de cualquier naturaleza que pudieran ocasionar, a título enunciativo: errores u omisiones en los contenidos, falta de disponibilidad del portal o la transmisión de virus o programas maliciosos, a pesar de haber adoptado todas las medidas tecnológicas necesarias para evitarlo.

6. MODIFICACIONES
ELEMEDE se reserva el derecho de efectuar sin previo aviso las modificaciones que considere oportunas en su portal.`,

    SUBSCRIPTION_CONTRACT: `CONTRATO DE SUSCRIPCIÓN DE SERVICIOS DIGITALES\n
1. PARTES
De una parte, ELEMEDE (Lemesedelce S.L.), y de otra, el CLIENTE (Negocio o Profesional) identificado en el formulario de registro.

2. OBJETO DEL CONTRATO
Prestación de servicios de visibilidad digital, marketing y gestión de perfil en la plataforma ELEMEDE según el plan seleccionado (Bronce, Plata, Gold, Dominio).

3. DURACIÓN Y RENOVACIÓN
El contrato entrará en vigor en la fecha de alta y tendrá la duración vinculada al ciclo de facturación elegido (Mensual o Anual). Se renovará automáticamente por periodos iguales salvo preaviso de cancelación.

4. PRECIO Y FORMA DE PAGO
El precio será el estipulado en las tarifas vigentes en el momento de la contratación. El pago se realizará por adelantado mediante tarjeta de crédito/débito a través de la pasarela segura Stripe.
- El impago de cualquier cuota supondrá la suspensión inmediata del servicio.

5. POLÍTICA DE CANCELACIÓN Y DESISTIMIENTO
El CLIENTE podrá cancelar su suscripción en cualquier momento desde su panel de control. La cancelación será efectiva al finalizar el periodo de facturación en curso. No se realizarán reembolsos parciales por periodos no disfrutados.

6. OBLIGACIONES DEL CLIENTE
El CLIENTE garantiza la veracidad de los datos aportados y se compromete a mantener actualizada su información. El CLIENTE es responsable del contenido (imágenes y textos) que suba a la plataforma.

7. JURISDICCIÓN
Para la resolución de todas las controversias o cuestiones relacionadas con el presente sitio web o de las actividades en él desarrolladas, será de aplicación la legislación española, a la que se someten expresamente las partes.`
};

export const ALL_LEGAL_DOCS = `${LEGAL_TEXTS.PRIVACY_POLICY}\n\n-------------------\n\n${LEGAL_TEXTS.TERMS_OF_USE}\n\n-------------------\n\n${LEGAL_TEXTS.SUBSCRIPTION_CONTRACT}`;

export const MOCK_DISCOUNT_CODES: DiscountCode[] = [
    { id: 'c1', code: 'WELCOME20', type: 'porcentaje', value: 20, status: 'active', usage_limit: 100, usage_count: 12, valid_from: '2024-01-01', valid_to: '2025-12-31', applicable_targets: ['plan_subscription'] },
    { id: 'c2', code: 'VERANO50', type: 'fijo', value: 50, status: 'active', usage_limit: 50, usage_count: 45, valid_from: '2024-06-01', valid_to: '2024-09-30', applicable_targets: ['plan_subscription'] },
    { id: 'c3', code: 'ADBOOST', type: 'porcentaje', value: 15, status: 'active', usage_limit: 200, usage_count: 5, valid_from: '2024-01-01', valid_to: '2025-12-31', applicable_targets: ['ad_banner'] },
    { id: 'c4', code: 'MERIT10', type: 'porcentaje', value: 10, status: 'active', usage_limit: 1000, usage_count: 0, valid_from: '2024-01-01', valid_to: '2025-12-31', applicable_targets: ['plan_subscription'], requires_merit: true }
];

export const MOCK_BANNERS: Banner[] = [
    { id: 'b1', title: 'Ruta del Chocolate', imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476d?auto=format&fit=crop&q=80&w=800', type: 'sector_campaign', subtype: 'seasonality', position: 'header', start_date: '2024-01-01', end_date: '2025-12-31', status: 'active', visibility_rules: { roles: ['all'], plans: ['all'] }, views: 1200, clicks: 45 },
    { id: 'b2', title: 'Mejores Tartas 2024', imageUrl: 'https://images.unsplash.com/photo-1563729768-3980346f35d5?auto=format&fit=crop&q=80&w=800', type: 'sector_campaign', subtype: 'featured', position: 'header', start_date: '2024-01-01', end_date: '2025-12-31', status: 'active', visibility_rules: { roles: ['all'], plans: ['all'] }, views: 980, clicks: 30 }
];

export const MOCK_FORUM: ForumQuestion[] = [
    { id: 'q1', sectorId: 'pasteleria', authorName: 'María G.', province: 'Madrid', title: '¿Dónde encontrar tarta de queso estilo La Viña?', content: 'Busco una pastelería que la haga cremosa por dentro y tostada por fuera.', date: '2024-03-15', answers: [] },
    { id: 'q2', sectorId: 'reposteria_creativa', authorName: 'Carlos R.', province: 'Barcelona', title: 'Tarta fondant para boda friki', content: 'Necesito una tarta de Star Wars para 50 personas. ¿Recomendaciones?', date: '2024-03-14', answers: [] }
];

export const DEFAULT_SOCIAL_LINKS: SocialConfig = {
    instagram: 'https://instagram.com/elemede_sweet',
    facebook: 'https://facebook.com/elemede',
    tiktok: 'https://tiktok.com/@elemede',
    twitter: 'https://x.com/elemede',
    youtube: 'https://youtube.com/@elemede' // Added YouTube
};

export const MOCK_EMAIL_TEMPLATES: EmailTemplate[] = [
    { id: 't1', type: 'onboarding', label: 'Bienvenida Negocio', subject: '¡Bienvenido a ELEMEDE, {{name}}!', body: 'Hola {{name}},\n\nGracias por registrar tu negocio {{businessName}} con el plan {{planName}}.\n\nTu cuenta ya está activa.', variables: ['name', 'businessName', 'planName'], last_updated: '2024-01-01', status: 'active' },
    { id: 't2', type: 'subscription', label: 'Pago Exitoso', subject: 'Factura Disponible: {{invoiceId}}', body: 'Hola,\n\nHemos procesado correctamente el pago de {{amount}}€ para {{businessName}} correspondiente a {{month}}.\n\nPuedes descargar tu factura en el panel.', variables: ['businessName', 'amount', 'invoiceId', 'month'], last_updated: '2024-01-01', status: 'active' },
    { id: 't3', type: 'ads', label: 'Campaña Activada', subject: 'Tu campaña {{campaignTitle}} está en marcha', body: 'Buenas noticias,\n\nTu campaña publicitaria ha sido aprobada y ya está visible para miles de usuarios.', variables: ['campaignTitle'], last_updated: '2024-02-01', status: 'active' },
    { id: 't4', type: 'auth_activation', label: 'Activación Cuenta', subject: 'Activa tu cuenta en ELEMEDE', body: 'Hola {{name}},\n\nHaz clic aquí para verificar tu email.', variables: ['name'], last_updated: '2024-01-01', status: 'active' },
    { id: 't5', type: 'sub_management', label: 'Gestión Suscripción', subject: 'Actualización de tu Plan', body: 'Hola,\n\nTu plan ha sido actualizado a {{planName}}.', variables: ['planName'], last_updated: '2024-01-01', status: 'active' },
    // Add placeholders for the other 20+ templates mentioned in prompt
];

export const MOCK_LEADS: Lead[] = [
    { id: 'l1', eventType: 'boda', date: '2024-09-15', guests: 150, budget: '1500€', description: 'Mesa dulce completa con temática floral y tarta nupcial de 3 pisos.', location: 'Finca El Olivar, Madrid', clientName: 'Sofía Martín', clientContact: '600123456', createdAt: '2024-03-20' },
    { id: 'l2', eventType: 'cumpleanos', date: '2024-05-20', guests: 30, budget: '200€', description: 'Tarta de Peppa Pig para niña de 3 años. Sin gluten imprescindible.', location: 'Madrid Centro', clientName: 'Pedro Ruiz', clientContact: '611223344', createdAt: '2024-03-22' },
    { id: 'l3', eventType: 'corporativo', date: '2024-06-10', guests: 500, budget: '3000€', description: 'Desayuno corporativo para congreso. 500 piezas de bollería variada y café.', location: 'IFEMA, Madrid', clientName: 'TechCorp SA', clientContact: 'admin@techcorp.com', createdAt: '2024-03-25' }
];
