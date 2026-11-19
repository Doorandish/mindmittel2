import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import {
  generateOtpCode,
  buildOtpScope,
  buildOtpEmailContent,
  createMemoryOtpStore,
  issueOtpChallenge,
  verifyOtpChallenge,
  OTP_MAX_ATTEMPTS,
  OTP_TTL_MS,
} from '@/core/auth/otp';
import { deriveKey } from '@/core/security/secretBox';
import { isProtectedDemoDocument } from '@/core/demo/demoPolicy';

const key = deriveKey('unit-test-master-secret-with-enough-entropy-123456', 'otp');

describe('OTP generation', () => {
  it('always produces a 6 digit numeric code', () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtpCode()).toMatch(/^\d{6}$/);
    }
  });

  it('scopes challenges per tenant and normalized email', () => {
    expect(buildOtpScope('bosch', ' Ali@Bosch.DE ')).toBe('bosch:ali@bosch.de');
  });
});

describe('OTP challenge lifecycle', () => {
  it('accepts the correct code once and then consumes the challenge', async () => {
    const store = createMemoryOtpStore();
    const scope = buildOtpScope('bosch', 'ali@bosch.de');
    const { code } = await issueOtpChallenge(store, { scope, key, now: 0 });
    expect(await verifyOtpChallenge(store, { scope, code, key, now: 1000 })).toBe('ok');
    expect(await verifyOtpChallenge(store, { scope, code, key, now: 2000 })).toBe('missing');
  });

  it('does not store the plaintext code', async () => {
    const store = createMemoryOtpStore();
    const scope = 'bosch:ali@bosch.de';
    const { code } = await issueOtpChallenge(store, { scope, key, now: 0 });
    const stored = await store.get(scope);
    expect(JSON.stringify(stored)).not.toContain(code);
  });

  it('rejects a code issued for another tenant scope', async () => {
    const store = createMemoryOtpStore();
    const { code } = await issueOtpChallenge(store, { scope: 'bosch:ali@bosch.de', key, now: 0 });
    expect(
      await verifyOtpChallenge(store, { scope: 'siemens:ali@bosch.de', code, key, now: 10 })
    ).toBe('missing');
  });

  it('expires after the TTL', async () => {
    const store = createMemoryOtpStore();
    const scope = 'bosch:ali@bosch.de';
    const { code } = await issueOtpChallenge(store, { scope, key, now: 0 });
    expect(await verifyOtpChallenge(store, { scope, code, key, now: OTP_TTL_MS + 1 })).toBe('expired');
  });

  it('locks the challenge after too many wrong attempts', async () => {
    const store = createMemoryOtpStore();
    const scope = 'bosch:ali@bosch.de';
    const { code } = await issueOtpChallenge(store, { scope, key, now: 0 });
    const wrong = code === '000000' ? '111111' : '000000';
    for (let i = 0; i < OTP_MAX_ATTEMPTS; i += 1) {
      expect(await verifyOtpChallenge(store, { scope, code: wrong, key, now: 10 })).toBe('invalid');
    }
    expect(await verifyOtpChallenge(store, { scope, code, key, now: 20 })).toBe('locked');
  });
});

describe('demo document protection', () => {
  it('protects seeded governance-board documents from deletion in the public demo', () => {
    expect(isProtectedDemoDocument({ createdByEmail: 'governance-board@mindmittel.de' })).toBe(true);
    expect(isProtectedDemoDocument({ createdByEmail: 'guest-1@demo.mindmittel.de' })).toBe(false);
    expect(isProtectedDemoDocument({})).toBe(false);
  });
});

describe('OTP email formatting (anti-spam compliance)', () => {
  it('includes a clean subject without leading digits, a full HTML document, and a plain-text body', () => {
    const email = buildOtpEmailContent({
      companyName: 'HS Ansbach',
      tenantSlug: 'hsansbach',
      code: '764608',
    });

    expect(email.subject).not.toMatch(/^\d/);
    expect(email.subject).toContain('HS Ansbach');
    expect(email.html).toContain('<!DOCTYPE html>');
    expect(email.html).toContain('<html>');
    expect(email.html).toContain('764608');
    expect(email.text).toContain('764608');
    expect(email.text).toContain('hsansbach.mindmittel.de');
  });

  it('uses Amazon SMTP exclusively with zero Resend code and never renders sandbox OTP codes on the login screen', () => {
    const repoRoot = process.cwd();
    const otpServiceSource = fs.readFileSync(
      path.join(repoRoot, 'src/infrastructure/auth/otpService.ts'),
      'utf8'
    );
    const otpRequestRouteSource = fs.readFileSync(
      path.join(repoRoot, 'src/app/api/auth/otp/request/route.ts'),
      'utf8'
    );
    const pageSource = fs.readFileSync(
      path.join(repoRoot, 'src/app/page.tsx'),
      'utf8'
    );
    const smtpClientPath = path.join(
      repoRoot,
      'src/infrastructure/email/smtpClient.ts'
    );

    expect(fs.existsSync(smtpClientPath)).toBe(true);
    expect(otpServiceSource.toLowerCase()).not.toContain('resend');
    expect(otpServiceSource).not.toContain('sandboxCode');
    expect(otpRequestRouteSource).not.toContain('sandboxCode');
    expect(pageSource).not.toContain('sandboxOtpCode');
    expect(pageSource).not.toContain('sandboxCode');
  });
});
