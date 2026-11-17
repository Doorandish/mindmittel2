import { NextRequest, NextResponse } from 'next/server';
import {
  DEFAULT_ROOT_DOMAIN,
  resolveHostZone,
} from '@/core/tenancy/hostResolver';
import { routeRequestForZone } from '@/core/tenancy/zoneRouting';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const rawHost =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || '';
  const rootDomain =
    process.env.NEXT_PUBLIC_ROOT_DOMAIN?.trim() || DEFAULT_ROOT_DOMAIN;

  // On localhost, allow ?zone=marketing or ?zone=admin or ?tenant=<slug> for convenient previewing
  const queryTenant = request.nextUrl.searchParams.get('tenant')?.trim().toLowerCase();
  const zone = queryTenant
    ? ({ zone: 'tenant', slug: queryTenant } as const)
    : resolveHostZone(rawHost, rootDomain);

  const decision = routeRequestForZone(zone, pathname);

  if (decision.action === 'notFound') {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { ok: false, error: 'Endpoint not available on this host zone.' },
        { status: 404 }
      );
    }
    return new NextResponse('Not Found', { status: 404 });
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-mindmittel-zone', zone.zone);
  if (zone.zone === 'tenant') {
    requestHeaders.set('x-mindmittel-tenant', zone.slug);
  }

  if (decision.action === 'rewrite') {
    const rewriteUrl = request.nextUrl.clone();
    rewriteUrl.pathname = decision.path;
    return NextResponse.rewrite(rewriteUrl, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
