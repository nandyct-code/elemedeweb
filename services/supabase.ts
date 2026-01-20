
import { createClient } from '@supabase/supabase-js';
import { Business, UserAccount, Invoice, Banner, DiscountCode, ForumQuestion, Lead, SupportTicket, PushCampaign } from '../types';
import { MOCK_BUSINESSES, MOCK_USERS, MOCK_INVOICES, MOCK_BANNERS, MOCK_DISCOUNT_CODES, MOCK_FORUM, MOCK_LEADS } from '../constants';
import { hashPassword, verifyPassword } from './securityUtils';

// --- CONFIGURATION ---
const getEnvVar = (key: string): string => {
  const meta = import.meta as any;
  return (meta.env && meta.env[key]) || '';
};

// Keys from .env
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

if (!isSupabaseConfigured) {
    console.warn("⚠️ Supabase keys missing. Running in OFFLINE/DEMO mode with LocalStorage persistence.");
}

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// --- PERSISTENCE HELPERS (LOCAL STORAGE) ---
const loadFromStorage = (key: string, defaultData: any) => {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultData;
    } catch (e) {
        console.error(`Error loading ${key} from storage`, e);
        return defaultData;
    }
};

const saveToStorage = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error(`Error saving ${key} to storage`, e);
    }
};

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
    reliabilityScore: dbBiz.reliability_score,
    direccionesAdicionales: dbBiz.direcciones_adicionales || [],
    openingHours: dbBiz.opening_hours
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
    if (biz.direccionesAdicionales) mapped.direcciones_adicionales = biz.direccionesAdicionales;
    if (biz.openingHours) mapped.opening_hours = biz.openingHours;
    return mapped;
};

