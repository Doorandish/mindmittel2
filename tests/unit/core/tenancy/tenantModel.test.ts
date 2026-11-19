import { describe, it, expect } from 'vitest';
import {
  isValidTenantSlug,
  deriveTenantDbName,
  buildTenantConnectionString,
  maskConnectionString,
  normalizeEmailDomains,
  isEmailAllowedForTenant,
  parseOptionalLogoDataUrl,
  parseTenantInput,
  DEMO_TENANT,
} from '@/core/tenancy/tenantModel';

describe('tenant slug rules', () => {
  it('accepts lowercase DNS-safe slugs', () => {
    expect(isValidTenantSlug('bosch')).toBe(true);
    expect(isValidTenantSlug('acme-gmbh')).toBe(true);
    expect(isValidTenantSlug('a1')).toBe(true);
  });

  it('rejects reserved, builtin, uppercase, and malformed slugs', () => {
    for (const bad of ['admin', 'www', 'api', 'demo', 'Bosch', '-x', 'x-', 'a_b', '', 'a'.repeat(40)]) {
      expect(isValidTenantSlug(bad)).toBe(false);
    }
  });
});

describe('tenant database naming', () => {
  it('derives a dedicated database name from the subdomain', () => {
    expect(deriveTenantDbName('bosch')).toBe('mindmittel_bosch');
    expect(deriveTenantDbName('acme-gmbh')).toBe('mindmittel_acme_gmbh');
  });

  it('injects the tenant database into the base connection string and keeps query params', () => {
    const base = 'mongodb+srv://user:pw@cluster0.abc.mongodb.net/mindmittel2?appName=Doorandish';
    expect(buildTenantConnectionString(base, 'mindmittel_bosch')).toBe(
      'mongodb+srv://user:pw@cluster0.abc.mongodb.net/mindmittel_bosch?appName=Doorandish'
    );
    expect(buildTenantConnectionString('mongodb://h:27017', 'mindmittel_x')).toBe(
      'mongodb://h:27017/mindmittel_x'
    );
  });

  it('masks passwords before connection strings are shown in the admin console', () => {
    expect(maskConnectionString('mongodb+srv://user:secret@cluster0.net/db?x=1')).toBe(
      'mongodb+srv://user:****@cluster0.net/db?x=1'
    );
    expect(maskConnectionString('mongodb://h:27017/db')).toBe('mongodb://h:27017/db');
  });
});

describe('corporate email gate', () => {
  it('normalizes domain lists from comma separated input', () => {
    expect(normalizeEmailDomains(' @Bosch.de, bosch.com ,bosch.de')).toEqual(['bosch.de', 'bosch.com']);
  });

  it('allows only exact domain matches or explicitly whitelisted addresses', () => {
    const policy = { allowedEmailDomains: ['bosch.de'], allowedEmails: ['owner@gmail.com'] };
    expect(isEmailAllowedForTenant('ali@bosch.de', policy)).toBe(true);
    expect(isEmailAllowedForTenant('ALI@Bosch.DE', policy)).toBe(true);
    expect(isEmailAllowedForTenant('owner@gmail.com', policy)).toBe(true);
    expect(isEmailAllowedForTenant('ali@evil-bosch.de', policy)).toBe(false);
    expect(isEmailAllowedForTenant('ali@bosch.de.evil.com', policy)).toBe(false);
    expect(isEmailAllowedForTenant('someone@gmail.com', policy)).toBe(false);
    expect(isEmailAllowedForTenant('not-an-email', policy)).toBe(false);
  });
});

describe('parseTenantInput', () => {
  it('produces a normalized tenant definition with a default database name', () => {
    const parsed = parseTenantInput({
      slug: 'bosch',
      companyName: 'Robert Bosch GmbH',
      allowedEmailDomains: 'bosch.de',
    });
    expect(parsed.slug).toBe('bosch');
    expect(parsed.dbName).toBe('mindmittel_bosch');
    expect(parsed.allowedEmailDomains).toEqual(['bosch.de']);
    expect(parsed.status).toBe('active');
  });

  it('rejects public free-mail domains to prevent cross-company data leakage', () => {
    expect(() =>
      parseTenantInput({ slug: 'acme', companyName: 'Acme', allowedEmailDomains: 'gmail.com' })
    ).toThrow(/public email provider/i);
  });

  it('requires at least one allowed domain or explicit email', () => {
    expect(() => parseTenantInput({ slug: 'acme', companyName: 'Acme' })).toThrow();
    const parsed = parseTenantInput({
      slug: 'acme',
      companyName: 'Acme',
      allowedEmails: 'owner@gmail.com',
    });
    expect(parsed.allowedEmails).toEqual(['owner@gmail.com']);
  });

  it('rejects invalid custom MongoDB connection strings', () => {
    expect(() =>
      parseTenantInput({
        slug: 'acme',
        companyName: 'Acme',
        allowedEmailDomains: 'acme.de',
        mongoUri: 'postgres://nope',
      })
    ).toThrow();
  });
});

describe('DEMO_TENANT', () => {
  it('is an open-access demo with its own database and seeded sample policies', () => {
    expect(DEMO_TENANT.slug).toBe('demo');
    expect(DEMO_TENANT.dbName).toBe('mindmittel_demo');
    expect(DEMO_TENANT.authMode).toBe('open');
    expect(DEMO_TENANT.seedSamplePolicies).toBe(true);
    expect(DEMO_TENANT.isDemo).toBe(true);
  });
});

describe('tenant company logo validation (XSS & size safety)', () => {
  it('accepts safe PNG, JPEG, and WEBP base64 data URIs and rejects SVG or oversized payloads', () => {
    const validPng =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    expect(parseOptionalLogoDataUrl(validPng)).toBe(validPng);
    expect(parseOptionalLogoDataUrl('')).toBeNull();
    expect(parseOptionalLogoDataUrl(null)).toBeNull();

    // Reject SVG (XSS risk)
    expect(() =>
      parseOptionalLogoDataUrl('data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Pjwvc2NyaXB0Pjwvc3ZnPg==')
    ).toThrow(/PNG, JPEG, or WEBP/i);

    // Reject arbitrary URLs / javascript schemes
    expect(() => parseOptionalLogoDataUrl('https://evil.com/logo.png')).toThrow();
    expect(() => parseOptionalLogoDataUrl('javascript:alert(1)')).toThrow();

    // Reject oversized (> 350,000 chars)
    const oversized = `data:image/png;base64,${'A'.repeat(360_000)}`;
    expect(() => parseOptionalLogoDataUrl(oversized)).toThrow(/too large/i);
  });
});
