import { getTenantContext } from './tenantContext';

/**
 * Returns the active tenant's dedicated Gemini API key when configured,
 * falling back to the server-level `GEMINI_API_KEY` environment variable.
 */
export function resolveGeminiApiKey(explicitKey?: string): string {
  if (explicitKey && explicitKey.trim()) return explicitKey.trim();
  const tenantKey = getTenantContext()?.tenant.geminiApiKey;
  if (tenantKey && tenantKey.trim()) return tenantKey.trim();
  return process.env.GEMINI_API_KEY?.trim() ?? '';
}