// --- DATA SERVICE ---
export const dataService = {
    
    // FETCH ALL (Hybrid Strategy)
    fetchAll: async () => {
        if (supabase) {
            try {
                // Fetch Businesses
                const { data: dbBusinesses, error: bizError } = await supabase.from('businesses').select('*');
                
                // Fetch Profiles (Users)
                const { data: dbUsers, error: userError } = await supabase.from('profiles').select('*');

                // Fetch Coupons
                const { data: dbCoupons } = await supabase.from('coupons').select('*');

                if (!bizError && dbBusinesses) {
                    const mappedBusinesses = dbBusinesses.map(mapBusinessFromDB);
                    
                    const mappedUsers = dbUsers ? dbUsers.map((u: any) => ({
                        id: u.id,
                        email: u.email,
                        name: u.name,
                        role: u.role,
                        status: u.status,
                        favorites: u.favorites,
                        password_hash: 'HIDDEN' // Security: Never return real hash to frontend state list
                    })) : [];

                    return {
                        businesses: mappedBusinesses.length > 0 ? mappedBusinesses : MOCK_BUSINESSES,
                        users: mappedUsers.length > 0 ? mappedUsers : MOCK_USERS,
                        invoices: MOCK_INVOICES,
                        banners: MOCK_BANNERS,
                        coupons: dbCoupons && dbCoupons.length > 0 ? dbCoupons : MOCK_DISCOUNT_CODES,
                        forum: MOCK_FORUM,
                        leads: MOCK_LEADS,
                        tickets: [],
                        campaigns: []
                    };
                }
            } catch (e) {
                console.error("Supabase connection failed, using mocks:", e);
            }
        }

        // Fallback for dev mode (USING LOCALSTORAGE PERSISTENCE)
        return {
            businesses: loadFromStorage('elemede_data_businesses', MOCK_BUSINESSES),
            users: loadFromStorage('elemede_data_users', MOCK_USERS),
            invoices: loadFromStorage('elemede_data_invoices', MOCK_INVOICES),
            banners: loadFromStorage('elemede_data_banners', MOCK_BANNERS),
            coupons: loadFromStorage('elemede_data_coupons', MOCK_DISCOUNT_CODES),
            forum: loadFromStorage('elemede_data_forum', MOCK_FORUM),
            leads: loadFromStorage('elemede_data_leads', MOCK_LEADS),
            tickets: loadFromStorage('elemede_data_tickets', []),
            campaigns: []
        };
    },

    // SOCIAL LOGIN (OAUTH)
    signInWithProvider: async (provider: 'google' | 'facebook' | 'apple') => {
        if (!supabase) throw new Error("Servicio de autenticación no disponible.");
        
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: provider,
            options: {
                redirectTo: window.location.origin,
            },
        });

        if (error) throw error;
        return data;
    },

    // SESSION LISTENER & PROFILE SYNC
    initializeAuthListener: (onUserAuthenticated: (user: UserAccount) => void) => {
        if (!supabase) return;

        supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                const userId = session.user.id;
                const userEmail = session.user.email || '';
                
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

                if (profile) {
                    onUserAuthenticated({ ...profile, id: userId, email: userEmail, password_hash: 'HIDDEN' });
                } else {
                    const metaName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || userEmail.split('@')[0];
                    const newProfile = {
                        id: userId,
                        email: userEmail,
                        name: metaName,
                        role: 'user',
                        status: 'active',
                        date_registered: new Date().toISOString()
                    };
                    const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
                    if (!insertError) {
                        onUserAuthenticated({ ...newProfile, password_hash: 'HIDDEN' } as UserAccount);
                    }
                }
            }
        });
    },

    // AUTHENTICATION (EMAIL/PASSWORD) - SECURED
    authenticate: async (email: string, plainPassword: string): Promise<UserAccount | null> => {
        if (supabase) {
            // Real Auth
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password: plainPassword, // Supabase handles hashing internally
            });

            if (!error && data.user) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
                return profile ? { ...profile, id: data.user.id, email: data.user.email!, password_hash: 'HIDDEN' } : null;
            }
        }
        
        // Mock/Local Auth - NOW SECURED WITH SHA-256
        const localUsers: UserAccount[] = loadFromStorage('elemede_data_users', MOCK_USERS);
        const user = localUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (user) {
            // Check against stored hash
            const isValid = await verifyPassword(plainPassword, user.password_hash);
            if (isValid) {
                // Return user object but CENSOR the hash to state
                return { ...user, password_hash: 'HIDDEN' };
            }
        }
        return null;
    },

    createUser: async (user: UserAccount): Promise<UserAccount> => {
        if (supabase) {
            const { data, error } = await supabase.auth.signUp({
                email: user.email,
                password: user.password_hash, // Real pass needed for creation
                options: {
                    data: {
                        name: user.name,
                        role: user.role
                    }
                }
            });

            if (error) throw error;
            
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
        
        // LOCAL PERSISTENCE - NOW SECURED
        // Encrypt password before storage
        const secureHash = await hashPassword(user.password_hash); // Assuming user.password_hash contains plain text from form
        
        const newUser = { 
            ...user, 
            id: `u_${Date.now()}`,
            password_hash: secureHash // STORE HASH ONLY
        };
        
        const currentUsers = loadFromStorage('elemede_data_users', MOCK_USERS);
        saveToStorage('elemede_data_users', [...currentUsers, newUser]);
        
        // Return object with HIDDEN hash to state
        return { ...newUser, password_hash: 'HIDDEN' };
    },

    updateUser: async (user: UserAccount) => {
        if (supabase) {
            await supabase.from('profiles').update({
                name: user.name,
                favorites: user.favorites,
                status: user.status
            }).eq('id', user.id);
        } else {
            const currentUsers: UserAccount[] = loadFromStorage('elemede_data_users', MOCK_USERS);
            // Don't overwrite password with 'HIDDEN' if updating profile details
            const updated = currentUsers.map(u => {
                if (u.id === user.id) {
                    return { ...u, ...user, password_hash: u.password_hash }; // Keep original hash
                }
                return u;
            });
            saveToStorage('elemede_data_users', updated);
        }
    },

    // BUSINESS
    createBusiness: async (business: Business) => {
        if (supabase) {
            const dbPayload = mapBusinessToDB(business);
            const { data: authData } = await supabase.auth.getUser();
            if (authData.user) {
                dbPayload.owner_id = authData.user.id;
            }
            const { error } = await supabase.from('businesses').insert([dbPayload]);
            if (error) console.error("Error creating business", error);
        } else {
            const currentBiz = loadFromStorage('elemede_data_businesses', MOCK_BUSINESSES);
            saveToStorage('elemede_data_businesses', [...currentBiz, business]);
        }
        return business;
    },

    updateBusiness: async (id: string, updates: Partial<Business>) => {
        if (supabase) {
            const dbUpdates = mapBusinessToDB(updates);
            await supabase.from('businesses').update(dbUpdates).eq('id', id);
        } else {
            const currentBiz: Business[] = loadFromStorage('elemede_data_businesses', MOCK_BUSINESSES);
            const updated = currentBiz.map(b => b.id === id ? { ...b, ...updates } : b);
            saveToStorage('elemede_data_businesses', updated);
        }
    },

    // INVOICES & COUPONS
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
        } else {
            const currentInvoices = loadFromStorage('elemede_data_invoices', MOCK_INVOICES);
            saveToStorage('elemede_data_invoices', [invoice, ...currentInvoices]);
        }
    },

    getCoupons: async () => {
        if (supabase) {
            const { data } = await supabase.from('coupons').select('*');
            return data || [];
        }
        return loadFromStorage('elemede_data_coupons', MOCK_DISCOUNT_CODES);
    },
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
            return URL.createObjectURL(file);
        }
    }
    return URL.createObjectURL(file);
};
