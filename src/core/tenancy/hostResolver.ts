/**
 * Host -> zone resolution for subdomain multi-tenancy.
 * Pure and dependency-free so it can run inside the Edge middleware.
 *
 *   mindmittel.de / www.mindmittel.de  -> marketing (sales landing)
 *   admin.mindmittel.de                -> admin (product owner console)
 *   <slug>.mindmittel.de               -> tenant workspace (incl. demo)
 */

export type HostZone =
  | { zone: 'marketing' }
  | { zone: 'admin' }
  | { zone: 'tenant'; slug: string };

export const DEFAULT_ROOT_DOMAIN = 'mindmittel.de';

/** Subdomains that can never be claimed by a customer tenant. */
export const RESERVED_SUBDOMAINS: readonly string[] = [
  'www',
  'admin',
  'api',
  'app',
  'mail',
  'smtp',
  'static',
  'assets',
  'status',
  'system',
  'marketing',
];

const LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/;
const DEV_ROOTS = ['localhost', '127.0.0.1'];

export function normalizeHost(rawHost: string | null | undefined): string {
  if (!rawHost) return '';
  return rawHost.trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

function extractPort(rawHost: string): string {
  const match = rawHost.trim().match(/:(\d+)$/);
  return match ? `:${match[1]}` : '';
}

/** Returns the single subdomain label under `root`, '' for the apex, or null if not under root. */
function subdomainUnder(host: string, root: string): string | null {
  if (host === root) return '';
  if (host.endsWith(`.${root}`)) return host.slice(0, -(root.length + 1));
  return null;
}

function findRoot(host: string, rootDomain: string): string | null {
  for (const root of [rootDomain, ...DEV_ROOTS]) {
    if (subdomainUnder(host, root) !== null) return root;
  }
  return null;
}

export function resolveHostZone(
  rawHost: string | null | undefined,
  rootDomain: string = DEFAULT_ROOT_DOMAIN
): HostZone {
  const host = normalizeHost(rawHost);
  const root = findRoot(host, rootDomain.toLowerCase());
  if (!root) return { zone: 'marketing' };

  const label = subdomainUnder(host, root) ?? '';
  if (label === '' || label === 'www') return { zone: 'marketing' };
  if (label === 'admin') return { zone: 'admin' };
  if (label.includes('.') || !LABEL_PATTERN.test(label)) return { zone: 'marketing' };
  if (RESERVED_SUBDOMAINS.includes(label)) return { zone: 'marketing' };

  return { zone: 'tenant', slug: label };
}

/**
 * Builds an absolute URL for a sibling zone (e.g. demo, admin, or apex when `slug` is null)
 * based on the host the user is currently on, preserving the dev port on localhost.
 */
export function buildZoneUrl(
  slug: string | null,
  currentRawHost: string,
  protocol: string,
  rootDomain: string = DEFAULT_ROOT_DOMAIN
): string {
  const host = normalizeHost(currentRawHost);
  const root = findRoot(host, rootDomain.toLowerCase()) ?? rootDomain.toLowerCase();
  const port = DEV_ROOTS.includes(root) ? extractPort(currentRawHost) : '';
  const scheme = protocol.endsWith(':') ? protocol : `${protocol}:`;
  return `${scheme}//${slug ? `${slug}.` : ''}${root}${port}`;
}
