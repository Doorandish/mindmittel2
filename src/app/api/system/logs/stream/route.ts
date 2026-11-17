import { NextRequest, NextResponse } from 'next/server';
import {
  systemLogger,
  type LogLevel,
} from '@/infrastructure/logging/logger';
import { resolveRequestZone } from '@/infrastructure/http/tenantRequestGuard';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) endpoint streaming real-time logs from the in-memory Ring Buffer.
 * When accessed on a tenant subdomain, filters logs strictly to that tenant.
 */
export async function GET(request: NextRequest) {
  const zone = resolveRequestZone(request);
  const tenantFilter = zone.zone === 'tenant' ? zone.slug : undefined;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const recent = systemLogger.getRecentLogs(50, tenantFilter);
      for (const item of recent) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(item)}\n\n`)
        );
      }

      const unsubscribe = systemLogger.subscribe((entry) => {
        if (tenantFilter && entry.tenant !== tenantFilter) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(entry)}\n\n`)
          );
        } catch {
          unsubscribe();
        }
      });

      request.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Ignore close errors
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}

/**
 * Diagnostic POST endpoint allowing developers to trigger test log events from the `/system` UI.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      level?: LogLevel;
      module?: string;
      message?: string;
      meta?: Record<string, unknown>;
    };

    const level: LogLevel =
      body.level === 'warn' || body.level === 'error' ? body.level : 'info';
    const moduleName = body.module?.trim() || 'system.diagnostic';
    const message =
      body.message?.trim() || 'Manual diagnostic probe triggered from /system';

    const entry = systemLogger[level](moduleName, message, body.meta);
    return NextResponse.json({ ok: true, entry });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Invalid JSON' },
      { status: 400 }
    );
  }
}
