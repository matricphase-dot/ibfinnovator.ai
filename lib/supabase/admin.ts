import 'server-only';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
export function getSupabaseAdmin():SupabaseClient{if(client)return client;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('supabaseAdmin requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});return client}
export const supabaseAdmin=new Proxy({} as SupabaseClient,{get(_target,prop){const value=(getSupabaseAdmin() as any)[prop];return typeof value==='function'?value.bind(getSupabaseAdmin()):value}});
