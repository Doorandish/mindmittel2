import { z } from 'zod';

export const emailIdentityInputSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid corporate email address.'),
  fullName: z.string().trim().min(2).max(80).optional(),
  department: z.string().trim().min(2).max(60).optional(),
  role: z
    .enum(['admin', 'auditor', 'executive', 'viewer'])
    .optional()
    .default('executive'),
});

export interface AuthenticatedUserIdentity {
  email: string;
  fullName: string;
  department: string;
  role: 'admin' | 'auditor' | 'executive' | 'viewer';
  signedInAt: string;
}

/**
 * Validates and normalizes an email login request.
 * Derives a clean display name from the email prefix if `fullName` is omitted.
 */
export function validateEmailIdentity(input: {
  email: string;
  fullName?: string;
  department?: string;
  role?: 'admin' | 'auditor' | 'executive' | 'viewer';
}): AuthenticatedUserIdentity {
  const parsed = emailIdentityInputSchema.parse({
    email: input.email,
    fullName: input.fullName?.trim() || undefined,
    department: input.department?.trim() || undefined,
    role: input.role,
  });

  const derivedName =
    parsed.fullName ||
    parsed.email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

  return {
    email: parsed.email,
    fullName: derivedName,
    department: parsed.department ?? 'Executive Board',
    role: parsed.role,
    signedInAt: new Date().toISOString(),
  };
}

/**
 * Formats a concise human-readable attribution badge (e.g. "Amir Doorandish (amir.doorandish@mindmittel.de)").
 */
export function formatAttributionBadge(
  email?: string | null,
  fullName?: string | null
): string {
  const cleanEmail = (email ?? '').trim().toLowerCase();
  if (!cleanEmail) return 'system@mindmittel.ai';
  const cleanName = (fullName ?? '').trim();
  return cleanName ? `${cleanName} (${cleanEmail})` : cleanEmail;
}
