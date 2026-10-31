import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Liquid Glass GPU Artifact Prevention & Readability Standards', () => {
  const rootDir = path.resolve(__dirname, '../../../');

  it('removes before:-inset-px pseudo-element overlays in GlassCard that cause Chrome GPU compositing lines', () => {
    const glassCardSource = fs.readFileSync(
      path.join(rootDir, 'src/components/glass/GlassCard.tsx'),
      'utf-8'
    );

    expect(glassCardSource).not.toContain('before:-inset-px');
    expect(glassCardSource).not.toContain('before:bg-gradient-to-b');
  });

  it('removes overlapping blur-3xl background orbs in AppShell and System page to eliminate tile seams', () => {
    const appShellSource = fs.readFileSync(
      path.join(rootDir, 'src/components/layout/AppShell.tsx'),
      'utf-8'
    );
    const systemPageSource = fs.readFileSync(
      path.join(rootDir, 'src/app/system/page.tsx'),
      'utf-8'
    );

    expect(appShellSource).not.toContain('blur-3xl');
    expect(systemPageSource).not.toContain('blur-3xl');
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
