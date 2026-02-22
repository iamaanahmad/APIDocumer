import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';

const siteUrl = 'https://apidocumer.github.io';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'APIDocumer - OpenAPI Documentation Viewer',
    template: '%s | APIDocumer',
  },
  description:
    'SEO-friendly, responsive OpenAPI documentation UI with endpoint search, schema rendering, and production-ready code snippets.',
  applicationName: 'APIDocumer',
  keywords: ['OpenAPI', 'API Docs', 'API Reference', 'Swagger', 'Redoc Alternative', 'Scalar Alternative'],
  authors: [{ name: 'APIDocumer Contributors' }],
  creator: 'APIDocumer Contributors',
  publisher: 'APIDocumer',
  category: 'developer tools',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'APIDocumer - OpenAPI Documentation Viewer',
    description:
      'Responsive, modern OpenAPI docs with schema tables, request/response examples, and code snippets.',
    siteName: 'APIDocumer',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'APIDocumer - OpenAPI Documentation Viewer',
    description: 'Responsive OpenAPI docs with schema rendering and code examples.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'APIDocumer',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  url: siteUrl,
  description: 'Responsive OpenAPI documentation viewer with searchable endpoints, schema rendering, and code snippets.',
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="color-scheme" content="dark light" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
