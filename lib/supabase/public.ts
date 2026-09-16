import {createClient,type SupabaseClient} from '@supabase/supabase-js';
let client:SupabaseClient|null=null;
export function getSupabasePublic():SupabaseClient{if(client)return client;const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;if(!url||!key)throw new Error('supabasePublic requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});return client}
export const supabasePublic=new Proxy({} as SupabaseClient,{get(_target,prop){const instance=getSupabasePublic() as any,value=instance[prop];return typeof value==='function'?value.bind(instance):value}});
