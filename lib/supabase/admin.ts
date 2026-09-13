import 'server-only';import {createClient} from '@supabase/supabase-js';
if(!process.env.SUPABASE_SERVICE_ROLE_KEY&&process.env.NODE_ENV==='production')console.warn('SUPABASE_SERVICE_ROLE_KEY is not configured');
export const supabaseAdmin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY||'missing-service-role-key',{auth:{persistSession:false,autoRefreshToken:false}});
