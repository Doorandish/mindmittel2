import { NextRequest, NextResponse } from 'next/server';
import { upsertAuthenticatedUser } from '@/infrastructure/rag/brainRepository';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
      department?: string;
      role?: 'admin' | 'auditor' | 'executive' | 'viewer';
    };

    if (!body.email?.trim()) {
      return NextResponse.json(
        { ok: false, error: 'A valid corporate email address is required.' },
        { status: 400 }
      );
    }

    const user = await upsertAuthenticatedUser({
      email: body.email,
      fullName: body.fullName,
      department: body.department,
      role: body.role,
    });

    return NextResponse.json({
      ok: true,
      user,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : 'Authentication failed',
      },
      { status: 400 }
    );
  }
}
