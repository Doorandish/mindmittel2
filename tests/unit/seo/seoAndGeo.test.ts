import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { buildRobotsForHost, MARKETING_JSON_LD } from '@/core/seo/seoPolicies';
import sitemap from '@/app/sitemap';

describe('Landing Page SEO & Generative Engine Optimization (GEO)', () => {
  const repoRoot = process.cwd();

  it('configures German B2B metadata, OpenGraph, Twitter, canonical, and accessible viewport in layout.tsx', () => {
    const layoutContent = fs.readFileSync(
      path.join(repoRoot, 'src/app/layout.tsx'),
      'utf8'
    );

    expect(layoutContent).toContain('metadataBase');
    expect(layoutContent).toContain('https://mindmittel.de');
    expect(layoutContent).toContain('openGraph');
    expect(layoutContent).toContain('twitter');
    expect(layoutContent).toContain('alternates');
    expect(layoutContent).toContain('Mittelstand');
    expect(layoutContent).toContain('BetrVG');
    expect(layoutContent).not.toContain('MindMittel V2');
    expect(layoutContent).not.toContain('Parent-Child Vector RAG');
    expect(layoutContent).not.toContain('maximumScale: 1');
  });

  it('allows search & AI crawlers on mindmittel.de while strictly blocking admin and customer tenant subdomains', () => {
    const marketingRobots = buildRobotsForHost('mindmittel.de', 'mindmittel.de');
    expect(marketingRobots.sitemap).toBe('https://mindmittel.de/sitemap.xml');
    const rulesArr = Array.isArray(marketingRobots.rules)
      ? marketingRobots.rules
      : [marketingRobots.rules];
    const agents = rulesArr.flatMap((r) =>
      Array.isArray(r.userAgent) ? r.userAgent : [r.userAgent]
    );
    expect(agents).toContain('OAI-SearchBot');
    expect(agents).toContain('PerplexityBot');
    expect(agents).toContain('ClaudeBot');

    const adminRobots = buildRobotsForHost('admin.mindmittel.de', 'mindmittel.de');
    expect(adminRobots.sitemap).toBeUndefined();
    expect(adminRobots.rules).toEqual({ userAgent: '*', disallow: '/' });

    const tenantRobots = buildRobotsForHost(
      'hsansbach.mindmittel.de',
      'mindmittel.de'
    );
    expect(tenantRobots.sitemap).toBeUndefined();
    expect(tenantRobots.rules).toEqual({ userAgent: '*', disallow: '/' });
  });

  it('generates a valid XML sitemap for mindmittel.de', () => {
    const entries = sitemap();
    expect(entries.length).toBeGreaterThanOrEqual(1);
    expect(entries[0].url).toBe('https://mindmittel.de');
  });

  it('provides a factual, code-honest public/llms.txt for AI search engines', () => {
    const llmsPath = path.join(repoRoot, 'public/llms.txt');
    expect(fs.existsSync(llmsPath)).toBe(true);
    const content = fs.readFileSync(llmsPath, 'utf8');
    expect(content).toContain('MindMittel');
    expect(content).toContain('BetrVG');
    expect(content).toContain('DSGVO');
    expect(content).toContain('EU AI Act');
    expect(content).toContain('NIS-2');
    expect(content).toContain('https://demo.mindmittel.de');
    expect(content).not.toMatch(/On-Premise-KI|Local AI/i);
  });

  it('provides an OpenGraph 1200x630 image generator and JSON-LD Schema.org structured data on marketing page', () => {
    const ogPath = path.join(repoRoot, 'src/app/opengraph-image.tsx');
    expect(fs.existsSync(ogPath)).toBe(true);
    const ogContent = fs.readFileSync(ogPath, 'utf8');
    expect(ogContent).toContain('1200');
    expect(ogContent).toContain('630');

    const marketingContent = fs.readFileSync(
      path.join(repoRoot, 'src/app/marketing/page.tsx'),
      'utf8'
    );
    expect(marketingContent).toContain('application/ld+json');
    expect(marketingContent).toContain('MARKETING_JSON_LD');

    const serializedJsonLd = JSON.stringify(MARKETING_JSON_LD);
    expect(serializedJsonLd).toContain('SoftwareApplication');
    expect(serializedJsonLd).toContain('Organization');
    expect(serializedJsonLd).toContain('FAQPage');
  });
});
