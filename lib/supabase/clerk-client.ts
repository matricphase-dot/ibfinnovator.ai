'use client';import {useSession} from '@clerk/nextjs';import {useMemo} from 'react';import {createClient} from '@supabase/supabase-js';
export function useClerkSupabaseClient(){const {session}=useSession();return useMemo(()=>createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{accessToken:async()=>(await session?.getToken())??null}),[session])}
