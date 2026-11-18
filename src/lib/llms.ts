import type { OpenAPISpec } from '@/types/openapi';
import { getTaggedEndpoints } from '@/lib/openapi-parser';
import { describeSecurityScheme, getOperationAnchor, getSecuritySchemes } from '@/lib/operation-utils';
import { absoluteUrl } from '@/lib/site';

/** Strips common Markdown so a description can be used as one plain-text sentence. */
function toPlainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s.*$/gm, ' ')
    .replace(/[*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function firstParagraph(markdown: string | undefined, maxLength = 300): string {
  if (!markdown) return '';
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !block.startsWith('#') && !block.startsWith('```'));
  const text = toPlainText(paragraph ?? '');
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/**
 * Builds `/llms.txt`: a short, curated index that follows the llms.txt convention
 * (H1 title, blockquote summary, then H2 sections containing link lists).
 */
export function buildLlmsTxt(spec: OpenAPISpec | null): string {
  if (!spec) return '# API Documentation\n\n> No specification available.\n';

  const lines: string[] = [`# ${spec.info.title}`, ''];
  const summary = firstParagraph(spec.info.description);
  if (summary) lines.push(`> ${summary}`, '');

  const notes: string[] = [];
  if (spec.info.version) notes.push(`- Version: ${spec.info.version}`);
  if (spec.servers?.length) notes.push(`- Base URL: \`${spec.servers[0].url}\``);
  const schemes = getSecuritySchemes(spec);
  if (schemes.length > 0) {
    notes.push(`- Authentication: ${schemes.map(({ scheme }) => describeSecurityScheme(scheme)).join(' or ')}`);
  }
  if (notes.length > 0) lines.push(...notes, '');

  lines.push('## Documentation', '');
  lines.push(`- [Full documentation (Markdown)](${absoluteUrl('/llms-full.txt')}): every endpoint with parameters, schemas, responses and example requests in one file`);
  lines.push(`- [OpenAPI specification (YAML)](${absoluteUrl('/openapi.yaml')}): machine-readable source of truth`);
  lines.push(`- [Interactive documentation](${absoluteUrl('/')}): the human-readable site`);
  lines.push('');

  getTaggedEndpoints(spec).forEach(({ tag, endpoints }) => {
    lines.push(`## ${tag.name}`, '');
    if (tag.description) lines.push(tag.description.replace(/\s+/g, ' ').trim(), '');
    endpoints.forEach((endpoint) => {
      const label = `${endpoint.method.toUpperCase()} ${endpoint.path}`;
      const description = firstParagraph(endpoint.operation.summary || endpoint.operation.description, 160);
      lines.push(`- [${label}](${absoluteUrl('/')}#${getOperationAnchor(endpoint)})${description ? `: ${description}` : ''}`);
    });
    lines.push('');
  });

  return lines.join('\n').trimEnd() + '\n';
}
