import { NextRequest, NextResponse } from 'next/server';
import { withOwnerApi } from '@/infrastructure/http/tenantRequestGuard';
import { getPlatformTelemetrySummary } from '@/infrastructure/audit/learningLoopRepository';

export const dynamic = 'force-dynamic';

/**
 * Product Owner control-plane endpoint returning strictly zero-free-text diagnostic telemetry
 * filterable by `tenantSlug` so audit engine accuracy can be monitored without accessing tenant secrets.
 */
export async function GET(request: NextRequest) {
  return withOwnerApi(request, async () => {
    const tenantSlug = request.nextUrl.searchParams.get('tenantSlug') ?? undefined;
    const summary = await getPlatformTelemetrySummary(tenantSlug);
    return NextResponse.json({
      ok: true,
      summary,
    });
  });
}
