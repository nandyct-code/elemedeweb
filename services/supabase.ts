
import { createClient } from '@supabase/supabase-js';
import { Business, UserAccount, Invoice, Banner, DiscountCode, ForumQuestion, Lead, SupportTicket, PushCampaign } from '../types';
import { MOCK_BUSINESSES, MOCK_USERS, MOCK_INVOICES, MOCK_BANNERS, MOCK_DISCOUNT_CODES, MOCK_FORUM, MOCK_LEADS } from '../constants';

// --- CONFIGURATION ---
const getEnvVar = (key: string): string => {
  const meta = import.meta as any;
  return (meta.env && meta.env[key]) || '';
};

// USER PROVIDED CREDENTIALS
// These act as defaults if VITE_ env vars are not set in Vercel dashboard
const PROJECT_URL = 'https://fxhgffgkhpgsruotrxmj.supabase.co';
const PROJECT_KEY = 'sb_secret_JwamCllyNVXJMdRXdzH14w_X1m9_cKD';

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || PROJECT_URL;
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || PROJECT_KEY;

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase keys missing. Running in MOCK/OFFLINE mode.");
}

// Only initialize if keys are present to avoid "supabaseUrl is required" error
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- DATA SERVICE (HYBRID: REAL + MOCK FALLBACK) ---
export const dataService = {
    
    // INITIAL LOAD
    fetchAll: async () => {
        // Try Real DB
        if (supabase) {
            try {
                const [biz, users, coupons, leads] = await Promise.all([
                    supabase.from('businesses').select('*'),
                    supabase.from('profiles').select('*'),
                    supabase.from('coupons').select('*'),
                    supabase.from('leads').select('*')
                ]);

                // Check if connection actually worked (tables might not exist yet)
                if (!biz.error) {
                    return {
                        businesses: biz.data || [],
                        users: users.data || [], // Note: RLS might return empty if not admin, handled in UI
                        invoices: [], // Invoices loaded on demand usually
                        banners: [...MOCK_BANNERS], // Table pending
                        coupons: coupons.data || [],
                        forum: [...MOCK_FORUM], // Table pending
                        leads: leads.data || [],
                        tickets: [],
                        campaigns: []
                    };
                } else {
                    console.warn("Supabase Fetch Error (tables might be missing):", biz.error.message);
                }
            } catch (e) {
                console.error("Supabase connection error:", e);
            }
        }

        // Fallback to Mocks
        console.log("Serving Mock Data (Database empty or connection failed)");
        return {
            businesses: [...MOCK_BUSINESSES],
            users: [...MOCK_USERS],
            invoices: [...MOCK_INVOICES],
            banners: [...MOCK_BANNERS],
            coupons: [...MOCK_DISCOUNT_CODES],
            forum: [...MOCK_FORUM],
            leads: [...MOCK_LEADS],
            tickets: [],
            campaigns: []
        };
    },

    // --- AUTHENTICATION ---
    
    authenticate: async (email: string, passwordHash: string): Promise<UserAccount | null> => {
        // 1. Try Supabase Auth
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: passwordHash, 
            });

            if (!error && data.user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                return profile ? { ...profile, id: data.user.id, email: data.user.email!, password_hash: 'HIDDEN' } : null;
            }
        }

        // 2. Fallback Mock Auth
        const mockUser = MOCK_USERS.find(u => 
            u.email.toLowerCase() === email.toLowerCase() && 
            u.password_hash === passwordHash
        );
        
        if (mockUser) {
            return { ...mockUser, last_login: new Date().toISOString() };
        }
        return null;
    },

    createUser: async (user: UserAccount): Promise<UserAccount> => {
        if (supabase) {
            const { data, error } = await supabase.auth.signUp({
                email: user.email,
                password: user.password_hash,
                options: {
                    data: {
                        name: user.name,
                        role: user.role
                    }
                }
            });

            if (error) throw error;
            if (data.user) {
                return { ...user, id: data.user.id, password_hash: 'HIDDEN' };
            }
        }

        // Mock Creation
        return { ...user, id: `mock_user_${Date.now()}` };
    },

    updateUser: async (user: UserAccount) => {
        if (supabase) {
            await supabase.from('profiles').update({ 
                name: user.name, 
                favorites: user.favorites,
                status: user.status
            }).eq('id', user.id);
        }
        return user;
    },

    getUsers: async () => {
        if (supabase) {
            const { data } = await supabase.from('profiles').select('*');
            return data || [];
        }
        return MOCK_USERS;
    },

    // --- BUSINESS METHODS ---

    createBusiness: async (business: Business) => {
        if (supabase) {
            const { error } = await supabase.from('businesses').insert([business]);
            if (error) console.error("Error creating business in DB", error);
        }
        return business;
    },

    getBusinesses: async () => {
        if (supabase) {
            const { data } = await supabase.from('businesses').select('*');
            return data || [];
        }
        return MOCK_BUSINESSES;
    },

    updateBusiness: async (id: string, updates: Partial<Business>) => {
        if (supabase) {
            await supabase.from('businesses').update(updates).eq('id', id);
        }
    },

    // --- OTHER ENTITIES ---

    createInvoice: async (invoice: Invoice) => {
        if (supabase) {
            await supabase.from('invoices').insert([{
                id: invoice.id,
                business_id: invoice.business_id,
                client_name: invoice.client_name,
                client_nif: invoice.client_nif,
                date: invoice.date,
                total_amount: invoice.total_amount,
                status: invoice.status,
                data: invoice 
            }]);
        }
        return invoice;
    },

    getCoupons: async () => {
        if (supabase) {
            const { data } = await supabase.from('coupons').select('*');
            return data || [];
        }
        return MOCK_DISCOUNT_CODES;
    },
    
    getBanners: async () => MOCK_BANNERS,
    updateBanners: async (b: Banner[]) => b,
    getInvoices: async () => MOCK_INVOICES
};

// --- STORAGE ---
export const uploadBusinessImage = async (file: File, path: string) => {
    if (supabase) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data, error } = await supabase.storage
            .from('business-images')
            .upload(fileName, file);

        if (!error) {
            const { data: publicUrl } = supabase.storage
                .from('business-images')
                .getPublicUrl(fileName);
            return publicUrl.publicUrl;
        }
    }
    // Fallback for local dev without storage
    return URL.createObjectURL(file);
};
