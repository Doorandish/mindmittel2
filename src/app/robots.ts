import type { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { DEFAULT_ROOT_DOMAIN } from '@/core/tenancy/hostResolver';
import { buildRobotsForHost } from '@/core/seo/seoPolicies';

export const dynamic = 'force-dynamic';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headerStore = await headers();
  const rawHost =
    headerStore.get('x-forwarded-host') || headerStore.get('host') || '';
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;

  return buildRobotsForHost(rawHost, rootDomain);
}
