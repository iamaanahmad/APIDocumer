/**
 * Helpers for building links to files served by this site (llms.txt, openapi.yaml, ...).
 *
 * The public URL of the docs site is taken from, in order:
 * 1. `NEXT_PUBLIC_SITE_URL` (for example `https://docs.example.com`), set at build time.
 * 2. `VERCEL_PROJECT_PRODUCTION_URL`, which Vercel sets automatically on every build.
 *
 * Without either, links are relative to the site root (plus `NEXT_PUBLIC_BASE_PATH`) and no
 * canonical URL or sitemap is emitted. The API server URL from the spec is never used here,
 * because the docs site and the API usually live on different hosts.
 */

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? '';
}

export function getSiteUrl(): string | undefined {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/+$/, '')}`;

  return undefined;
}

/** Absolute URL of the docs home page (site URL plus base path), when the site URL is known. */
export function getSiteHomeUrl(): string | undefined {
  const site = getSiteUrl();
  return site ? `${site}${getBasePath()}/` : undefined;
}

export function absoluteUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${getSiteUrl() ?? ''}${getBasePath()}${normalized}`;
}
