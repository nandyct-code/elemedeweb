
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
  PRIVACY_POLICY: `POLÍTICA DE PRIVACIDAD
1. IDENTIFICACIÓN DEL RESPONSABLE DEL TRATAMIENTO
Titular: ELEMEDE (Lemesedelce)
Denominación comercial: ELEMEDE
Actividad: Plataforma digital de suscripción para empresas orientada a la visibilidad, promoción y conexión entre negocios y usuarios finales.
Correo electrónico de contacto: info@elemede.com
Ámbito territorial: España y Unión Europea

ELEMEDE actúa como responsable del tratamiento de los datos personales recabados a través del sitio web y de sus servicios asociados, conforme al Reglamento (UE) 2016/679 (RGPD) y a la Ley Orgánica 3/2018 (LOPDGDD).

2. MARCO NORMATIVO APLICABLE
El tratamiento de datos personales se rige por:

Reglamento (UE) 2016/679, General de Protección de Datos (RGPD)

Ley Orgánica 3/2018, de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)

Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE)

3. DATOS PERSONALES TRATADOS
ELEMEDE podrá tratar las siguientes categorías de datos:

3.1. Datos identificativos
Nombre y apellidos

Nombre comercial o razón social

Dirección de correo electrónico

Teléfono de contacto

3.2. Datos profesionales y empresariales
Actividad económica

Sector profesional

Ubicación del negocio

Información pública facilitada voluntariamente por la empresa usuaria

3.3. Datos de suscripción y facturación
Plan contratado

Historial de pagos

Estado de la suscripción

3.4. Datos de pago
Los datos bancarios o de tarjeta no son tratados ni almacenados por ELEMEDE.
Los pagos se gestionan íntegramente a través de Stripe, como proveedor externo de servicios de pago conforme a la normativa PSD2.

3.5. Datos técnicos
Dirección IP

Identificadores de dispositivo

Datos de navegación

Logs de acceso y seguridad

4. FINALIDAD DEL TRATAMIENTO
Los datos personales se tratan con las siguientes finalidades legítimas y determinadas:

Gestión del alta, acceso y uso de la plataforma ELEMEDE.

Prestación de los servicios de visibilidad, suscripción y posicionamiento empresarial.

Gestión administrativa, contable y fiscal de las suscripciones.

Atención de solicitudes, consultas o incidencias.

Envío de comunicaciones operativas relacionadas con el servicio.

Cumplimiento de obligaciones legales aplicables.

Prevención del fraude, usos indebidos y accesos no autorizados.

En ningún caso los datos serán tratados para finalidades incompatibles ni ajenas al objeto de la plataforma.

5. BASE JURÍDICA DEL TRATAMIENTO
El tratamiento de datos se ampara en las siguientes bases legales, según el caso:

Ejecución de un contrato (art. 6.1.b RGPD): prestación de servicios y gestión de la suscripción.

Consentimiento expreso (art. 6.1.a RGPD): formularios de contacto y comunicaciones no obligatorias.

Cumplimiento de obligaciones legales (art. 6.1.c RGPD): fiscales, contables y administrativas.

Interés legítimo (art. 6.1.f RGPD): seguridad de la plataforma, prevención de abusos y mejora del servicio.

6. CONSERVACIÓN DE LOS DATOS
Los datos personales se conservarán conforme a los siguientes criterios:

Durante la vigencia de la relación contractual.

Mientras existan responsabilidades legales derivadas del servicio.

Durante los plazos exigidos por la normativa fiscal y mercantil.

Una vez finalizados dichos plazos, los datos serán bloqueados y posteriormente eliminados de forma segura.

7. CESIÓN DE DATOS A TERCEROS
ELEMEDE no vende ni cede datos personales a terceros con fines comerciales.

No obstante, los datos podrán ser comunicados a:

Stripe: gestión de pagos y prevención del fraude.

Proveedores tecnológicos: hosting, mantenimiento, infraestructura y soporte técnico.

Servicios de analítica y seguridad necesarios para el funcionamiento de la plataforma.

Autoridades públicas cuando exista obligación legal.

Todos los proveedores actúan como encargados del tratamiento, bajo contratos que garantizan el cumplimiento del RGPD.

8. TRANSFERENCIAS INTERNACIONALES DE DATOS
En caso de utilizar proveedores ubicados fuera del Espacio Económico Europeo, ELEMEDE garantizará que las transferencias internacionales se realicen bajo:

Decisiones de adecuación de la Comisión Europea, o

Cláusulas contractuales tipo aprobadas por la Comisión Europea.

9. DERECHOS DE LOS USUARIOS
El interesado puede ejercer en cualquier momento los siguientes derechos:

Acceso

Rectificación

Supresión

Oposición

Limitación del tratamiento

Portabilidad de los datos

Retirada del consentimiento

El ejercicio de derechos se realizará mediante solicitud escrita al correo electrónico indicado, adjuntando documento que acredite la identidad.

Asimismo, el usuario podrá presentar reclamación ante la Agencia Española de Protección de Datos (AEPD) si considera vulnerados sus derechos.

10. MEDIDAS DE SEGURIDAD
ELEMEDE aplica medidas técnicas y organizativas adecuadas para garantizar la confidencialidad, integridad y disponibilidad de los datos personales, incluyendo:

Control de accesos

Cifrado de comunicaciones

Sistemas de detección de intrusiones

Protocolos internos de seguridad y confidencialidad

11. RESPONSABILIDAD DEL USUARIO
El usuario garantiza que los datos facilitados son veraces, actualizados y de su titularidad o que dispone de legitimación suficiente para su cesión.

ELEMEDE queda exonerada de cualquier responsabilidad derivada del uso indebido, fraudulento o ilícito de datos personales por parte del usuario.

12. MODIFICACIONES DE LA POLÍTICA DE PRIVACIDAD
ELEMEDE se reserva el derecho a modificar la presente Política de Privacidad para adaptarla a cambios normativos, técnicos o del servicio.
Las modificaciones serán publicadas de forma visible en la plataforma.

Última actualización: conforme a normativa vigente en España y Unión Europea.`,
  TERMS_OF_USE: `CONDICIONES GENERALES DE USO
ELEMEDE (Lemesedelce)

1. IDENTIFICACIÓN DEL PRESTADOR
Titular: ELEMEDE (Lemesedelce)
Denominación comercial: ELEMEDE
Actividad: Plataforma digital de suscripción para empresas, destinada a la visibilidad, promoción y presencia online de negocios, sin intervención directa en relaciones comerciales.
Correo electrónico de contacto: info@elemede.com

El acceso y uso de la plataforma atribuye la condición de usuario, implicando la aceptación plena, expresa y sin reservas de las presentes Condiciones.

2. NATURALEZA DEL SERVICIO
ELEMEDE es exclusivamente una plataforma tecnológica de intermediación pasiva y visibilidad, que:

No vende productos ni presta servicios finales.

No garantiza resultados comerciales, económicos ni de captación.

No actúa como agencia, representante, asesor ni comisionista.

No interviene en negociaciones, contratos o acuerdos entre usuarios y terceros.

La información publicada tiene carácter meramente informativo y promocional, sin valor contractual alguno.

3. ACCESO Y USO DE LA PLATAFORMA
El usuario se compromete a:

Utilizar la plataforma conforme a la ley, la moral y el orden público.

No introducir contenidos ilícitos, falsos, engañosos o infractores.

No utilizar ELEMEDE con fines fraudulentos, abusivos o competitivos desleales.

No vulnerar derechos de terceros ni de ELEMEDE.

ELEMEDE no tiene obligación de verificar la veracidad, exactitud o legalidad de los contenidos publicados por los usuarios.

4. CONTENIDOS Y RESPONSABILIDAD DEL USUARIO
El usuario es único y exclusivo responsable de:

Los contenidos que publica o facilita.

El uso que haga de la información obtenida en la plataforma.

Cualquier daño, perjuicio, reclamación o sanción derivada de su conducta.

ELEMEDE queda expresamente exonerada de toda responsabilidad por:

Contenido generado por usuarios o empresas.

Información inexacta, desactualizada o incompleta.

Expectativas comerciales no cumplidas.

Daños económicos, reputacionales o indirectos.

5. EXCLUSIÓN TOTAL DE GARANTÍAS
ELEMEDE presta el servicio “tal cual”, sin garantías de ningún tipo, expresas ni implícitas.

En particular, ELEMEDE no garantiza:

Disponibilidad continua o ininterrumpida del servicio.

Resultados, conversiones, ventas o incremento de ingresos.

Compatibilidad con todos los dispositivos o navegadores.

Ausencia de errores técnicos, caídas o interrupciones.

6. LIMITACIÓN MÁXIMA DE RESPONSABILIDAD
En la máxima medida permitida por la ley:

ELEMEDE no responderá por daños directos, indirectos, lucro cesante, pérdida de datos, pérdida de negocio o cualquier perjuicio derivado del uso o imposibilidad de uso de la plataforma.

La responsabilidad total de ELEMEDE, en su caso, quedará limitada estrictamente al importe efectivamente abonado por el usuario en los últimos 30 días, excluyéndose cualquier otro concepto.

7. SUSPENSIÓN, CANCELACIÓN Y BLOQUEO
ELEMEDE se reserva el derecho unilateral, sin previo aviso y sin indemnización alguna, a:

Suspender o cancelar cuentas.

Eliminar contenidos.

Bloquear accesos.

Especialmente en casos de uso indebido, incumplimiento contractual, sospecha de fraude o riesgo legal.

8. PROPIEDAD INTELECTUAL
Todos los elementos de la plataforma (marca, diseño, software, textos, estructura) son titularidad de ELEMEDE o de terceros licenciantes.

Queda prohibida cualquier reproducción, explotación o uso no autorizado.

El usuario concede a ELEMEDE una licencia gratuita, mundial y no exclusiva para usar los contenidos aportados mientras permanezcan publicados.

9. INDEMNIZACIÓN A FAVOR DE ELEMEDE
El usuario se compromete a indemnizar, defender y mantener indemne a ELEMEDE frente a:

Reclamaciones de terceros.

Sanciones administrativas.

Daños, costes y gastos (incluidos honorarios legales).

Derivados directa o indirectamente del uso de la plataforma o del incumplimiento de estas Condiciones.

10. ENLACES A TERCEROS
ELEMEDE puede contener enlaces a sitios de terceros, sobre los que no ejerce control alguno.

ELEMEDE no asume ninguna responsabilidad por contenidos, servicios o políticas externas.

11. MODIFICACIÓN UNILATERAL
ELEMEDE se reserva el derecho a modificar en cualquier momento las presentes Condiciones.
El uso continuado de la plataforma implica la aceptación automática de las modificaciones.

12. LEGISLACIÓN APLICABLE Y FUERO
Las presentes Condiciones se rigen por la legislación española.

Para cualquier controversia, las partes se someten expresamente a los Juzgados y Tribunales de España, con renuncia a cualquier otro fuero que pudiera corresponderles.

Versión vigente conforme a la normativa española y europea aplicable.`,
  SUBSCRIPTION_CONTRACT: `CONTRATO DE SUSCRIPCIÓN DE SERVICIOS
ELEMEDE (Lemesedelce)

1. PARTES
De una parte, ELEMEDE (Lemesedelce), plataforma digital de suscripción para empresas, en adelante ELEMEDE.

Y de otra, la persona física o jurídica que contrata uno de los planes disponibles, en adelante EL CLIENTE.

La contratación implica la aceptación íntegra, expresa e irrevocable del presente contrato.

2. OBJETO DEL CONTRATO
El presente contrato tiene por objeto regular el acceso del CLIENTE a los servicios digitales de visibilidad y presencia online ofrecidos por ELEMEDE, mediante un sistema de suscripción periódica.

ELEMEDE no garantiza resultados comerciales, económicos, publicitarios ni de captación, limitándose exclusivamente a poner a disposición del CLIENTE una infraestructura tecnológica.

3. NATURALEZA DEL SERVICIO
ELEMEDE actúa única y exclusivamente como:

Plataforma tecnológica.

Canal de publicación y exposición digital.

Servicio automatizado de suscripción.

ELEMEDE NO:

Intermedia en ventas.

Representa al CLIENTE.

Asegura tráfico, conversiones o ingresos.

Asume obligaciones de resultado.

El CLIENTE reconoce expresamente que contrata un servicio de medios, no de resultados.

4. PLANES, DURACIÓN Y RENOVACIÓN
4.1. Los planes pueden ser mensuales o anuales, según la opción seleccionada.

4.2. La suscripción se renueva automáticamente por periodos idénticos salvo cancelación expresa previa al vencimiento.

4.3. La falta de uso del servicio no exime del pago ni genera derecho a reembolso.

5. PRECIO Y FORMA DE PAGO
5.1. Los precios son los publicados en la plataforma en el momento de la contratación.

5.2. El pago se realiza de forma anticipada mediante pasarela externa (Stripe u otras).

5.3. ELEMEDE no almacena ni trata datos bancarios.

5.4. Los impuestos aplicables se añadirán conforme a la normativa vigente.

6. POLÍTICA DE CANCELACIÓN Y NO REEMBOLSO
6.1. El CLIENTE puede cancelar la renovación futura, pero no tendrá derecho a devolución alguna de importes ya abonados.

6.2. No se admiten reembolsos por:

Falta de resultados.

Cambios de estrategia del CLIENTE.

Errores imputables al propio CLIENTE.

Interrupciones técnicas ajenas a ELEMEDE.

7. DERECHO DE DESISTIMIENTO
De conformidad con la Ley General para la Defensa de los Consumidores y Usuarios:

Queda excluido el derecho de desistimiento al tratarse de servicios digitales ejecutados desde el momento de la contratación.

En relaciones B2B, el desistimiento no resulta aplicable.

El CLIENTE renuncia expresamente a dicho derecho al contratar.

8. OBLIGACIONES DEL CLIENTE
El CLIENTE se compromete a:

Facilitar información veraz y lícita.

No usar la plataforma con fines ilegales o dañinos.

Mantener indemne a ELEMEDE frente a reclamaciones de terceros.

Cumplir las Condiciones de Uso vigentes.

9. SUSPENSIÓN Y RESOLUCIÓN
ELEMEDE podrá suspender o resolver el contrato de forma inmediata y sin indemnización en caso de:

Incumplimiento contractual.

Uso indebido o fraudulento.

Riesgo legal o reputacional.

La resolución no dará derecho a reembolso alguno.

10. LIMITACIÓN EXTREMA DE RESPONSABILIDAD
En la máxima medida permitida por la ley:

ELEMEDE no responderá por daños directos, indirectos, lucro cesante o pérdida de oportunidades.

La responsabilidad máxima de ELEMEDE quedará limitada al importe efectivamente pagado por el CLIENTE en el último período de facturación, y solo en caso de dolo probado.

11. FUERZA MAYOR Y TERCEROS
ELEMEDE no será responsable por fallos derivados de:

Proveedores externos.

Caídas de red, servidores o pasarelas de pago.

Fuerza mayor o causas fuera de su control.

12. INDEMNIZACIÓN A FAVOR DE ELEMEDE
El CLIENTE se obliga a indemnizar y mantener indemne a ELEMEDE frente a:

Reclamaciones de terceros.

Sanciones administrativas.

Costes legales y daños derivados de su conducta.

13. MODIFICACIÓN DEL CONTRATO
ELEMEDE podrá modificar unilateralmente el presente contrato.
El uso continuado del servicio implicará la aceptación automática de las modificaciones.

14. LEGISLACIÓN Y JURISDICCIÓN
El contrato se rige por la legislación española.

Las partes se someten expresamente a los Juzgados y Tribunales de España, renunciando a cualquier otro fuero.

15. INTEGRIDAD CONTRACTUAL
El presente contrato constituye el acuerdo íntegro entre las partes, prevaleciendo sobre cualquier comunicación previa, verbal o escrita.

Contrato plenamente válido conforme a la normativa española y europea vigente.`,
  LEGAL_NOTICE: `AVISO LEGAL
ELEMEDE (Lemesedelce)

1. DATOS IDENTIFICATIVOS
En cumplimiento de lo dispuesto en el artículo 10 de la Ley 34/2002, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa:

Titular: ELEMEDE (Lemesedelce)

Denominación comercial: ELEMEDE

Actividad: Plataforma digital de suscripción orientada a la visibilidad, promoción y presencia online de empresas, sin intervención en relaciones comerciales entre terceros.

Correo electrónico de contacto: info@elemede.com

Ámbito de actuación: España y Unión Europea

2. OBJETO DEL SITIO WEB
El presente sitio web tiene por objeto facilitar información sobre los servicios ofrecidos por ELEMEDE y permitir el acceso a una plataforma digital de suscripción para empresas.

ELEMEDE actúa exclusivamente como prestador de servicios tecnológicos, sin asumir funciones de intermediación contractual, representación, asesoramiento ni garantía de resultados.

3. CONDICIÓN DE USUARIO
El acceso, navegación y uso del sitio web atribuye la condición de usuario, implicando la aceptación plena y sin reservas del presente Aviso Legal, así como de las Condiciones de Uso y demás textos legales aplicables.

4. USO DEL SITIO WEB
El usuario se compromete a realizar un uso adecuado, lícito y conforme a la normativa vigente, absteniéndose de:

Realizar actividades ilícitas o contrarias al orden público.

Introducir contenidos falsos, engañosos o lesivos para terceros.

Dañar, sobrecargar o inutilizar la plataforma.

ELEMEDE se reserva el derecho a denegar o retirar el acceso al sitio web sin necesidad de preaviso.

5. RESPONSABILIDAD
ELEMEDE no garantiza:

La disponibilidad continua del sitio web.

La ausencia de errores técnicos o interrupciones.

La exactitud, integridad o actualización permanente de los contenidos.

ELEMEDE no será responsable de:

Daños derivados del uso del sitio web.

Decisiones adoptadas por el usuario basadas en la información publicada.

Contenidos introducidos por terceros o usuarios.

Virus u otros elementos dañinos ajenos a su control.

El uso del sitio web se realiza bajo la exclusiva responsabilidad del usuario.

6. ENLACES A TERCEROS
El sitio web puede contener enlaces a páginas de terceros sobre los que ELEMEDE no ejerce control alguno.

ELEMEDE no asume responsabilidad por contenidos, servicios, políticas o prácticas externas.

7. PROPIEDAD INTELECTUAL E INDUSTRIAL
Todos los contenidos del sitio web (textos, diseño, software, logotipos, marcas, estructura) son titularidad de ELEMEDE o de terceros licenciantes, estando protegidos por la normativa de propiedad intelectual e industrial.

Queda prohibida su reproducción, distribución o explotación sin autorización expresa.

8. PROTECCIÓN DE DATOS Y COOKIES
El tratamiento de datos personales se rige por la Política de Privacidad publicada en el sitio web.
El uso de cookies se regula en la Política de Cookies correspondiente.

9. MODIFICACIONES
ELEMEDE se reserva el derecho a modificar el presente Aviso Legal en cualquier momento para adaptarlo a cambios normativos o técnicos.
Las modificaciones serán publicadas y resultarán aplicables desde su entrada en vigor.

10. LEGISLACIÓN APLICABLE Y JURISDICCIÓN
El presente Aviso Legal se rige por la legislación española.

Para cualquier controversia, las partes se someten expresamente a los Juzgados y Tribunales de España, con renuncia a cualquier otro fuero que pudiera corresponderles.

Texto vigente conforme a la normativa española y europea aplicable.`,
  COOKIES_POLICY: `POLÍTICA DE COOKIES
ELEMEDE (Lemesedelce)

1. ¿QUÉ SON LAS COOKIES?
Las cookies son pequeños archivos de texto que se descargan en el dispositivo del usuario al acceder a determinados sitios web. Permiten, entre otras funciones, almacenar y recuperar información sobre la navegación, mejorar la experiencia del usuario y garantizar el correcto funcionamiento de la plataforma.

2. USO DE COOKIES EN ELEMEDE
El sitio web de ELEMEDE utiliza cookies propias y de terceros con finalidades estrictamente técnicas, funcionales, analíticas y de seguridad.

En ningún caso se utilizan cookies para realizar perfiles comerciales invasivos ni para vender datos a terceros.

3. TIPOS DE COOKIES UTILIZADAS
3.1. Cookies técnicas (necesarias)
Permiten la navegación y el uso de las funcionalidades básicas del sitio web, como:

Gestión de sesiones

Acceso a áreas seguras

Prevención de fraude

Seguridad del sistema

Estas cookies son imprescindibles y no requieren consentimiento del usuario.

3.2. Cookies de personalización
Permiten recordar preferencias del usuario, como idioma o configuración regional, para mejorar la experiencia de navegación.

3.3. Cookies analíticas
Permiten medir y analizar el comportamiento de los usuarios en la web con fines estadísticos y de mejora del servicio.

La información recogida es agregada y anonimizada, y no permite identificar al usuario.

3.4. Cookies de terceros
ELEMEDE puede utilizar servicios de terceros que, por cuenta de ELEMEDE, recopilan información con fines estadísticos, técnicos o de seguridad, tales como:

Proveedores de analítica web

Proveedores de hosting e infraestructura

Servicios de protección frente a ataques o accesos no autorizados

Estos terceros actúan como encargados del tratamiento, conforme al RGPD.

4. BASE LEGAL DEL USO DE COOKIES
Cookies técnicas: interés legítimo y necesidad técnica (art. 6.1.f RGPD y art. 22.2 LSSI-CE).

Cookies no necesarias: consentimiento del usuario, otorgado mediante el banner o panel de configuración.

5. GESTIÓN Y CONFIGURACIÓN DE COOKIES
El usuario puede:

Aceptar todas las cookies.

Rechazar las cookies no necesarias.

Configurar sus preferencias en cualquier momento.

Asimismo, puede eliminar o bloquear las cookies desde la configuración de su navegador. La desactivación de cookies técnicas puede afectar al funcionamiento del sitio web.

6. DURACIÓN DE LAS COOKIES
Las cookies utilizadas pueden ser:

De sesión: se eliminan al cerrar el navegador.

Persistentes: permanecen durante un periodo determinado, que en ningún caso excede el necesario para su finalidad.

7. RESPONSABILIDAD DEL USUARIO
El usuario es responsable de configurar su navegador y de aceptar o rechazar el uso de cookies conforme a sus preferencias.

ELEMEDE no será responsable de fallos derivados de la desactivación de cookies necesarias para el funcionamiento del sitio web.

8. MODIFICACIONES DE LA POLÍTICA DE COOKIES
ELEMEDE se reserva el derecho a modificar la presente Política de Cookies para adaptarla a cambios normativos o técnicos.

Las modificaciones serán publicadas en el sitio web y resultarán aplicables desde su publicación.

9. INFORMACIÓN ADICIONAL
Para más información sobre el tratamiento de datos personales, el usuario puede consultar la Política de Privacidad disponible en el sitio web.

Política vigente conforme a la normativa española y europea aplicable.`
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