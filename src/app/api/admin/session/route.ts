import { NextRequest, NextResponse } from 'next/server';
import { createFixedWindowRateLimiter } from '@/core/security/rateLimiter';
import { verifyOwnerCredentials } from '@/infrastructure/security/masterKey';
import {
  attachOwnerSessionCookie,
  clearSessionCookie,
  OWNER_SESSION_COOKIE,
  readOwnerSession,
} from '@/infrastructure/http/tenantRequestGuard';
import { systemLogger } from '@/infrastructure/logging/logger';

export const dynamic = 'force-dynamic';

const adminLoginLimiter = createFixedWindowRateLimiter({
  limit: 8,
  windowMs: 10 * 60 * 1000,
});

export async function GET(request: NextRequest) {
  const session = readOwnerSession(request);
  return NextResponse.json({
    ok: true,
    authenticated: Boolean(session),
    owner: session ? { email: session.sub } : null,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };

    const email = (body.email ?? '').trim().toLowerCase();
    const password = body.password ?? '';

    const rate = adminLoginLimiter.hit(email || 'anon');
    if (!rate.allowed) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Too many login attempts. Please try again in a few minutes.',
        },
        { status: 429 }
      );
    }

    if (!verifyOwnerCredentials(email, password)) {
      systemLogger.warn(
        'admin.auth',
        `Rejected Super-Admin sign-in attempt for [${email || 'empty'}]`
      );
      return NextResponse.json(
        { ok: false, error: 'Invalid product owner email or password.' },
        { status: 401 }
      );
    }

    systemLogger.info(
      'admin.auth',
      `Product owner [${email}] authenticated on admin.mindmittel.de`
    );

    const response = NextResponse.json({
      ok: true,
      owner: { email },
    });
    attachOwnerSessionCookie(response, email);
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Admin authentication failed',
      },
      { status: 400 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearSessionCookie(response, OWNER_SESSION_COOKIE);
  return response;
}
