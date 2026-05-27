import type { OpenAPISpec } from '@/types/openapi';
import yaml from 'js-yaml';

export function generateMarkdown(spec: OpenAPISpec | null): string {
  if (!spec) return 'No specification available.';

  let md = `# ${spec.info.title || 'API Documentation'}\n\n`;
  if (spec.info.version) md += `**Version:** ${spec.info.version}\n\n`;
  if (spec.info.description) md += `${spec.info.description}\n\n`;

  if (spec.servers && spec.servers.length > 0) {
    md += `## Servers\n`;
    for (const server of spec.servers) {
      md += `- ${server.url} ${server.description ? `(${server.description})` : ''}\n`;
    }
    md += `\n`;
  }

  md += `## Endpoints\n\n`;

  for (const path in spec.paths) {
    for (const method in spec.paths[path]) {
      const operation = (spec.paths[path] as any)[method];
      if (!operation || typeof operation !== 'object') continue;

      md += `### \`${method.toUpperCase()}\` ${path}\n\n`;
      if (operation.summary) md += `**Summary:** ${operation.summary}\n\n`;
      if (operation.description) md += `${operation.description}\n\n`;

      if (operation.parameters && operation.parameters.length > 0) {
        md += `#### Parameters\n\n`;
        md += `| Name | In | Required | Type | Description |\n`;
        md += `| ---- | -- | -------- | ---- | ----------- |\n`;
        for (const param of operation.parameters as any[]) {
          if (param.$ref) continue;
          md += `| \`${param.name}\` | ${param.in} | ${param.required ? 'Yes' : 'No'} | ${param.schema?.type || 'any'} | ${param.description || ''} |\n`;
        }
        md += `\n`;
      }

      if (operation.requestBody && (operation.requestBody as any).content) {
        md += `#### Request Body\n\n`;
        const content = (operation.requestBody as any).content;
        for (const contentType in content) {
          md += `- **${contentType}**\n`;
          if (content[contentType].schema) {
            md += "```yaml\n";
            md += yaml.dump(content[contentType].schema, { indent: 2 });
            md += "```\n\n";
          }
        }
      }

      if (operation.responses) {
        md += `#### Responses\n\n`;
        for (const status in operation.responses) {
          const res = (operation.responses as any)[status];
          if (res.$ref) continue;
          md += `- **${status}**: ${res.description || ''}\n`;
        }
        md += `\n`;
      }
      
      md += `---\n\n`;
    }
  }

  return md;
}
