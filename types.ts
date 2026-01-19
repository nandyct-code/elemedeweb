
export enum SectorType {
  CREATIVE_PASTRY = 'Repostería Creativa',
  CHURRERIA = 'Churrería Tradicional',
  ICE_CREAM = 'Heladería Artesanal',
  CHOCOLATE = 'Chocolatería Fina',
  TRADITIONAL_SWEETS = 'Dulces Regionales',
}

export interface SweetGenerationResult {
  text: string;
  imageUrl?: string;
}

export interface PlaceResult {
  title: string;
  uri: string;
  snippet?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Rating {
  id: string;
  stars: number;
  comment: string;
  date: string;
}

export interface AddressDetails {
  calle: string;
  numero?: string;
  cp: string;
  telefono?: string;
  ciudad?: string;
  provincia?: string;
  lat?: number;
  lng?: number;
}

export interface SectorDetails {
  history: string;
  popularItems: string[];
  tips: string;
  imagePrompt?: string;
}

// --- ADMIN MODULE TYPES ---

export type SectorKey = 'mesas_dulces' | 'pasteleria' | 'confiterias' | 'churrerias_creperias' | 'tiendas_chucherias' | 'heladerias' | 'reposteria_creativa';

export interface SectorInfo {
  id: SectorKey;
  label: string;
  description: string;
  icon: string;
  color: string;
  tags?: string[];
  details?: SectorDetails;
}

// NUEVOS ROLES ESPECÍFICOS
export type UserRole = 
  | 'admin_root'      // Control Total
  | 'admin_marketing' // Banners, Métricas
  | 'admin_finanzas'  // Stripe, Facturas, Verifactu
  | 'admin_soporte'   // Usuarios, Edición
  | 'user' 
  | 'business_owner' 
  | 'guest'
  // Legacy roles for compatibility mapping if needed
  | 'admin_maestro' | 'marketing_master' | 'contabilidad_master';

export type UserStatus = 'active' | 'suspended' | 'banned' | 'pending';

export interface UserAccount {
  id: string;
  email: string;
  password_hash: string; 
  name: string;
  role: UserRole;
  is_first_login?: boolean;
  status?: UserStatus;
  strikes?: number;
  date_registered?: string;
  avatar?: string;
  last_login?: string;
  provider?: string;
  linkedBusinessId?: string;
  favorites?: string[];
  requires_2fa?: boolean;
  // User Gamification
  reviewsCount?: number;
  forumActivity?: number;
  isEliteReviewer?: boolean; // Manual flag for users who review a lot
}

export type InvoiceStatus = 'paid' | 'unpaid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  business_id: string;
  // Snapshot of Issuer Details at moment of creation
  business_name: string; 
  business_nif: string;  
  business_address?: string; 
  business_email?: string;
  business_phone?: string;
  business_form_juridica?: string;
  // Client Details
  client_name: string;
  client_nif: string;
  date: string;
  due_date: string;
  base_amount: number;
  iva_rate: number;
  iva_amount: number;
  irpf_rate: number;
  irpf_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  concept: string;
  quarter: number;
  stripe_fee?: number; 
  currencySymbol?: string;
  audit_ref?: string; // Reference to AuditLog ID
  verifactu_hash?: string; // Huella digital anti-fraude
}

export interface Contract {
  id: string;
  business_id: string;
  business_name: string;
  sectorId?: string;
  file_url: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'pending_renewal' | 'terminated';
  audit_notes: string;
  version: number;
}

export type SubscriptionPackType = string;

export interface SubscriptionPack {
  id: SubscriptionPackType;
  label: string;
  monthlyPrice: number;
  annualPriceYear1: number;
  extraLocationPrice: number; // New price per sede specific to plan
  benefits: string[];
  colorClass: string;
  badge: string;
  visibilityRadius: number; // In meters
  sortingScore: number; // For ranking
  limits: {
    images: number;
    videos: number;
    tags: number;
  };
}

export type AdRequestType = '1_day' | '7_days' | '14_days';

export interface AdRequest {
  id: string;
  type: AdRequestType;
  requestDate: string;
  status: 'pending' | 'active' | 'completed' | 'rejected';
  price: number;
  durationDays: number;
}

export interface StripeConnection {
  status: 'connected' | 'pending' | 'error' | 'disconnected';
  accountId?: string;
  customerId?: string; // Stripe Customer ID for billing
  subscriptionId?: string; // Active Subscription ID
  last4?: string; // Card Last 4
  cardBrand?: string; // Visa, Mastercard
  nextBillingDate?: string;
  lastSync?: string;
  webhookStatus?: 'active' | 'inactive';
}

export type CouponTarget = 'plan_subscription' | 'extra_location' | 'ad_banner';

export interface RedeemedCoupon {
  code: string;
  date: string;
  applied_to: CouponTarget;
  savings_amount: number;
}

// --- ECONOMY & INTELLIGENCE TYPES ---

export interface CreditTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'earn' | 'spend';
  concept: string; // e.g. "Renovación anticipada", "Compra Banner"
}

