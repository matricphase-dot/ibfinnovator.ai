import {clerkMiddleware,createRouteMatcher} from '@clerk/nextjs/server';
import {createServerClient} from '@supabase/ssr';
import {NextResponse} from 'next/server';

const isProtected=createRouteMatcher(['/dashboard(.*)','/matches(.*)','/bookmarks(.*)','/profile(.*)','/settings(.*)','/chat(.*)','/team(.*)','/meetings(.*)','/analytics(.*)','/notifications(.*)','/cofounder-matches(.*)','/credentials(.*)','/applications(.*)','/university(.*)','/projects/new(.*)']);

export default clerkMiddleware(async(clerkAuth,req)=>{
 if(!isProtected(req))return NextResponse.next();
 const {userId}=await clerkAuth();
 if(userId)return NextResponse.next();
 let response=NextResponse.next({request:req});
 const legacy=createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,{cookies:{getAll:()=>req.cookies.getAll(),setAll(items){items.forEach(({name,value})=>req.cookies.set(name,value));response=NextResponse.next({request:req});items.forEach(({name,value,options})=>response.cookies.set(name,value,options))}}});
 const {data:{user}}=await legacy.auth.getUser();
 if(user)return response;
 const url=req.nextUrl.clone();url.pathname='/auth/signin';url.searchParams.set('next',`${req.nextUrl.pathname}${req.nextUrl.search}`);return NextResponse.redirect(url);
});
export const config={matcher:['/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json).*)']};
