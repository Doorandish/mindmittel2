import {
  buildOtpScope,
  createMemoryOtpStore,
  issueOtpChallenge,
  verifyOtpChallenge,
  type OtpChallenge,
  type OtpStore,
  type OtpVerificationResult,
} from '@/core/auth/otp';
import { getOtpHashingKey } from '@/infrastructure/security/masterKey';
import { getControlPlaneDb } from '@/infrastructure/db/mongo';
import { COLLECTIONS } from '@/infrastructure/db/schemas';
import { systemLogger } from '@/infrastructure/logging/logger';

declare global {
  // eslint-disable-next-line no-var
  var __mindmittelOtpStore: OtpStore | undefined;
}

function getMemoryFallbackStore(): OtpStore {
  if (!globalThis.__mindmittelOtpStore) {
    globalThis.__mindmittelOtpStore = createMemoryOtpStore();
  }
  return globalThis.__mindmittelOtpStore;
}

function isMongoConfigured(): boolean {
  const uri = process.env.MONGODB_URI;
  return Boolean(
    uri && (uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://'))
  );
}

const hybridOtpStore: OtpStore = {
  async put(challenge: OtpChallenge) {
    await getMemoryFallbackStore().put(challenge);
    if (isMongoConfigured()) {
      try {
        const db = await getControlPlaneDb();
        await db
          .collection<OtpChallenge>(COLLECTIONS.OTP_CHALLENGES)
          .updateOne(
            { scope: challenge.scope },
            { $set: challenge },
            { upsert: true }
          );
      } catch {
        // Memory fallback holds the challenge
      }
    }
  },
  async get(scope: string) {
    if (isMongoConfigured()) {
      try {
        const db = await getControlPlaneDb();
        const doc = await db
          .collection<OtpChallenge>(COLLECTIONS.OTP_CHALLENGES)
          .findOne({ scope });
        if (doc) return doc;
      } catch {
        // Fallback
      }
    }
    return getMemoryFallbackStore().get(scope);
  },
  async setAttempts(scope: string, attempts: number) {
    await getMemoryFallbackStore().setAttempts(scope, attempts);
    if (isMongoConfigured()) {
      try {
        const db = await getControlPlaneDb();
        await db
          .collection<OtpChallenge>(COLLECTIONS.OTP_CHALLENGES)
          .updateOne({ scope }, { $set: { attempts } });
      } catch {
        // Fallback
      }
    }
  },
  async remove(scope: string) {
    await getMemoryFallbackStore().remove(scope);
    if (isMongoConfigured()) {
      try {
        const db = await getControlPlaneDb();
        await db
          .collection<OtpChallenge>(COLLECTIONS.OTP_CHALLENGES)
          .deleteOne({ scope });
      } catch {
        // Fallback
      }
    }
  },
};

export interface OtpDispatchResult {
  deliveredVia: 'resend' | 'webhook' | 'sandbox';
  expiresAt: number;
  sandboxCode?: string;
}

/**
 * Issues a 6-digit OTP for `(tenantSlug, email)` and delivers it via Resend API / HTTP webhook
 * when configured, or returns `sandboxCode` when running in sandbox/testing mode without an email provider.
 */
export async function issueAndSendTenantOtp(params: {
  tenantSlug: string;
  companyName: string;
  email: string;
}): Promise<OtpDispatchResult> {
  const scope = buildOtpScope(params.tenantSlug, params.email);
  const { code, expiresAt } = await issueOtpChallenge(hybridOtpStore, {
    scope,
    key: getOtpHashingKey(),
  });

  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const resendFrom =
    process.env.EMAIL_FROM?.trim() || 'MindMittel Security <onboarding@resend.dev>';

  if (resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [params.email.trim().toLowerCase()],
          subject: `${code} is your ${params.companyName} verification code — MindMittel`,
          html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px">
            <h2 style="margin:0 0 8px;color:#0f172a">${params.companyName} Workspace Sign-In</h2>
            <p style="color:#475569;font-size:14px">Enter the 6-digit verification code below to access <strong>${params.tenantSlug}.mindmittel.de</strong>:</p>
            <div style="font-size:32px;font-weight:800;letter-spacing:6px;padding:16px;text-align:center;background:#f8fafc;border-radius:12px;color:#1d4ed8;margin:16px 0">${code}</div>
            <p style="color:#64748b;font-size:12px">This code expires in 10 minutes.</p>
          </div>`,
        }),
      });
      if (response.ok) {
        systemLogger.info(
          'auth.otp',
          `Dispatched 6-digit OTP to [${params.email}] for tenant [${params.tenantSlug}] via Resend`
        );
        return { deliveredVia: 'resend', expiresAt };
      }
    } catch {
      // Fall through to sandbox fallback if email provider call fails
    }
  }

  systemLogger.info(
    'auth.otp',
    `Generated OTP [${code}] for [${params.email}] on tenant [${params.tenantSlug}] (sandbox mode — set RESEND_API_KEY for live email delivery)`
  );

  return {
    deliveredVia: 'sandbox',
    expiresAt,
    sandboxCode: code,
  };
}

export async function verifyTenantOtp(params: {
  tenantSlug: string;
  email: string;
  code: string;
}): Promise<OtpVerificationResult> {
  const scope = buildOtpScope(params.tenantSlug, params.email);
  return verifyOtpChallenge(hybridOtpStore, {
    scope,
    code: params.code,
    key: getOtpHashingKey(),
  });
}
