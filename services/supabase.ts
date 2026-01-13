
import { createClient } from '@supabase/supabase-js';
import { Business, UserAccount, Invoice, Banner, DiscountCode, ForumQuestion, SupportTicket, Lead, PushCampaign } from '../types';
import { MOCK_BUSINESSES, MOCK_USERS, MOCK_INVOICES, MOCK_BANNERS, MOCK_DISCOUNT_CODES, MOCK_FORUM, MOCK_LEADS } from '../constants';

// --- CONFIGURATION ---
const USE_REAL_DB = false; // Set to TRUE when real Supabase keys are provided
const SIMULATE_LATENCY = 400; // ms (Faster for better UX)
const DB_STORAGE_KEY = 'elemede_production_db_v1';

// --- SUPABASE CLIENT ---
const getEnvVar = (key: string): string => {
  const meta = import.meta as any;
  return (meta.env && meta.env[key]) || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

export const supabase = (supabaseUrl && supabaseAnonKey && USE_REAL_DB) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- PERSISTENT DATABASE SIMULATION ---
// Load from storage or initialize with constants
const loadDatabase = () => {
    try {
        const stored = localStorage.getItem(DB_STORAGE_KEY);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (e) {
        console.error("Error loading DB from storage", e);
    }
    
    // Initial Hydration
    return {
        businesses: [...MOCK_BUSINESSES],
        users: [...MOCK_USERS],
        invoices: [...MOCK_INVOICES],
        banners: [...MOCK_BANNERS],
        coupons: [...MOCK_DISCOUNT_CODES],
        forum: [...MOCK_FORUM],
        leads: [...MOCK_LEADS],
        tickets: [] as SupportTicket[],
        campaigns: [] as PushCampaign[]
    };
};

let db = loadDatabase();

// Save to storage helper
const persistDb = () => {
    try {
        localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db));
    } catch (e) {
        console.error("Error saving DB to storage", e);
    }
};

// --- HELPER: SIMULATED DELAY ---
const delay = () => new Promise(resolve => setTimeout(resolve, SIMULATE_LATENCY));

// --- DATA SERVICE API (PHASE 1 & 3) ---
export const dataService = {
    
    // INITIAL LOAD
    fetchAll: async () => {
        await delay();
        if (supabase) {
            // Real implementation would go here
            return db; 
        }
        return db;
    },

    // USERS
    getUsers: async () => {
        await delay();
        return db.users;
    },
    
    updateUser: async (user: UserAccount) => {
        await delay();
        db.users = db.users.map((u: UserAccount) => u.id === user.id ? user : u);
        persistDb();
        return user;
    },

    createUser: async (user: UserAccount) => {
        await delay();
        db.users.push(user);
        persistDb();
        return user;
    },

    // BUSINESSES
    getBusinesses: async () => {
        await delay();
        return db.businesses;
    },

    updateBusiness: async (id: string, updates: Partial<Business>) => {
        await delay();
        db.businesses = db.businesses.map((b: Business) => b.id === id ? { ...b, ...updates } : b);
        persistDb();
        return db.businesses.find((b: Business) => b.id === id);
    },

    createBusiness: async (business: Business) => {
        await delay();
        db.businesses.push(business);
        persistDb();
        return business;
    },

    // INVOICES
    getInvoices: async () => {
        await delay();
        return db.invoices;
    },

    createInvoice: async (invoice: Invoice) => {
        await delay();
        db.invoices.unshift(invoice);
        persistDb();
        return invoice;
    },

    // MARKETING & COUPONS
    getBanners: async () => {
        await delay();
        return db.banners;
    },

    updateBanners: async (banners: Banner[]) => {
        await delay();
        db.banners = banners;
        persistDb();
        return banners;
    },

    getCoupons: async () => {
        await delay();
        return db.coupons;
    },

    // SECURITY / AUTH (PHASE 3)
    authenticate: async (email: string, passwordHash: string) => {
        await delay();
        // Secure comparison against persistent DB
        const user = db.users.find((u: UserAccount) => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password_hash === passwordHash
        );
        
        if (user) {
            user.last_login = new Date().toISOString();
            persistDb(); // Save last login time
            return user;
        }
        return null;
    }
};

export const uploadBusinessImage = async (file: File, path: string) => {
    // In Phase 1 we use Blob URLs. Real Storage would go here.
    return URL.createObjectURL(file);
};
