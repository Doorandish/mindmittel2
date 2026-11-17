import crypto from 'crypto';
import { deriveKey } from '@/core/security/secretBox';

const DEFAULT_MASTER_FALLBACK =
  'mindmittel-v2-master-secret-fallback-9aed46d8-change-in-production';

export const DEFAULT_OWNER_EMAIL = 'amir.doorandish@gmail.com';
const DEFAULT_OWNER_PASSWORD = 'Amir.13659684';

function getMasterSecretMaterial(): string {
  return (
    process.env.MASTER_ENCRYPTION_KEY?.trim() ||
    process.env.SYSTEM_DASHBOARD_TOKEN?.trim() ||
    process.env.MONGODB_URI?.trim() ||
    DEFAULT_MASTER_FALLBACK
  );
}

export function getTenantSecretKey(): Buffer {
  return deriveKey(getMasterSecretMaterial(), 'tenant-secrets');
}

export function getSessionSigningKey(): Buffer {
  return deriveKey(getMasterSecretMaterial(), 'session-tokens');
}

export function getOtpHashingKey(): Buffer {
  return deriveKey(getMasterSecretMaterial(), 'otp-challenges');
}

export function verifyOwnerCredentials(email: string, password: string): boolean {
  const expectedEmail = (
    process.env.SUPER_ADMIN_EMAIL?.trim() || DEFAULT_OWNER_EMAIL
  ).toLowerCase();
  const expectedPassword =
    process.env.SUPER_ADMIN_PASSWORD?.trim() || DEFAULT_OWNER_PASSWORD;

  const cleanEmail = email.trim().toLowerCase();
  if (cleanEmail !== expectedEmail) return false;

  const a = Buffer.from(password, 'utf8');
  const b = Buffer.from(expectedPassword, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
