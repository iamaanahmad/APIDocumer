import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { loadOpenApiSpec } from '@/lib/openapi-loader';
import { getSiteHomeUrl, getSiteUrl } from '@/lib/site';
import { docsTitle, metaDescription } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const spec = await loadOpenApiSpec();
  const siteName = spec?.info?.title || 'API Documentation';
  const siteUrl = getSiteUrl();

  return {
    // Only set when the docs site URL is known. Never derived from the API server URL.
    ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
    title: {
      default: spec ? docsTitle(spec) : 'API Documentation',
      template: `%s | ${siteName}`,
    },
    description: spec ? metaDescription(spec) : 'OpenAPI documentation with searchable endpoints, schemas and code examples.',
    applicationName: siteName,
    category: 'technology',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#0b1020' },
  ],
  colorScheme: 'dark light',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

/** Serializes JSON-LD safely: `<` is escaped so spec text cannot close the script tag. */
function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const spec = await loadOpenApiSpec();
  const homeUrl = getSiteHomeUrl();

  const structuredData = spec
    ? {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: docsTitle(spec),
        alternateName: spec.info.title,
        description: metaDescription(spec),
        inLanguage: 'en',
        ...(homeUrl ? { url: homeUrl } : {}),
        ...(spec.info.contact?.name || spec.info.contact?.url
          ? { publisher: { '@type': 'Organization', name: spec.info.contact?.name ?? spec.info.title, ...(spec.info.contact?.url ? { url: spec.info.contact.url } : {}) } }
          : {}),
      }
    : null;

  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />}
      </head>
      <body className="min-h-screen font-body antialiased overflow-x-hidden">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
