/**
 * Helpers for building links to files served by this site (llms.txt, openapi.yaml, ...).
 *
 * Set `NEXT_PUBLIC_SITE_URL` (for example `https://docs.example.com`) at build time to get
 * absolute URLs. Without it, links are relative to the site root (plus `NEXT_PUBLIC_BASE_PATH`).
 */

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? '';
}

export function getSiteUrl(): string | undefined {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  return value ? value.replace(/\/+$/, '') : undefined;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl() ?? ''}${getBasePath()}${normalized}`;
}
