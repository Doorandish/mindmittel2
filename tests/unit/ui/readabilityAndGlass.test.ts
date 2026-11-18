import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Crisp Enterprise Light Theme, V1-Inspired Landing Page & Overflow Protection', () => {
  const rootDir = path.resolve(__dirname, '../../../');

  it('removes confusing regulatory jargon (ISO 37000, COSO, DCGK) and video demo buttons from dictionaries and UI', () => {
    const dictSource = fs.readFileSync(
      path.join(rootDir, 'src/i18n/dictionaries.ts'),
      'utf-8'
    );
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(dictSource).not.toContain('ISO 37000');
    expect(dictSource).not.toContain('COSO');
    expect(dictSource).not.toContain('DCGK');
    expect(dictSource).not.toContain('Watch 2-Min Overview');
    expect(pageSource).not.toContain('Watch 2-Min Overview');
  });

  it('includes all 5 V1-inspired landing page sections updated for V2 architecture (Hero Mockup, Problem vs Solution, 3 Steps, 4 Features, Dark CTA Banner & Footer)', () => {
    const dictSource = fs.readFileSync(
      path.join(rootDir, 'src/i18n/dictionaries.ts'),
      'utf-8'
    );

    expect(dictSource).toContain('Stop Guessing.');
    expect(dictSource).toContain('Why Traditional Management Falls Short');
    expect(dictSource).toContain('From Raw Data to Certified Audit in');
    expect(dictSource).toContain('Built for Enterprise-Grade Governance');
    expect(dictSource).toContain('Ready to Experience Real-Time');
  });

  it('enforces break-all / overflow-hidden on long file paths and API contracts in /system so text never overflows its container', () => {
    const systemPageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/system/page.tsx'),
      'utf-8'
    );

    expect(systemPageSource).toContain('break-all');
  });

  it('loads Inter and JetBrains_Mono fonts in RootLayout for high-contrast enterprise legibility', () => {
    const layoutSource = fs.readFileSync(
      path.join(rootDir, 'src/app/layout.tsx'),
      'utf-8'
    );

    expect(layoutSource).toContain('Inter');
    expect(layoutSource).toContain('JetBrains_Mono');
  });

  it('prevents browser password-manager autofill on the Super-Admin tenant provisioning form', () => {
    const adminSource = fs.readFileSync(
      path.join(rootDir, 'src/app/admin/page.tsx'),
      'utf-8'
    );

    const provisioningSection = adminSource.slice(
      adminSource.indexOf('Register New Customer Tenant')
    );

    expect(provisioningSection).toContain('autoComplete="off"');
    expect(provisioningSection).toContain('data-lpignore="true"');
    expect(provisioningSection).toContain('data-1p-ignore="true"');
    expect(provisioningSection).not.toContain('type="password"');
  });

  it('supports editing existing tenants and requires typed subdomain confirmation before deleting', () => {
    const adminSource = fs.readFileSync(
      path.join(rootDir, 'src/app/admin/page.tsx'),
      'utf-8'
    );

    expect(adminSource).toContain('editingSlug');
    expect(adminSource).toContain('startEditingTenant');
    expect(adminSource).toContain('deleteTargetSlug');
    expect(adminSource).toContain('deleteConfirmInput');
  });

  it('prevents flashing the overview landing page on tenant subdomains while resolving /api/tenant/context', () => {
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(pageSource).toContain("useState<boolean>(false);");
    expect(pageSource).toContain("if (tenantStatus === 'loading')");
    expect(pageSource.indexOf("if (tenantStatus === 'loading')")).toBeLessThan(
      pageSource.indexOf('<AppShell')
    );
  });

  it('renders the German-default executive landing page with MindMittel logo, animated flow, and zero technical jargon', () => {
    const logoPath = path.join(rootDir, 'public/images/mindmittel-logo.svg');
    expect(fs.existsSync(logoPath)).toBe(true);

    const marketingSource = fs.readFileSync(
      path.join(rootDir, 'src/app/marketing/page.tsx'),
      'utf-8'
    );

    expect(marketingSource).toContain("useState<SupportedLocale>('de')");
    expect(marketingSource).toContain('/images/mindmittel-logo.svg');
    expect(marketingSource).toContain('h-10 w-10');
    expect(marketingSource).toContain('flow-line');
    expect(marketingSource).not.toContain('MongoDB');
    expect(marketingSource).not.toContain('Parent-Child RAG');
    expect(marketingSource).not.toContain('768-d');
  });

  it('uses the MindMittel SVG logo linked to landing page, removes sidebar Home button, widens workspace, and hides technical DB/vector jargon', () => {
    const appShellSource = fs.readFileSync(
      path.join(rootDir, 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );
    const pageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/page.tsx'),
      'utf-8'
    );

    expect(appShellSource).toContain('/images/mindmittel-logo.svg');
    expect(appShellSource).toContain('landingHref');
    expect(appShellSource).not.toContain('<Home');

    expect(pageSource).toContain('max-w-6xl');
    expect(pageSource).not.toContain('768-d');
    expect(pageSource).not.toContain('Atlas Vector Store');
    expect(pageSource).not.toContain('DB: <strong>{tenantInfo.dbName}</strong>');
    expect(pageSource).not.toContain('DB: {tenantInfo.dbName}');
  });

  it('provides a high-contrast MindMittel SVG favicon in src/app/icon.svg for all subdomains', () => {
    const iconPath = path.join(rootDir, 'src/app/icon.svg');
    expect(fs.existsSync(iconPath)).toBe(true);

    const iconSource = fs.readFileSync(iconPath, 'utf-8');
    expect(iconSource).toContain('#0B3B59');
    expect(iconSource).toContain('#10B981');
  });
});
