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

export function buildOtpEmailContent(params: {
  companyName: string;
  tenantSlug: string;
  code: string;
}): { subject: string; text: string; html: string } {
  const host = `${params.tenantSlug}.mindmittel.de`;
  const subject = `Your MindMittel Sign-In Code for ${params.companyName}`;
  const text = [
    `${params.companyName} Workspace Sign-In`,
    '',
    `Use the 6-digit verification code below to access ${host}:`,
    '',
    `Code: ${params.code}`,
    '',
    'This code expires in 10 minutes. If you did not request this login, you can safely ignore this message.',
  ].join('\n');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:24px;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
  <div style="max-width:480px;margin:0 auto;padding:24px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;">
    <h2 style="margin:0 0 12px 0;font-size:18px;color:#0f172a;">${params.companyName} Workspace Sign-In</h2>
    <p style="margin:0 0 16px 0;font-size:14px;line-height:1.5;color:#475569;">
      Use the 6-digit verification code below to access <strong>${host}</strong>:
    </p>
    <div style="font-size:30px;font-weight:700;letter-spacing:6px;padding:14px;text-align:center;background-color:#f1f5f9;border-radius:8px;color:#1d4ed8;margin:16px 0;">
      ${params.code}
    </div>
    <p style="margin:16px 0 0 0;font-size:12px;line-height:1.5;color:#64748b;">
      This code expires in 10 minutes. If you did not request this login, you can safely ignore this email.
    </p>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
