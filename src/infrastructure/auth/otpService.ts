import {
  buildOtpEmailContent,
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
import { sendSmtpEmail } from '@/infrastructure/email/smtpClient';

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
  deliveredVia: 'smtp';
  expiresAt: number;
}

/**
 * Issues a 6-digit OTP for `(tenantSlug, email)` and delivers it exclusively via Amazon SMTP (STARTTLS).
 * Never exposes the plaintext OTP in API responses.
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

  const emailFrom =
    process.env.EMAIL_FROM?.trim() ||
    'MindMittel Security <security@mindmittel.de>';
  const emailContent = buildOtpEmailContent({
    companyName: params.companyName,
    tenantSlug: params.tenantSlug,
    code,
  });

  try {
    await sendSmtpEmail({
      from: emailFrom,
      replyTo: 'security@mindmittel.de',
      to: params.email.trim().toLowerCase(),
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    systemLogger.info(
      'auth.otp',
      `Dispatched 6-digit OTP to [${params.email}] for tenant [${params.tenantSlug}] via Amazon SMTP`
    );

    return { deliveredVia: 'smtp', expiresAt };
  } catch (err) {
    systemLogger.error(
      'auth.otp',
      `Amazon SMTP OTP delivery failed for [${params.email}] on tenant [${params.tenantSlug}]`,
      {
        error: err instanceof Error ? err.message : 'Unknown SMTP error',
      }
    );
    throw new Error(
      'Failed to send verification code email via SMTP. Please try again or contact support.'
    );
  }
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
