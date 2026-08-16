import './globals.css';import type {Metadata} from 'next';import {Toaster} from 'react-hot-toast';
export const metadata:Metadata={title:{default:'IBF — Build what matters, together',template:'%s · IBF'},description:'AI-powered collaboration for founders and emerging talent.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}<Toaster position="bottom-right"/></body></html>}
