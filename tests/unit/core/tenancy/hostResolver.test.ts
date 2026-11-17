import { describe, it, expect } from 'vitest';
import {
  normalizeHost,
  resolveHostZone,
  buildZoneUrl,
} from '@/core/tenancy/hostResolver';
import { routeRequestForZone } from '@/core/tenancy/zoneRouting';

const ROOT = 'mindmittel.de';

describe('normalizeHost', () => {
  it('lowercases, strips port and trailing dot', () => {
    expect(normalizeHost('Bosch.MindMittel.de:443')).toBe('bosch.mindmittel.de');
    expect(normalizeHost('mindmittel.de.')).toBe('mindmittel.de');
    expect(normalizeHost(null)).toBe('');
  });
});

describe('resolveHostZone', () => {
  it('maps apex and www to the marketing zone', () => {
    expect(resolveHostZone('mindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
    expect(resolveHostZone('www.mindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
  });

  it('maps admin subdomain to the admin zone', () => {
    expect(resolveHostZone('admin.mindmittel.de', ROOT)).toEqual({ zone: 'admin' });
    expect(resolveHostZone('admin.localhost:3000', ROOT)).toEqual({ zone: 'admin' });
  });

  it('maps demo and company subdomains to the tenant zone', () => {
    expect(resolveHostZone('demo.mindmittel.de', ROOT)).toEqual({ zone: 'tenant', slug: 'demo' });
    expect(resolveHostZone('bosch.mindmittel.de', ROOT)).toEqual({ zone: 'tenant', slug: 'bosch' });
    expect(resolveHostZone('acme-gmbh.localhost:3000', ROOT)).toEqual({
      zone: 'tenant',
      slug: 'acme-gmbh',
    });
  });

  it('treats localhost and unrelated hosts (e.g. herokuapp) as marketing', () => {
    expect(resolveHostZone('localhost:3000', ROOT)).toEqual({ zone: 'marketing' });
    expect(resolveHostZone('mindmittel-abc.herokuapp.com', ROOT)).toEqual({ zone: 'marketing' });
  });

  it('never resolves reserved, nested, or malformed labels to a tenant', () => {
    expect(resolveHostZone('api.mindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
    expect(resolveHostZone('a.b.mindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
    expect(resolveHostZone('-bad.mindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
    expect(resolveHostZone('evilmindmittel.de', ROOT)).toEqual({ zone: 'marketing' });
  });
});

describe('buildZoneUrl', () => {
  it('builds subdomain URLs relative to the production root domain', () => {
    expect(buildZoneUrl('demo', 'mindmittel.de', 'https:', ROOT)).toBe('https://demo.mindmittel.de');
    expect(buildZoneUrl('bosch', 'www.mindmittel.de', 'https:', ROOT)).toBe(
      'https://bosch.mindmittel.de'
    );
    expect(buildZoneUrl(null, 'admin.mindmittel.de', 'https:', ROOT)).toBe('https://mindmittel.de');
  });

  it('builds subdomain URLs on localhost while preserving the dev port', () => {
    expect(buildZoneUrl('demo', 'localhost:3000', 'http:', ROOT)).toBe('http://demo.localhost:3000');
    expect(buildZoneUrl('admin', 'bosch.localhost:3000', 'http:', ROOT)).toBe(
      'http://admin.localhost:3000'
    );
  });
});

describe('routeRequestForZone', () => {
  it('rewrites the marketing root to /marketing and blocks workspace APIs', () => {
    expect(routeRequestForZone({ zone: 'marketing' }, '/')).toEqual({
      action: 'rewrite',
      path: '/marketing',
    });
    expect(routeRequestForZone({ zone: 'marketing' }, '/api/brain/documents')).toEqual({
      action: 'notFound',
    });
    expect(routeRequestForZone({ zone: 'marketing' }, '/admin')).toEqual({ action: 'notFound' });
    expect(routeRequestForZone({ zone: 'marketing' }, '/api/health')).toEqual({ action: 'next' });
  });

  it('rewrites the admin root to /admin and only exposes admin APIs there', () => {
    expect(routeRequestForZone({ zone: 'admin' }, '/')).toEqual({ action: 'rewrite', path: '/admin' });
    expect(routeRequestForZone({ zone: 'admin' }, '/api/admin/tenants')).toEqual({ action: 'next' });
    expect(routeRequestForZone({ zone: 'admin' }, '/system')).toEqual({ action: 'next' });
    expect(routeRequestForZone({ zone: 'admin' }, '/api/brain/documents')).toEqual({
      action: 'notFound',
    });
  });

  it('serves the workspace on tenant hosts and hides admin and marketing surfaces', () => {
    const tenant = { zone: 'tenant' as const, slug: 'bosch' };
    expect(routeRequestForZone(tenant, '/')).toEqual({ action: 'next' });
    expect(routeRequestForZone(tenant, '/api/brain/documents')).toEqual({ action: 'next' });
    expect(routeRequestForZone(tenant, '/admin')).toEqual({ action: 'notFound' });
    expect(routeRequestForZone(tenant, '/api/admin/tenants')).toEqual({ action: 'notFound' });
    expect(routeRequestForZone(tenant, '/marketing')).toEqual({ action: 'notFound' });
    expect(routeRequestForZone(tenant, '/system')).toEqual({ action: 'notFound' });
  });
});
