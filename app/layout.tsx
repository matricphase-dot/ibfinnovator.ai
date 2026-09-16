import './globals.css';
import type {Metadata, Viewport} from 'next';
import {ClerkProvider} from '@clerk/nextjs';
import {Toaster} from 'react-hot-toast';
import ServiceWorkerRegistrar from '@/components/ServiceWorkerRegistrar';

// metadataBase makes relative OG/Twitter image URLs absolute. Without it Next
// warns at build time and social crawlers receive a bare path they cannot fetch.
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ibfinnovator.ai';

export const metadata:Metadata={
  metadataBase:new URL(APP_URL),
  title:{default:'IBF — Build what matters, together',template:'%s · IBF'},
  description:'AI-powered collaboration for founders and emerging talent. Find projects, hire verified builders and grow with the IBF community.',
  applicationName:'IBF',
  manifest:'/manifest.json',
  alternates:{canonical:'/'},
  openGraph:{
    type:'website',
    url:APP_URL,
    siteName:'IBF — Innovator Bridge Foundry',
    title:'IBF — Build what matters, together',
    description:'AI-powered collaboration for founders and emerging talent.',
    images:[{url:'/icons/icon-512.png',width:512,height:512,alt:'IBF'}],
  },
  twitter:{
    card:'summary_large_image',
    title:'IBF — Build what matters, together',
    description:'AI-powered collaboration for founders and emerging talent.',
    images:['/icons/icon-512.png'],
  },
  robots:{
    index:true,
    follow:true,
    googleBot:{index:true,follow:true,'max-image-preview':'large','max-snippet':-1},
  },
  icons:{
    icon:[{url:'/icon.png',type:'image/png'}],
    apple:[{url:'/apple-icon.png',type:'image/png'}],
  },
};

export const viewport:Viewport={
  themeColor:'#0d1322',
  colorScheme:'dark',
  width:'device-width',
  initialScale:1,
};

export default function RootLayout({children}:{children:React.ReactNode}){
  return (
    <ClerkProvider
      appearance={{
        variables:{
          colorPrimary:'#00f5d4',
          colorBackground:'#0a0f1e',
          colorForeground:'#f4f7fb',
          colorInput:'#0d1524',
          colorInputForeground:'#f4f7fb',
          borderRadius:'10px',
          fontFamily:"'DM Sans', sans-serif"
        }
      }}
    >
      <html lang="en">
        <body>
          {/* First focusable element on the page: keyboard users can jump the
              nav and go straight to the content region. */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[200] focus:rounded-lg focus:bg-cyan-300 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-slate-950"
          >
            Skip to main content
          </a>
          {children}
          <Toaster position="bottom-right"/>
          <ServiceWorkerRegistrar/>
        </body>
      </html>
    </ClerkProvider>
  );
}
