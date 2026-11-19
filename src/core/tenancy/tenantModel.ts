import { z } from 'zod';
import { RESERVED_SUBDOMAINS } from './hostResolver';

export type TenantStatus = 'active' | 'suspended';
export type TenantAuthMode = 'otp' | 'open';

/** Fully resolved tenant (secrets decrypted). Never sent to the browser. */
export interface ResolvedTenant {
  slug: string;
  companyName: string;
  allowedEmailDomains: string[];
  allowedEmails: string[];
  adminEmails: string[];
  status: TenantStatus;
  dbName: string;
  mongoUri: string | null;
  geminiApiKey: string | null;
  authMode: TenantAuthMode;
  seedSamplePolicies: boolean;
  isDemo: boolean;
}

export const DEMO_TENANT_SLUG = 'demo';

export const DEMO_TENANT: ResolvedTenant = Object.freeze({
  slug: DEMO_TENANT_SLUG,
  companyName: 'MindMittel Live Demo',
  allowedEmailDomains: [],
  allowedEmails: [],
  adminEmails: [],
  status: 'active',
  dbName: 'mindmittel_demo',
  mongoUri: null,
  geminiApiKey: null,
  authMode: 'open',
  seedSamplePolicies: true,
  isDemo: true,
}) as ResolvedTenant;

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;

/** Free-mail providers are never accepted as a company domain (anyone could register there). */
export const PUBLIC_EMAIL_DOMAINS: readonly string[] = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.de',
  'outlook.com',
  'outlook.de',
  'hotmail.com',
  'hotmail.de',
  'live.com',
  'live.de',
  'icloud.com',
  'me.com',
  'aol.com',
  'gmx.de',
  'gmx.net',
  'gmx.com',
  'web.de',
  't-online.de',
  'freenet.de',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'yandex.com',
];

