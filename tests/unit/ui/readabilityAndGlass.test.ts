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
});
