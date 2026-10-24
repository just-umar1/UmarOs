import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { siteUrl } from '@/lib/config';
export const metadata:Metadata={metadataBase:new URL(siteUrl),title:{default:'UMAR.OS — Developer portfolios',template:'%s · UMAR.OS'},description:'Create your developer portfolio, showcase your projects, and share your work with a single link.',applicationName:'UMAR.OS',openGraph:{type:'website',siteName:'UMAR.OS',title:'UMAR.OS — Developer portfolios',description:'Create your developer portfolio and share your work with one link.'},twitter:{card:'summary_large_image'}};
export const viewport:Viewport={themeColor:'#090909',width:'device-width',initialScale:1};
export default function RootLayout({children}:{children:ReactNode}){return <html lang="en" data-theme="dark"><body>{children}</body></html>;}
