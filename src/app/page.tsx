import type { Metadata } from 'next';
import type { OpenAPISpec } from '@/types/openapi';
import { getTaggedEndpoints } from '@/lib/openapi-parser';
import { loadOpenApiSpec } from '@/lib/openapi-loader';
import { DocViewer } from '@/components/doc-viewer';

function endpointCount(spec: OpenAPISpec): number {
  return Object.values(spec.paths).reduce((total, pathItem) => {
    const count = Object.keys(pathItem).filter((method) => ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)).length;
    return total + count;
  }, 0);
}

function compactText(value: string | undefined, maxLength = 170): string | undefined {
  if (!value) return undefined;
  const normalized = value.replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}

export async function generateMetadata(): Promise<Metadata> {
  const spec = await loadOpenApiSpec();

  if (!spec) {
    return {
      title: 'API Documentation',
      description: 'OpenAPI documentation viewer.',
      alternates: { canonical: '/' },
    };
  }

  const title = `${spec.info.title} API Documentation`;
  const description =
    compactText(spec.info.description) ||
    `${spec.info.title} API reference with ${endpointCount(spec)} operations and OpenAPI ${spec.openapi} schema.`;

  const rawKeywords = spec.info['x-keywords'] ?? [];
  let serverHost: string | undefined;
  if (spec.servers?.[0]?.url) {
    try {
      serverHost = new URL(spec.servers[0].url).hostname;
    } catch {
      serverHost = undefined;
    }
  }
  const keywords = Array.from(
    new Set([
      ...rawKeywords,
      spec.info.title,
      `${spec.info.title} API`,
      'API docs',
      'OpenAPI',
      'REST API',
      ...(serverHost ? [serverHost] : []),
    ])
  );

  return {
    title,
    description,
    keywords,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      title,
      description,
      url: '/',
      siteName: spec.info.title,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function Home() {
  const initialSpec = await loadOpenApiSpec();
  const taggedEndpoints = getTaggedEndpoints(initialSpec);

  return <DocViewer initialSpec={initialSpec} initialTaggedEndpoints={taggedEndpoints} />;
}
