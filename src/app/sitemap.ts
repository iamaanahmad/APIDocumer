import type { MetadataRoute } from 'next';
import { absoluteUrl, getSiteHomeUrl } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const home = getSiteHomeUrl();
  // Sitemap entries must be absolute. Without a known site URL the sitemap is left empty.
  if (!home) return [];

  const lastModified = new Date();
  return [
    { url: home, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: absoluteUrl('/llms.txt'), lastModified, changeFrequency: 'weekly', priority: 0.5 },
    { url: absoluteUrl('/llms-full.txt'), lastModified, changeFrequency: 'weekly', priority: 0.5 },
  ];
}
