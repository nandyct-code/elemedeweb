
import { createClient } from '@supabase/supabase-js';
import { Business, UserAccount } from '../types';

// Safe environment variable access for Vite
const getEnvVar = (key: string): string => {
  // Use type assertion to avoid TS errors if ImportMeta is not augmented globally
  const meta = import.meta as any;
  if (typeof meta !== 'undefined' && meta.env) {
    return meta.env[key] || '';
  }
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

// Initialize client only if keys exist
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

export const fetchInitialData = async () => {
  if (!supabase) {
    console.log('⚪ [SUPABASE] Cliente no configurado (Faltan credenciales). Usando modo Demo.');
    return null;
  }

  try {
    console.log('🔵 [SUPABASE] Conectando...');
    
    // 1. Fetch Businesses
    const { data: businessesData, error: bizError } = await supabase
      .from('businesses')
      .select('*')
      .eq('status', 'active');

    if (bizError) throw bizError;

    // 2. Fetch Users (Profiles) - Optional
    const { data: usersData, error: userError } = await supabase
      .from('profiles')
      .select('*');

    if (userError) console.warn('[SUPABASE] Warning fetching profiles:', userError.message);

    console.log(`🟢 [SUPABASE] Cargados ${businessesData?.length || 0} negocios.`);

    return {
      businesses: businessesData as Business[] || [],
      users: usersData as UserAccount[] || []
    };

  } catch (error) {
    console.error('🔴 [SUPABASE] Fallo en la conexión:', error);
    return null; 
  }
};

export const uploadBusinessImage = async (file: File, path: string) => {
    if (!supabase) return null;
    try {
        const { data, error } = await supabase.storage.from('business-images').upload(path, file);
        if (error) throw error;
        const { data: publicUrl } = supabase.storage.from('business-images').getPublicUrl(path);
        return publicUrl.publicUrl;
    } catch (error) {
        console.error("Error subiendo imagen:", error);
        return null;
    }
};
