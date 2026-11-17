import crypto from 'crypto';

export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export interface OtpChallenge {
  scope: string;
  codeHash: string;
  expiresAt: number;
  attempts: number;
}

/** Persistence port so the challenge can live in memory (tests) or MongoDB (production). */
export interface OtpStore {
  put(challenge: OtpChallenge): Promise<void>;
  get(scope: string): Promise<OtpChallenge | null>;
  setAttempts(scope: string, attempts: number): Promise<void>;
  remove(scope: string): Promise<void>;
}

export type OtpVerificationResult = 'ok' | 'invalid' | 'expired' | 'locked' | 'missing';

export function generateOtpCode(): string {
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function buildOtpScope(tenantSlug: string, email: string): string {
  return `${tenantSlug}:${email.trim().toLowerCase()}`;
}

export function hashOtpCode(code: string, key: Buffer, scope: string): string {
  return crypto.createHmac('sha256', key).update(`${scope}|${code}`).digest('base64url');
}

export function createMemoryOtpStore(): OtpStore {
  const map = new Map<string, OtpChallenge>();
  return {
    async put(challenge) {
      map.set(challenge.scope, { ...challenge });
    },
    async get(scope) {
      const found = map.get(scope);
      return found ? { ...found } : null;
    },
    async setAttempts(scope, attempts) {
      const found = map.get(scope);
      if (found) found.attempts = attempts;
    },
    async remove(scope) {
      map.delete(scope);
    },
  };
}

export async function issueOtpChallenge(
  store: OtpStore,
  params: { scope: string; key: Buffer; now?: number }
): Promise<{ code: string; expiresAt: number }> {
  const now = params.now ?? Date.now();
  const code = generateOtpCode();
  const expiresAt = now + OTP_TTL_MS;
  await store.put({
    scope: params.scope,
    codeHash: hashOtpCode(code, params.key, params.scope),
    expiresAt,
    attempts: 0,
  });
  return { code, expiresAt };
}

export async function verifyOtpChallenge(
  store: OtpStore,
  params: { scope: string; code: string; key: Buffer; now?: number }
): Promise<OtpVerificationResult> {
  const now = params.now ?? Date.now();
  const challenge = await store.get(params.scope);
  if (!challenge) return 'missing';

  if (now > challenge.expiresAt) {
    await store.remove(params.scope);
    return 'expired';
  }
  if (challenge.attempts >= OTP_MAX_ATTEMPTS) return 'locked';

  const expected = Buffer.from(challenge.codeHash);
  const provided = Buffer.from(hashOtpCode(params.code.trim(), params.key, params.scope));
  const matches = expected.length === provided.length && crypto.timingSafeEqual(expected, provided);

  if (!matches) {
    await store.setAttempts(params.scope, challenge.attempts + 1);
    return 'invalid';
  }

  await store.remove(params.scope);
  return 'ok';
}