export interface CommercialRecommendation {
  id: string;
  type: 'upgrade' | 'ad' | 'content' | 'pricing';
  title: string;
  description: string;
  impactScore: number; // 1-100
  actionLabel: string;
  isDismissed?: boolean;
}

export interface BusinessStats {
  views: number;
  clicks: number;
  ctr: number; // 0.0 to 1.0
  saturationIndex: number; // 0.0 to 1.0 (Calculated by AI)
}

export type LiveStatus = 'closed' | 'open' | 'fresh_batch' | 'last_units' | 'busy';

export interface BusinessStory {
  id: string;
  timestamp: string;
  expiresAt: string;
  type: 'fresh_batch' | 'promo';
  imageUrl?: string;
  mediaType?: 'image' | 'video'; // NEW FIELD FOR SWEET REELS
  text: string;
}

export interface PushCampaign {
  id: string;
  businessId: string;
  businessName: string;
  message: string;
  sentAt: string;
  expiresAt: string;
  reach: number;
  cost: number;
}

export interface OpeningHours {
  open: string; // "09:00"
  close: string; // "20:00"
  closed: boolean;
}

export interface Lead {
  id: string;
  eventType: 'boda' | 'comunion' | 'cumpleanos' | 'corporativo' | 'otro';
  date: string;
  guests: number;
  budget?: string;
  description: string;
  location: string;
  clientName: string;
  clientContact: string; // Hidden until unlocked
  createdAt: string;
  targetBusinessId?: string; // NEW: If lead is direct request to a business
}

// --- NEW INTELLIGENCE TYPES ---
export interface DemandZone {
  id: string;
  name: string;
  demandScore: number; // 0-100 (Searches)
  supplyCount: number; // Number of businesses
  opportunityLevel: 'low' | 'medium' | 'high' | 'critical';
  topSearchTerms: string[];
}

export interface Business {
  id: string;
  name: string;
  sectorId: SectorKey | string;
  packId: SubscriptionPackType;
  billingCycle?: 'monthly' | 'annual';
  nif: string;
  phone: string;
  cp: string;
  address: string;
  city: string;
  province: string;
  lat: number;
  lng: number;
  status: 'active' | 'suspended';
  createdAt: string; 
  stripeConnection?: StripeConnection;
  adRequests?: AdRequest[]; 
  mainImage?: string;
  images?: string[];
  pendingImages?: string[]; // MODERATION QUEUE
  description?: string;
  tags?: string[];
  ratings?: Rating[];
  direccionesAdicionales?: AddressDetails[];
  discountApplied?: boolean; // Deprecated, use redeemedCoupons
  redeemedCoupons?: RedeemedCoupon[];
  scheduledCancellationDate?: string;
  reliabilityScore?: number; // Calculated automatically 0-100 (AI Score)
  stats?: BusinessStats; // Real-time metrics for AI
  credits?: number;
  creditHistory?: CreditTransaction[];
  aiRecommendations?: CommercialRecommendation[];
  liveStatus?: LiveStatus;
  allowsFastPickup?: boolean; 
  failedImageAttempts?: number; 
  
  // NEW FEATURES
  stories?: BusinessStory[]; 
  totalAdSpend?: number; 
  aiCredits?: number; // Marketing AI Credits
  openingHours?: Record<string, OpeningHours>; 
  unlockedLeads?: string[]; // IDs of leads unlocked by this business
  battleWins?: number; // Gamification wins
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  description: string;
  department: 'marketing' | 'admin' | 'tecnico' | 'contabilidad';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  created_at: string;
  updated_at?: string;
}

export interface AdvertisingSupplement {
  id: string;
  label: string;
  type: AdRequestType;
  price: number;
  durationDays: number;
  description: string;
  isActive: boolean;
}

export interface SaaSMetrics {
  id?: string;
  date?: string;
  mrr: number;
  active_subscriptions: number;
  churn_rate: number;
  arpu: number;
  ltv?: number;
  new_signups?: number;
  cancellations?: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string; // Business Owner or Admin
  action_type: 'ISSUER_UPDATE' | 'ADD_SEDE' | 'ADD_AD' | 'PLAN_CHANGE' | 'INVOICE_GEN' | 'OTHER' | 'DUNNING_DOWNGRADE' | 'RETRY_PAYMENT';
  details: string;
  previous_value?: string;
  new_value?: string;
  related_invoice_id?: string;
  ip?: string;
}

// --- BANNER STRATEGY TYPES ---

export type BannerType = 'sector_campaign' | 'business_campaign';

export type BannerSubtype = 
  | 'seasonality' 
  | 'trend'       
  | 'zone_active' 
  | 'educational' 
  | 'featured'    
  | 'offer'       
  | 'availability'
  | 'exclusive'   
  | 'reputation'; 

