import type { OpenAPISpec } from '@/types/openapi';

/** Converts Markdown to plain text suitable for meta descriptions and structured data. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/[*_`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Plain-text summary of the first prose paragraph, trimmed to `maxLength` at a word boundary. */
export function summarize(markdown: string | undefined, maxLength = 160): string | undefined {
  if (!markdown) return undefined;
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('```') && !block.startsWith('<'));
  const text = markdownToPlainText(paragraph ?? markdown);
  if (!text) return undefined;
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

/** Page title such as "Acme API Documentation", without doubling "API". */
export function docsTitle(spec: OpenAPISpec): string {
  const title = spec.info.title.trim();
  return /\bapi$/i.test(title) ? `${title} Documentation` : `${title} API Documentation`;
}

export function countOperations(spec: OpenAPISpec): number {
  return Object.values(spec.paths).reduce((total, item) => {
    return total + Object.keys(item).filter((method) => ['get', 'post', 'put', 'delete', 'patch', 'options', 'head'].includes(method)).length;
  }, 0);
}

export function metaDescription(spec: OpenAPISpec): string {
  return (
    summarize(spec.info.description) ||
    `${spec.info.title} API reference with ${countOperations(spec)} endpoints, request and response schemas, and code examples.`
  );
}

/** Social preview image: `info.x-og-image` (recommended 1200x630), if provided. */
export function ogImage(spec: OpenAPISpec): string | undefined {
  const value = spec.info['x-og-image'];
  if (!value) return undefined;
  return typeof value === 'string' ? value : value.url;
}
