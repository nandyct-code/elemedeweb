
import { createClient } from '@supabase/supabase-js';
import { Business, UserAccount, Invoice, Banner, DiscountCode, ForumQuestion, Lead, SupportTicket, PushCampaign } from '../types';
import { MOCK_BUSINESSES, MOCK_USERS, MOCK_INVOICES, MOCK_BANNERS, MOCK_DISCOUNT_CODES, MOCK_FORUM, MOCK_LEADS } from '../constants';

// --- CONFIGURATION ---
const getEnvVar = (key: string): string => {
  const meta = import.meta as any;
  return (meta.env && meta.env[key]) || '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase keys missing. Running in OFFLINE mode.");
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- DATA MAPPING HELPERS ---
const mapBusinessFromDB = (dbBiz: any): Business => ({
    id: dbBiz.id,
    name: dbBiz.name,
    sectorId: dbBiz.sector_id,
    packId: dbBiz.pack_id,
    nif: dbBiz.nif || '',
    phone: dbBiz.phone || '',
    address: dbBiz.address || '',
    city: dbBiz.city || '',
    province: dbBiz.province || '',
    cp: dbBiz.cp || '',
    lat: dbBiz.lat || 0,
    lng: dbBiz.lng || 0,
    status: dbBiz.status || 'active',
    mainImage: dbBiz.main_image,
    images: dbBiz.images || [],
    tags: dbBiz.tags || [],
    description: dbBiz.description,
    createdAt: dbBiz.created_at,
    billingCycle: dbBiz.billing_cycle,
    credits: dbBiz.credits,
    totalAdSpend: dbBiz.total_ad_spend,
    reliabilityScore: dbBiz.reliability_score
});

const mapBusinessToDB = (biz: Partial<Business>) => {
    const mapped: any = {};
    if (biz.name) mapped.name = biz.name;
    if (biz.sectorId) mapped.sector_id = biz.sectorId;
    if (biz.packId) mapped.pack_id = biz.packId;
    if (biz.nif) mapped.nif = biz.nif;
    if (biz.phone) mapped.phone = biz.phone;
    if (biz.address) mapped.address = biz.address;
    if (biz.city) mapped.city = biz.city;
    if (biz.province) mapped.province = biz.province;
    if (biz.cp) mapped.cp = biz.cp;
    if (biz.lat) mapped.lat = biz.lat;
    if (biz.lng) mapped.lng = biz.lng;
    if (biz.mainImage) mapped.main_image = biz.mainImage;
    if (biz.images) mapped.images = biz.images;
    if (biz.tags) mapped.tags = biz.tags;
    if (biz.description) mapped.description = biz.description;
    if (biz.credits !== undefined) mapped.credits = biz.credits;
    return mapped;
};

// --- DATA SERVICE ---
export const dataService = {
    
    // FETCH ALL (Hybrid)
    fetchAll: async () => {
        if (supabase) {
            try {
                // Fetch Businesses
                const { data: dbBusinesses, error: bizError } = await supabase.from('businesses').select('*');
                
                // Fetch Profiles (Users)
                const { data: dbUsers, error: userError } = await supabase.from('profiles').select('*');

                if (!bizError && dbBusinesses) {
                    const mappedBusinesses = dbBusinesses.map(mapBusinessFromDB);
                    const mappedUsers = dbUsers ? dbUsers.map((u: any) => ({
                        id: u.id,
                        email: u.email,
                        name: u.name,
                        role: u.role,
                        status: u.status,
                        favorites: u.favorites,
                        password_hash: 'HIDDEN'
                    })) : [];

                    return {
                        businesses: mappedBusinesses.length > 0 ? mappedBusinesses : MOCK_BUSINESSES,
                        users: mappedUsers.length > 0 ? mappedUsers : MOCK_USERS,
                        invoices: MOCK_INVOICES, // Keep mocks for invoices initially
                        banners: MOCK_BANNERS,
                        coupons: MOCK_DISCOUNT_CODES,
                        forum: MOCK_FORUM,
                        leads: MOCK_LEADS,
                        tickets: [],
                        campaigns: []
                    };
                }
            } catch (e) {
                console.error("Supabase load failed, using mocks:", e);
            }
        }

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

    // AUTHENTICATION
    authenticate: async (email: string, passwordHash: string): Promise<UserAccount | null> => {
        if (supabase) {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: passwordHash, 
            });

            if (!error && data.user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', data.user.id)
                    .single();
                
                return profile ? { ...profile, id: data.user.id, email: data.user.email!, password_hash: 'HIDDEN' } : null;
            }
        }
        // Mock fallback
        const mockUser = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
        return mockUser || null;
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
            
            // Trigger created via trigger in DB or manually insert profile if needed
            // For now assuming Auth Hook handles profile creation or we do it manually:
            if (data.user) {
                const { error: profileError } = await supabase.from('profiles').insert([{
                    id: data.user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                }]);
                if (!profileError) {
                    return { ...user, id: data.user.id, password_hash: 'HIDDEN' };
                }
            }
        }
        return { ...user, id: `mock_${Date.now()}` };
    },

    updateUser: async (user: UserAccount) => {
        if (supabase) {
            await supabase.from('profiles').update({
                name: user.name,
                favorites: user.favorites
            }).eq('id', user.id);
        }
    },

    // BUSINESS
    createBusiness: async (business: Business) => {
        if (supabase) {
            const dbPayload = mapBusinessToDB(business);
            // Link owner if exists in current session
            const { data:  authData } = await supabase.auth.getUser();
            if (authData.user) {
                dbPayload.owner_id = authData.user.id;
            }
            
            const { error } = await supabase.from('businesses').insert([dbPayload]);
            if (error) console.error("Error creating business", error);
        }
        return business;
    },

    updateBusiness: async (id: string, updates: Partial<Business>) => {
        if (supabase) {
            const dbUpdates = mapBusinessToDB(updates);
            await supabase.from('businesses').update(dbUpdates).eq('id', id);
        }
    },

    createInvoice: async (invoice: Invoice) => {
        // Just log for now as Invoice table structure might vary
        console.log("Invoice created (DB Pending)", invoice.id);
    },

    getCoupons: async () => MOCK_DISCOUNT_CODES,
};

// --- STORAGE SERVICE (REAL) ---
export const uploadBusinessImage = async (file: File, pathPrefix: string): Promise<string> => {
    if (supabase) {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${pathPrefix}_${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('business-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error("Storage upload error:", uploadError);
                throw uploadError;
            }

            const { data } = supabase.storage
                .from('business-images')
                .getPublicUrl(filePath);

            return data.publicUrl;
        } catch (e) {
            console.error("Upload failed", e);
            // Fallback to local
            return URL.createObjectURL(file);
        }
    }
    // Fallback for offline dev
    return URL.createObjectURL(file);
};
