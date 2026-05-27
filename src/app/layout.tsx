import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { loadOpenApiSpec } from '@/lib/openapi-loader';

export async function generateMetadata(): Promise<Metadata> {
  const spec = await loadOpenApiSpec();
  const siteName = spec?.info?.title || 'API Documentation';
  const siteUrl = spec?.servers?.[0]?.url || 'https://apidocumer.github.io';

  let metadataBase: URL;
  try {
    metadataBase = new URL(siteUrl);
  } catch {
    metadataBase = new URL('https://apidocumer.github.io');
  }

  return {
    metadataBase,
    title: {
      default: `${siteName} - OpenAPI Viewer`,
      template: `%s | ${siteName}`,
    },
    description:
      spec?.info?.description?.substring(0, 160) ||
      'SEO-friendly, responsive OpenAPI documentation UI with endpoint search, schema rendering, and production-ready code snippets.',
    applicationName: siteName,
    keywords: ['OpenAPI', 'API Docs', 'API Reference', 'Swagger', 'Redoc Alternative', siteName],
    authors: [{ name: `${siteName} Contributors` }],
    creator: `${siteName} Contributors`,
    publisher: siteName,
    category: 'developer tools',
    alternates: {
      canonical: '/',
    },
    openGraph: {
      type: 'website',
      locale: 'en_US',
      url: '/',
      title: `${siteName} - OpenAPI Viewer`,
      description:
        spec?.info?.description?.substring(0, 160) ||
        'Responsive, modern OpenAPI docs with schema tables, request/response examples, and code snippets.',
      siteName: siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${siteName} - OpenAPI Viewer`,
      description:
        spec?.info?.description?.substring(0, 160) ||
        'Responsive OpenAPI docs with schema rendering and code examples.',
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
}

export const viewport: Viewport = {
  themeColor: '#0ea5e9',
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const spec = await loadOpenApiSpec();
  const siteName = spec?.info?.title || 'API Documentation';
  const siteUrl = spec?.servers?.[0]?.url || 'https://apidocumer.github.io';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description:
      spec?.info?.description?.substring(0, 160) ||
      'Responsive OpenAPI documentation viewer with searchable endpoints, schema rendering, and code snippets.',
  };

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body className="min-h-screen font-body antialiased overflow-x-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
