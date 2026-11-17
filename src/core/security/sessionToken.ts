import crypto from 'crypto';

export type SessionRole = 'admin' | 'auditor' | 'executive' | 'viewer';

export interface SessionPayload {
  v: 1;
  /** `tenant` = workspace user, `owner` = product owner (admin console). */
  kind: 'tenant' | 'owner';
  sub: string;
  name: string;
  department: string;
  role: SessionRole;
  /** Tenant slug the session is bound to (`__owner__` for the admin console). */
  tenant: string;
  iat: number;
  exp: number;
}

export type SessionClaims = Omit<SessionPayload, 'v' | 'iat' | 'exp' | 'kind'> & {
  kind: 'tenant' | 'owner' | 'admin';
};

function sign(body: string, key: Buffer): string {
  return crypto.createHmac('sha256', key).update(body).digest('base64url');
}

export function signSessionToken(
  claims: SessionClaims,
  key: Buffer,
  ttlSeconds: number,
  now: number = Date.now()
): string {
  const iat = Math.floor(now / 1000);
  const payload: SessionPayload = {
    v: 1,
    kind: claims.kind === 'tenant' ? 'tenant' : 'owner',
    sub: claims.sub,
    name: claims.name,
    department: claims.department,
    role: claims.role,
    tenant: claims.tenant,
    iat,
    exp: iat + ttlSeconds,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body, key)}`;
}

export function verifySessionToken(
  token: string | null | undefined,
  key: Buffer,
  now: number = Date.now()
): SessionPayload | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, signature] = parts;

  const expected = Buffer.from(sign(body, key));
  const provided = Buffer.from(signature);
  if (expected.length !== provided.length || !crypto.timingSafeEqual(expected, provided)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.v !== 1 || typeof payload.exp !== 'number') return null;
    if (Math.floor(now / 1000) >= payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
