import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: {
    default: 'APIDocumer - Professional OpenAPI Documentation',
    template: '%s | APIDocumer'
  },
  description: 'Beautiful, responsive, and professional OpenAPI documentation viewer. Interactive API documentation with code examples, schema visualization, and seamless navigation.',
  keywords: ['OpenAPI', 'API Documentation', 'Swagger', 'REST API', 'API Explorer', 'Developer Tools'],
  authors: [{ name: 'APIDocumer' }],
  creator: 'APIDocumer',
  publisher: 'APIDocumer',
  metadataBase: new URL('https://apidocumer.github.io'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'APIDocumer - Professional OpenAPI Documentation',
    description: 'Beautiful, responsive, and professional OpenAPI documentation viewer with interactive examples and schema visualization.',
    siteName: 'APIDocumer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APIDocumer - Professional OpenAPI Documentation',
    description: 'Beautiful, responsive, and professional OpenAPI documentation viewer with interactive examples.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="color-scheme" content="dark light" />
      </head>
      <body className="font-body antialiased min-h-screen">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
