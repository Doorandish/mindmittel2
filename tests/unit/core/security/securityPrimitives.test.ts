import { describe, it, expect } from 'vitest';
import { deriveKey, encryptSecret, decryptSecret } from '@/core/security/secretBox';
import { signSessionToken, verifySessionToken } from '@/core/security/sessionToken';
import { hashPassword, verifyPassword } from '@/core/security/passwordHash';
import { createFixedWindowRateLimiter } from '@/core/security/rateLimiter';

const MASTER = 'unit-test-master-secret-with-enough-entropy-123456';

describe('secretBox (AES-256-GCM)', () => {
  const key = deriveKey(MASTER, 'tenant-secrets');

  it('round-trips secrets and never returns plaintext in the ciphertext', () => {
    const uri = 'mongodb+srv://u:p@cluster/db';
    const token = encryptSecret(uri, key);
    expect(token.startsWith('v1:')).toBe(true);
    expect(token).not.toContain('cluster');
    expect(decryptSecret(token, key)).toBe(uri);
  });

  it('uses a random IV so equal plaintexts produce different ciphertexts', () => {
    expect(encryptSecret('same', key)).not.toBe(encryptSecret('same', key));
  });

  it('rejects tampered ciphertexts and wrong keys', () => {
    const token = encryptSecret('secret', key);
    const tampered = token.slice(0, -2) + (token.endsWith('A') ? 'BB' : 'AA');
    expect(() => decryptSecret(tampered, key)).toThrow();
    expect(() => decryptSecret(token, deriveKey(MASTER, 'other-purpose'))).toThrow();
  });
});

describe('sessionToken (HMAC-SHA256)', () => {
  const key = deriveKey(MASTER, 'session');
  const base = {
    kind: 'tenant' as const,
    sub: 'ali@bosch.de',
    name: 'Ali',
    department: 'Finance',
    role: 'executive' as const,
    tenant: 'bosch',
  };

  it('verifies a freshly signed token and returns its payload', () => {
    const now = 1_700_000_000_000;
    const token = signSessionToken(base, key, 3600, now);
    const payload = verifySessionToken(token, key, now + 1000);
    expect(payload?.sub).toBe('ali@bosch.de');
    expect(payload?.tenant).toBe('bosch');
  });

  it('rejects expired, tampered, and foreign-key tokens', () => {
    const now = 1_700_000_000_000;
    const token = signSessionToken(base, key, 60, now);
    expect(verifySessionToken(token, key, now + 61_000)).toBeNull();

    const [body, sig] = token.split('.');
    const forged = Buffer.from(
      JSON.stringify({ ...JSON.parse(Buffer.from(body, 'base64url').toString()), tenant: 'siemens' })
    ).toString('base64url');
    expect(verifySessionToken(`${forged}.${sig}`, key, now)).toBeNull();
    expect(verifySessionToken(token, deriveKey(MASTER, 'x'), now)).toBeNull();
    expect(verifySessionToken('garbage', key, now)).toBeNull();
  });
});

describe('passwordHash (scrypt)', () => {
  it('verifies the correct password and rejects others', () => {
    const stored = hashPassword('Correct.Horse-42');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(verifyPassword('Correct.Horse-42', stored)).toBe(true);
    expect(verifyPassword('wrong', stored)).toBe(false);
    expect(verifyPassword('x', 'malformed')).toBe(false);
  });
});

describe('fixed window rate limiter', () => {
  it('blocks after the limit and recovers after the window', () => {
    let now = 0;
    const limiter = createFixedWindowRateLimiter({ limit: 2, windowMs: 1000, now: () => now });
    expect(limiter.hit('k').allowed).toBe(true);
    expect(limiter.hit('k').allowed).toBe(true);
    const blocked = limiter.hit('k');
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
    expect(limiter.hit('other').allowed).toBe(true);
    now = 1001;
    expect(limiter.hit('k').allowed).toBe(true);
  });
});
