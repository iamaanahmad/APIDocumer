import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    // Sitemaps must use absolute URLs, so the line is only added when the site URL is known.
    ...(getSiteUrl() ? { sitemap: absoluteUrl('/sitemap.xml') } : {}),
  };
}
