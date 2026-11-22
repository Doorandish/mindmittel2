import type { MetadataRoute } from 'next';
import { DEFAULT_ROOT_DOMAIN } from '@/core/tenancy/hostResolver';

export default function sitemap(): MetadataRoute.Sitemap {
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;

  return [
    {
      url: `https://${rootDomain}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
  ];
}
