import type { Metadata } from 'next';
import { getTaggedEndpoints } from '@/lib/openapi-parser';
import { loadOpenApiSpec } from '@/lib/openapi-loader';
import { DocViewer } from '@/components/doc-viewer';
import { getBasePath, getSiteHomeUrl } from '@/lib/site';
import { docsTitle, metaDescription, ogImage } from '@/lib/seo';

export async function generateMetadata(): Promise<Metadata> {
  const spec = await loadOpenApiSpec();
  const homeUrl = getSiteHomeUrl();

  if (!spec) {
    return {
      title: 'API Documentation',
      description: 'OpenAPI documentation viewer.',
    };
  }

  const title = docsTitle(spec);
  const description = metaDescription(spec);
  const image = ogImage(spec);
  const imageAlt = typeof spec.info['x-og-image'] === 'object' ? spec.info['x-og-image'].alt : undefined;

  const keywords = Array.from(
    new Set([...(spec.info['x-keywords'] ?? []), spec.info.title, `${spec.info.title} documentation`, 'API reference', 'OpenAPI', 'REST API'])
  );

  return {
    // `absolute` keeps the layout's title template from appending the site name a second time.
    title: { absolute: title },
    description,
    keywords,
    alternates: homeUrl
      ? {
          canonical: homeUrl,
          // Markdown version for agents and LLMs.
          types: { 'text/markdown': `${getBasePath()}/llms-full.txt` },
        }
      : undefined,
    openGraph: {
      type: 'website',
      title,
      description,
      siteName: spec.info.title,
      locale: 'en_US',
      ...(homeUrl ? { url: homeUrl } : {}),
      ...(image ? { images: [{ url: image, alt: imageAlt ?? title }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export default async function Home() {
  const initialSpec = await loadOpenApiSpec();
  const taggedEndpoints = getTaggedEndpoints(initialSpec);

  return <DocViewer initialSpec={initialSpec} initialTaggedEndpoints={taggedEndpoints} />;
}