export type BannerFormat = 'horizontal' | 'card_vertical' | 'sticky_bottom' | 'inline' | 'mini_badge';

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  active?: boolean;
  status?: 'active' | 'paused' | 'scheduled';
  type?: BannerType;
  subtype?: BannerSubtype;
  format?: BannerFormat;
  position?: 'header' | 'popup' | 'sidebar' | 'footer' | 'inline_list';
  linkedBusinessId?: string;
  relatedSectorId?: string;
  start_date?: string;
  end_date: string;
  visibility_rules: {
    roles: string[];
    plans?: string[];
    devices?: string[];
  };
  views: number;
  clicks: number;
  targetingRadius?: number; // km
  ctaText?: string;
  ctaLink?: string;
  frequencyCapPerUser?: number; 
  cooldownHours?: number; 
  priorityScore?: number; 
  spawnType?: '1_day' | '7_days' | '14_days' | 'boost';
}

export interface DiscountCode {
  id?: string;
  code: string;
  discountPercentage?: number;
  value?: number;
  type?: 'porcentaje' | 'fijo';
  active?: boolean;
  status?: 'active' | 'disabled' | 'expired';
  usage_limit?: number; // Added usage_limit
  usage_count?: number;
  valid_from?: string;
  valid_to?: string;
  applicable_plans?: string[]; // Specific plan IDs (e.g. 'premium')
  applicable_targets?: CouponTarget[]; // Broad targets (plan, ad, sede)
  requires_merit?: boolean; // Only for high rated businesses
}

export interface ForumAnswer {
  id: string;
  authorName: string;
  isSubscriber: boolean;
  businessId?: string;
  content: string;
  date: string;
}

export interface ForumQuestion {
  id: string;
  sectorId: string;
  authorId?: string;
  authorName: string;
  author?: string; // legacy
  province: string;
  title: string;
  content?: string;
  text?: string; // legacy
  date: string;
  answers: ForumAnswer[];
}

export interface SocialConfig {
  instagram: string;
  facebook: string;
  twitter: string;
  tiktok: string;
  youtube?: string; // NEW
}

export type CountryCode = 'ES' | 'US' | 'GB' | 'FR' | 'DE' | 'MX';

export interface IssuerConfig {
  businessName: string;
  formJuridica: string;
  nif: string;
  address: string;
  city: string;
  email: string;
  phone: string;
  fiscalRegime?: 'sl' | 'autonomo';
  irpfRate?: number;
}

export interface StripeSystemConfig {
  publicKey: string;
  secretKey: string;
  webhookSecret: string;
  isConnected: boolean;
  feePercentage: number;
  fixedFee: number;
  mode: 'test' | 'live';
}

export interface GovernanceRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  isActive: boolean;
  lastTriggered?: string;
}

export interface AutoPilotConfig {
  dynamicPricing: boolean;
  autoSEO: boolean;
  autoModeration: boolean;
  saturationControl: boolean;
  dynamicRadius: boolean;
  maxDensityPerZone: number; // Businesses per km2
}

export interface SystemFinancialConfig {
  taxRate: number;
  extraLocationFee: number;
  globalDiscount: number;
  allowRegistrations: boolean;
  issuerDetails: IssuerConfig;
  stripe?: StripeSystemConfig;
  autoPilot?: AutoPilotConfig;
  governanceRules?: GovernanceRule[];
}

export interface SubscriptionFormData {
  nombre: string;
  apellidos: string;
  email: string;
  telefono: string;
  nif: string;
  nombreNegocio: string; 
  direccionPrincipal: {
    calle: string;
    cp: string;
    ciudad: string;
    provincia: string;
  };
  sectorId: string;
  packId: string;
  billingCycle: 'monthly' | 'annual';
  // extraLocations field replaced/supplemented by explicit sedes list
  extraLocations: number; 
  sedes: AddressDetails[];
  password?: string;
  consents: {
    privacy: boolean;
    terms: boolean;
    contract: boolean;
  };
}

export interface CountryConfig {
  code: CountryCode;
  name: string;
  flag: string;
  taxName: string;
  currencySymbol: string;
  currency: string;
  language: string;
  defaultTaxRate?: number;
  locale?: string;
}

export type EmailTemplateType = 
  | 'onboarding'
  | 'subscription'
  | 'ads'
  | 'expansion'
  | 'coupons'
  | 'activity'
  | 'security'
  | 'system'
  | 'legal'
  | 'exit'
  | 'auth_activation' 
  | 'sub_management'
  | 'ads_boost'
  | 'activity_growth'
  | 'reporting'; 

export interface EmailTemplate {
  id: string;
  type: EmailTemplateType;
  label: string;
  subject: string;
  body: string;
  variables: string[]; // e.g. {{name}}, {{plan}}
  last_updated: string;
  status: 'active' | 'inactive';
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  recipient: string;
  type: EmailTemplateType;
  subject: string;
  status: 'sent' | 'failed' | 'queued';
  trigger: string; 
}

export interface SecurityLog {
  id: string;
  ip: string;
  action: string;
  reason: string;
  status: 'blocked' | 'flagged' | 'monitored';
  timestamp: string;
}
