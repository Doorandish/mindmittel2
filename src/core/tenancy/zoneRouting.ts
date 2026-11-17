import type { HostZone } from './hostResolver';

export type ZoneRoutingDecision =
  | { action: 'next' }
  | { action: 'rewrite'; path: string }
  | { action: 'notFound' };

function startsWithSegment(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

const SHARED_PUBLIC_PATHS = ['/api/health'];

/**
 * Decides how the Edge middleware treats a request for a given host zone.
 * Each zone only exposes its own surface; everything else returns 404 so that
 * admin or marketing endpoints are never reachable from a customer subdomain.
 */
export function routeRequestForZone(zone: HostZone, pathname: string): ZoneRoutingDecision {
  if (SHARED_PUBLIC_PATHS.some((p) => startsWithSegment(pathname, p))) {
    return { action: 'next' };
  }

  if (zone.zone === 'marketing') {
    if (pathname === '/') return { action: 'rewrite', path: '/marketing' };
    if (startsWithSegment(pathname, '/marketing')) return { action: 'next' };
    if (
      startsWithSegment(pathname, '/api') ||
      startsWithSegment(pathname, '/admin') ||
      startsWithSegment(pathname, '/system')
    ) {
      return { action: 'notFound' };
    }
    return { action: 'next' };
  }

  if (zone.zone === 'admin') {
    if (pathname === '/') return { action: 'rewrite', path: '/admin' };
    if (
      startsWithSegment(pathname, '/admin') ||
      startsWithSegment(pathname, '/system') ||
      startsWithSegment(pathname, '/api/admin') ||
      startsWithSegment(pathname, '/api/system')
    ) {
      return { action: 'next' };
    }
    if (startsWithSegment(pathname, '/api') || startsWithSegment(pathname, '/marketing')) {
      return { action: 'notFound' };
    }
    return { action: 'next' };
  }

  if (
    startsWithSegment(pathname, '/admin') ||
    startsWithSegment(pathname, '/api/admin') ||
    startsWithSegment(pathname, '/marketing') ||
    startsWithSegment(pathname, '/system')
  ) {
    return { action: 'notFound' };
  }
  return { action: 'next' };
}
