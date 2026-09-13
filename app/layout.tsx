import './globals.css';
import type {Metadata} from 'next';
import {ClerkProvider} from '@clerk/nextjs';
import {Toaster} from 'react-hot-toast';
export const metadata:Metadata={title:{default:'IBF — Build what matters, together',template:'%s · IBF'},description:'AI-powered collaboration for founders and emerging talent.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <ClerkProvider appearance={{variables:{colorPrimary:'#00f5d4',colorBackground:'#0a0f1e',colorForeground:'#f4f7fb',colorInput:'#0d1524',colorInputForeground:'#f4f7fb',borderRadius:'10px',fontFamily:"'DM Sans', sans-serif"}}}><html lang="en"><body>{children}<Toaster position="bottom-right"/></body></html></ClerkProvider>}