const DOMAIN_PATTERN = /^(?=.{3,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

export function isValidTenantSlug(slug: string): boolean {
  return (
    SLUG_PATTERN.test(slug) &&
    !RESERVED_SUBDOMAINS.includes(slug) &&
    slug !== DEMO_TENANT_SLUG
  );
}

export function deriveTenantDbName(slug: string): string {
  return `mindmittel_${slug.replace(/-/g, '_')}`;
}

/** Replaces (or appends) the database path segment of a MongoDB URI, keeping query params. */
export function buildTenantConnectionString(baseUri: string, dbName: string): string {
  const match = baseUri.match(/^(mongodb(?:\+srv)?:\/\/[^/?]+)(?:\/[^?]*)?(\?.*)?$/);
  if (!match) return baseUri;
  return `${match[1]}/${dbName}${match[2] ?? ''}`;
}

export function maskConnectionString(uri: string): string {
  return uri.replace(/^(mongodb(?:\+srv)?:\/\/[^:/@]+):[^@]+@/, '$1:****@');
}

export function maskSecretTail(secret: string): string {
  const tail = secret.slice(-4);
  return `••••${tail}`;
}

function splitList(input: string[] | string | undefined): string[] {
  if (!input) return [];
  const raw = Array.isArray(input) ? input : input.split(/[,;\s]+/);
  return raw.map((s) => s.trim()).filter(Boolean);
}

export function normalizeEmailDomains(input: string[] | string | undefined): string[] {
  const out: string[] = [];
  for (const item of splitList(input)) {
    const domain = item.replace(/^@/, '').toLowerCase();
    if (!out.includes(domain)) out.push(domain);
  }
  return out;
}

export function normalizeEmailList(input: string[] | string | undefined): string[] {
  const out: string[] = [];
  for (const item of splitList(input)) {
    const email = item.toLowerCase();
    if (!out.includes(email)) out.push(email);
  }
  return out;
}

export function isEmailAllowedForTenant(
  rawEmail: string,
  policy: {
    allowedEmailDomains: string[];
    allowedEmails: string[];
    adminEmails?: string[];
  }
): boolean {
  const email = rawEmail.trim().toLowerCase();
  const parsed = z.string().email().safeParse(email);
  if (!parsed.success) return false;
  if (policy.allowedEmails.includes(email)) return true;
  if ((policy.adminEmails ?? []).includes(email)) return true;
  const domain = email.slice(email.lastIndexOf('@') + 1);
  return policy.allowedEmailDomains.includes(domain);
}

const mongoUriSchema = z
  .string()
  .trim()
  .refine((v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'), {
    message: 'Connection string must start with mongodb:// or mongodb+srv://',
  });

const dbNameSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{1,63}$/, 'Database name may only contain letters, digits, _ and -');

export interface TenantInputRaw {
  slug?: string;
  companyName?: string;
  allowedEmailDomains?: string[] | string;
  allowedEmails?: string[] | string;
  adminEmails?: string[] | string;
  status?: TenantStatus;
  dbName?: string;
  mongoUri?: string | null;
  geminiApiKey?: string | null;
}

export interface ParsedTenantInput {
  slug: string;
  companyName: string;
  allowedEmailDomains: string[];
  allowedEmails: string[];
  adminEmails: string[];
  status: TenantStatus;
  dbName: string;
  mongoUri: string | null;
  geminiApiKey: string | null;
}

function validateDomains(domains: string[]): void {
  for (const d of domains) {
    if (!DOMAIN_PATTERN.test(d)) {
      throw new Error(`Invalid email domain: "${d}"`);
    }
    if (PUBLIC_EMAIL_DOMAINS.includes(d)) {
      throw new Error(
        `"${d}" is a public email provider and cannot be used as a company domain. Add individual addresses to "allowed emails" instead.`
      );
    }
  }
}

function validateEmails(emails: string[]): void {
  for (const e of emails) {
    if (!z.string().email().safeParse(e).success) {
      throw new Error(`Invalid email address: "${e}"`);
    }
  }
}

/** Validates the access-policy part of a tenant (shared by create & update). */
export function parseAccessPolicy(raw: {
  allowedEmailDomains?: string[] | string;
  allowedEmails?: string[] | string;
  adminEmails?: string[] | string;
}): {
  allowedEmailDomains: string[];
  allowedEmails: string[];
  adminEmails: string[];
} {
  const allowedEmailDomains = normalizeEmailDomains(raw.allowedEmailDomains);
  const allowedEmails = normalizeEmailList(raw.allowedEmails);
  const adminEmails = normalizeEmailList(raw.adminEmails);
  validateDomains(allowedEmailDomains);
  validateEmails(allowedEmails);
  validateEmails(adminEmails);
  if (
    allowedEmailDomains.length === 0 &&
    allowedEmails.length === 0 &&
    adminEmails.length === 0
  ) {
    throw new Error(
      'At least one allowed company email domain, admin email, or email address is required.'
    );
  }
  return { allowedEmailDomains, allowedEmails, adminEmails };
}

export function parseOptionalMongoUri(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value.trim() === '') return null;
  return mongoUriSchema.parse(value);
}

export function parseOptionalDbName(value: string | undefined, slug: string): string {
  if (!value || value.trim() === '') return deriveTenantDbName(slug);
  return dbNameSchema.parse(value);
}

export function parseCompanyName(value: string | undefined): string {
  return z.string().trim().min(2, 'Company name is required').max(120).parse(value ?? '');
}

export function parseTenantInput(raw: TenantInputRaw): ParsedTenantInput {
  const slug = (raw.slug ?? '').trim().toLowerCase();
  if (!isValidTenantSlug(slug)) {
    throw new Error(
      `Invalid subdomain "${slug}". Use 2-32 lowercase letters, digits or hyphens; reserved names are not allowed.`
    );
  }

  const policy = parseAccessPolicy(raw);
  const geminiApiKey = raw.geminiApiKey?.trim() ? raw.geminiApiKey.trim() : null;

  return {
    slug,
    companyName: parseCompanyName(raw.companyName),
    ...policy,
    status: raw.status === 'suspended' ? 'suspended' : 'active',
    dbName: parseOptionalDbName(raw.dbName, slug),
    mongoUri: parseOptionalMongoUri(raw.mongoUri),
    geminiApiKey,
  };
}
